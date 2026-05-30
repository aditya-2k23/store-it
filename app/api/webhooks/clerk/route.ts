import { NextResponse } from "next/server";
import type { WebhookEvent } from "@clerk/nextjs/server";
import { Webhook } from "svix";
import { createClient } from "@supabase/supabase-js";

const mapRole = (clerkRole: string): string => {
  switch (clerkRole) {
    case "org:admin":
      return "admin";
    case "org:member":
      return "member";
    default:
      return "member";
  }
};

export async function POST(req: Request) {
  const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!webhookSecret || !supabaseUrl || !supabaseServiceRoleKey) {
    return NextResponse.json(
      { error: "Missing webhook or Supabase configuration" },
      { status: 500 },
    );
  }

  const wh = new Webhook(webhookSecret);
  const payload = await req.text();
  const headers = {
    "svix-id": req.headers.get("svix-id") ?? "",
    "svix-timestamp": req.headers.get("svix-timestamp") ?? "",
    "svix-signature": req.headers.get("svix-signature") ?? "",
  };

  let event: WebhookEvent;
  try {
    event = wh.verify(payload, headers) as WebhookEvent;
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

  try {
    switch (event.type) {
      case "user.created": {
        const data = event.data as {
          id: string;
          email_addresses: { email_address: string }[];
          first_name: string | null;
          last_name: string | null;
          image_url: string | null;
          username?: string | null;
        };

        const email = data.email_addresses?.[0]?.email_address;
        const fullName =
          `${data.first_name ?? ""} ${data.last_name ?? ""}`.trim();
        const avatarUrl = data.image_url ?? null;
        const username = data.username ?? null;

        const upsertPayload = {
          clerk_id: data.id,
          email,
          full_name: fullName,
          avatar_url: avatarUrl,
          username,
        };

        let userRecord: { id: string; full_name: string | null } | null = null;

        const { data: user, error: userError } = await supabase
          .from("users")
          .upsert(upsertPayload, { onConflict: "clerk_id" })
          .select("id, full_name")
          .single();

        if (userError?.code === "23505") {
          const { data: mergedUser, error: mergeError } = await supabase
            .from("users")
            .update(upsertPayload)
            .eq("email", email)
            .select("id, full_name")
            .single();

          if (mergeError) {
            console.error("user.created: users merge failed", mergeError);
            return NextResponse.json(
              { error: "Database error" },
              { status: 500 },
            );
          }

          userRecord = mergedUser;
        } else if (userError) {
          console.error("user.created: users upsert failed", userError);
          return NextResponse.json(
            { error: "Database error" },
            { status: 500 },
          );
        } else {
          userRecord = user;
        }

        if (!userRecord) {
          console.error("user.created: user record missing");
          return NextResponse.json(
            { error: "Database error" },
            { status: 500 },
          );
        }

        const { data: existingWorkspace, error: workspaceLookupError } =
          await supabase
            .from("workspaces")
            .select("id")
            .eq("owner_id", userRecord.id)
            .eq("type", "personal")
            .maybeSingle();

        if (workspaceLookupError) {
          console.error(
            "user.created: workspace lookup failed",
            workspaceLookupError,
          );
          return NextResponse.json(
            { error: "Database error" },
            { status: 500 },
          );
        }

        let workspaceId = existingWorkspace?.id;

        if (!workspaceId) {
          const { data: workspace, error: workspaceError } = await supabase
            .from("workspaces")
            .insert({
              name: `${userRecord.full_name ?? "My"}'s Workspace`,
              type: "personal",
              owner_id: userRecord.id,
            })
            .select("id")
            .single();

          if (workspaceError) {
            console.error(
              "user.created: workspace insert failed",
              workspaceError,
            );
            return NextResponse.json(
              { error: "Database error" },
              { status: 500 },
            );
          }

          workspaceId = workspace.id;
        }

        const { error: memberError } = await supabase
          .from("workspace_members")
          .upsert(
            {
              workspace_id: workspaceId,
              user_id: userRecord.id,
              role: "owner",
            },
            { onConflict: "workspace_id,user_id" },
          );

        if (memberError) {
          console.error(
            "user.created: workspace_members upsert failed",
            memberError,
          );
          return NextResponse.json(
            { error: "Database error" },
            { status: 500 },
          );
        }

        break;
      }
      case "user.updated": {
        const data = event.data as {
          id: string;
          email_addresses: { email_address: string }[];
          first_name: string | null;
          last_name: string | null;
          image_url: string | null;
          username?: string | null;
        };

        const email = data.email_addresses?.[0]?.email_address;
        const fullName =
          `${data.first_name ?? ""} ${data.last_name ?? ""}`.trim();
        const avatarUrl = data.image_url ?? null;
        const username = data.username ?? null;

        const { error } = await supabase
          .from("users")
          .update({
            email,
            full_name: fullName,
            avatar_url: avatarUrl,
            username,
          })
          .eq("clerk_id", data.id);

        if (error) {
          console.error("user.updated: users update failed", error);
          return NextResponse.json(
            { error: "Database error" },
            { status: 500 },
          );
        }

        break;
      }
      case "user.deleted": {
        const data = event.data as { id: string };

        const { error } = await supabase
          .from("users")
          .update({
            email: `deleted_${data.id}@storey.deleted`,
            full_name: "Deleted User",
            avatar_url: null,
          })
          .eq("clerk_id", data.id);

        if (error) {
          console.error("user.deleted: users update failed", error);
          return NextResponse.json(
            { error: "Database error" },
            { status: 500 },
          );
        }

        break;
      }
      case "organization.created": {
        const data = event.data as {
          id: string;
          name: string;
          created_by: string;
        };

        const { data: owner, error: ownerError } = await supabase
          .from("users")
          .select("id")
          .eq("clerk_id", data.created_by)
          .maybeSingle();

        if (ownerError) {
          console.error(
            "organization.created: owner lookup failed",
            ownerError,
          );
          return NextResponse.json(
            { error: "Database error" },
            { status: 500 },
          );
        }

        const { data: workspace, error: workspaceError } = await supabase
          .from("workspaces")
          .upsert(
            {
              name: data.name,
              type: "team",
              owner_id: owner?.id ?? null,
              clerk_org_id: data.id,
            },
            { onConflict: "clerk_org_id" },
          )
          .select("id")
          .single();

        if (workspaceError) {
          console.error(
            "organization.created: workspace upsert failed",
            workspaceError,
          );
          return NextResponse.json(
            { error: "Database error" },
            { status: 500 },
          );
        }

        if (owner?.id) {
          const { error: memberError } = await supabase
            .from("workspace_members")
            .upsert(
              {
                workspace_id: workspace.id,
                user_id: owner.id,
                role: "owner",
              },
              { onConflict: "workspace_id,user_id" },
            );

          if (memberError) {
            console.error(
              "organization.created: workspace_members upsert failed",
              memberError,
            );
            return NextResponse.json(
              { error: "Database error" },
              { status: 500 },
            );
          }
        }

        break;
      }
      case "organizationMembership.created": {
        const data = event.data as {
          organization: { id: string };
          public_user_data: { user_id: string };
          role: string;
        };

        const { data: workspace, error: workspaceError } = await supabase
          .from("workspaces")
          .select("id")
          .eq("clerk_org_id", data.organization.id)
          .maybeSingle();

        if (workspaceError) {
          console.error(
            "organizationMembership.created: workspace lookup failed",
            workspaceError,
          );
          return NextResponse.json(
            { error: "Database error" },
            { status: 500 },
          );
        }

        if (!workspace) {
          console.warn(
            "organizationMembership.created: workspace missing",
            data.organization.id,
          );
          return NextResponse.json({ received: true }, { status: 200 });
        }

        const { data: user, error: userError } = await supabase
          .from("users")
          .select("id")
          .eq("clerk_id", data.public_user_data.user_id)
          .maybeSingle();

        if (userError) {
          console.error(
            "organizationMembership.created: user lookup failed",
            userError,
          );
          return NextResponse.json(
            { error: "Database error" },
            { status: 500 },
          );
        }

        if (!user) {
          console.warn(
            "organizationMembership.created: user missing",
            data.public_user_data.user_id,
          );
          return NextResponse.json({ received: true }, { status: 200 });
        }

        const { error: membershipError } = await supabase
          .from("workspace_members")
          .upsert(
            {
              workspace_id: workspace.id,
              user_id: user.id,
              role: mapRole(data.role),
            },
            { onConflict: "workspace_id,user_id" },
          );

        if (membershipError) {
          console.error(
            "organizationMembership.created: upsert failed",
            membershipError,
          );
          return NextResponse.json(
            { error: "Database error" },
            { status: 500 },
          );
        }

        break;
      }
      case "organizationMembership.updated": {
        const data = event.data as {
          organization: { id: string };
          public_user_data: { user_id: string };
          role: string;
        };

        const { data: workspace, error: workspaceError } = await supabase
          .from("workspaces")
          .select("id")
          .eq("clerk_org_id", data.organization.id)
          .maybeSingle();

        if (workspaceError) {
          console.error(
            "organizationMembership.updated: workspace lookup failed",
            workspaceError,
          );
          return NextResponse.json(
            { error: "Database error" },
            { status: 500 },
          );
        }

        if (!workspace) {
          console.warn(
            "organizationMembership.updated: workspace missing",
            data.organization.id,
          );
          return NextResponse.json({ received: true }, { status: 200 });
        }

        const { data: user, error: userError } = await supabase
          .from("users")
          .select("id")
          .eq("clerk_id", data.public_user_data.user_id)
          .maybeSingle();

        if (userError) {
          console.error(
            "organizationMembership.updated: user lookup failed",
            userError,
          );
          return NextResponse.json(
            { error: "Database error" },
            { status: 500 },
          );
        }

        if (!user) {
          console.warn(
            "organizationMembership.updated: user missing",
            data.public_user_data.user_id,
          );
          return NextResponse.json({ received: true }, { status: 200 });
        }

        const { error: membershipError } = await supabase
          .from("workspace_members")
          .update({ role: mapRole(data.role) })
          .eq("workspace_id", workspace.id)
          .eq("user_id", user.id);

        if (membershipError) {
          console.error(
            "organizationMembership.updated: update failed",
            membershipError,
          );
          return NextResponse.json(
            { error: "Database error" },
            { status: 500 },
          );
        }

        break;
      }
      case "organizationMembership.deleted": {
        const data = event.data as {
          organization: { id: string };
          public_user_data: { user_id: string };
        };

        const { data: workspace, error: workspaceError } = await supabase
          .from("workspaces")
          .select("id")
          .eq("clerk_org_id", data.organization.id)
          .maybeSingle();

        if (workspaceError) {
          console.error(
            "organizationMembership.deleted: workspace lookup failed",
            workspaceError,
          );
          return NextResponse.json(
            { error: "Database error" },
            { status: 500 },
          );
        }

        if (!workspace) {
          console.warn(
            "organizationMembership.deleted: workspace missing",
            data.organization.id,
          );
          return NextResponse.json({ received: true }, { status: 200 });
        }

        const { data: user, error: userError } = await supabase
          .from("users")
          .select("id")
          .eq("clerk_id", data.public_user_data.user_id)
          .maybeSingle();

        if (userError) {
          console.error(
            "organizationMembership.deleted: user lookup failed",
            userError,
          );
          return NextResponse.json(
            { error: "Database error" },
            { status: 500 },
          );
        }

        if (!user) {
          console.warn(
            "organizationMembership.deleted: user missing",
            data.public_user_data.user_id,
          );
          return NextResponse.json({ received: true }, { status: 200 });
        }

        const { error: membershipError } = await supabase
          .from("workspace_members")
          .delete()
          .eq("workspace_id", workspace.id)
          .eq("user_id", user.id);

        if (membershipError) {
          console.error(
            "organizationMembership.deleted: delete failed",
            membershipError,
          );
          return NextResponse.json(
            { error: "Database error" },
            { status: 500 },
          );
        }

        break;
      }
      case "organization.deleted": {
        const data = event.data as { id: string };

        const { error } = await supabase
          .from("workspaces")
          .delete()
          .eq("clerk_org_id", data.id);

        if (error) {
          console.error("organization.deleted: delete failed", error);
          return NextResponse.json(
            { error: "Database error" },
            { status: 500 },
          );
        }

        break;
      }
      default:
        return NextResponse.json({ received: true }, { status: 200 });
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error) {
    console.error("clerk webhook handler failed", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
