import { redirect } from "next/navigation";
import {
  getUserWorkspaces,
  getWorkspaceMembers,
  getWorkspaceInvitations,
} from "@/lib/actions/workspace.actions";
import { getCurrentUser } from "@/lib/actions/user.actions";
import { getWorkspaceActivity } from "@/lib/actions/activity.actions";
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

  // Fetch members, invitations (role-gated), and initial activity in parallel
  const [membersResult, activityResult] = await Promise.all([
    getWorkspaceMembers(workspaceId),
    getWorkspaceActivity(workspaceId).catch((err) => {
      console.error("Failed to fetch workspace activity:", err);
      return null;
    }),
  ]);

  const members = membersResult ?? [];

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

  const initialActivity: ActivityLogItem[] = activityResult?.items ?? [];
  const initialCursor = activityResult?.nextCursor ?? null;

  return (
    <div className="mx-auto w-full max-w-4xl py-2">
      <WorkspaceSettingsClient
        workspace={workspace}
        userRole={userRole}
        members={members}
        invitations={invitations}
        currentUserId={currentUser.id}
        initialActivity={initialActivity}
        initialCursor={initialCursor}
      />
    </div>
  );
}
