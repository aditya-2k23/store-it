import { getUserWorkspaces } from "@/lib/actions/workspace.actions";
import { redirect } from "next/navigation";
import Image from "next/image";
import WorkspacesGrid from "@/components/WorkspacesGrid";
import ClerkUserButton from "@/components/ClerkUserButton";
import { APP_VERSION } from "@/constants";

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
    <div className="relative flex min-h-screen flex-col items-center px-5 py-12">
      <div className="absolute top-6 right-6">
        <ClerkUserButton />
      </div>

      <div className="relative">
        <Image
          src="/assets/icons/logo_brand.png"
          alt="Storey"
          width={160}
          height={160}
          priority
        />
        <span className="absolute bottom-3 right-0 text-[10px] font-bold text-brand">
          {APP_VERSION}
        </span>
      </div>

      <h1 className="h1 mt-8 font-dynapuff font-light">Your Workspaces</h1>
      <p className="body-1 mt-2 text-light-200">
        Select a workspace to continue
      </p>

      <WorkspacesGrid workspaces={workspaces} canCreateNew={canCreateNew} />
    </div>
  );
}
