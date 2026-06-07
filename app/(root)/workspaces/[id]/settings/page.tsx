import { redirect } from "next/navigation";
import {
  getUserWorkspaces,
  getWorkspaceMembers,
  getWorkspaceInvitations,
} from "@/lib/actions/workspace.actions";
import { getCurrentUser } from "@/lib/actions/user.actions";
import WorkspaceSettingsClient from "@/components/workspace/WorkspaceSettingsClient";

interface SettingsPageProps {
  params: Promise<{ id: string }>;
}

export default async function WorkspaceSettingsPage({
  params,
}: SettingsPageProps) {
  const { id: workspaceId } = await params;

  const currentUser = await getCurrentUser();
  if (!currentUser) redirect("/sign-in");

  const workspaces: WorkspaceWithRole[] = (await getUserWorkspaces()) ?? [];
  const workspace = workspaces.find((w: WorkspaceWithRole) => w.id === workspaceId);

  if (!workspace) redirect("/dashboard");

  const userRole = workspace.role;
  const members = (await getWorkspaceMembers(workspaceId)) ?? [];

  // Only fetch invitations for owner/admin
  let invitations: WorkspaceInvitation[] = [];
  if (userRole === "owner" || userRole === "admin") {
    try {
      invitations = (await getWorkspaceInvitations(workspaceId)) ?? [];
    } catch (error) {
      console.error("Failed to fetch workspace invitations:", error);
      throw error;
    }
  }

  return (
    <div className="mx-auto w-full max-w-4xl py-2">
      <WorkspaceSettingsClient
        workspace={workspace}
        userRole={userRole}
        members={members}
        invitations={invitations}
        currentUserId={currentUser.id}
      />
    </div>
  );
}
