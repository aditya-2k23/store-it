import { getUserWorkspaces } from "@/lib/actions/workspace.actions";
import { redirect } from "next/navigation";
import Image from "next/image";
import WorkspacesGrid from "@/components/WorkspacesGrid";

export const dynamic = "force-dynamic";

export default async function WorkspacesPage() {
  const workspaces: WorkspaceWithRole[] = (await getUserWorkspaces()) ?? [];

  if (workspaces.length === 0) {
    redirect("/workspaces/new");
  }

  const teamCount = workspaces.filter(
    (w: WorkspaceWithRole) => w.type === "team",
  ).length;
  const canCreateNew = teamCount < 5;

  return (
    <div className="flex min-h-screen flex-col items-center px-5 py-12">
      <Image
        src="/assets/icons/logo_brand.png"
        alt="Storey"
        width={160}
        height={160}
        priority
      />

      <h1 className="h1 mt-8 font-dynapuff font-light">Your Workspaces</h1>
      <p className="body-1 mt-2 text-light-200">
        Select a workspace to continue
      </p>

      <WorkspacesGrid workspaces={workspaces} canCreateNew={canCreateNew} />
    </div>
  );
}
