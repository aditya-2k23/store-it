import Header from "@/components/Header";
import MobileNavigation from "@/components/MobileNavigation";
import GlobalDropzoneWrapper from "@/components/GlobalDropzoneWrapper";
import { Toaster } from "@/components/ui/toaster";
import { getCurrentUser } from "@/lib/actions/user.actions";
import {
  getUserWorkspaces,
  getActiveWorkspaceId,
} from "@/lib/actions/workspace.actions";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import SplashScreen from "@/components/SplashScreen";

export const dynamic = "force-dynamic";

const Layout = async ({ children }: { children: React.ReactNode }) => {
  const { userId } = await auth();

  if (!userId) return redirect("/sign-in");

  const currentUser = await getCurrentUser();

  if (!currentUser) return redirect("/sign-in");

  // Workspace guard
  const activeWorkspaceId = await getActiveWorkspaceId();
  if (!activeWorkspaceId) return redirect("/workspaces");

  const workspaces: WorkspaceWithRole[] = (await getUserWorkspaces()) ?? [];

  // Verify user is actually a member of the active workspace
  const activeWorkspace = workspaces.find((w: WorkspaceWithRole) => w.id === activeWorkspaceId);
  if (!activeWorkspace) return redirect("/workspaces");

  return (
    <>
      <SplashScreen />
      <main className="app-shell">
        <Sidebar
          workspaces={workspaces}
          activeWorkspaceId={activeWorkspaceId}
        />

        <section className="app-shell-content">
          <MobileNavigation
            fullName={currentUser.fullName}
            email={currentUser.email}
            activeWorkspaceName={activeWorkspace.name}
            activeWorkspaceType={activeWorkspace.type}
          />
          <Header />
          <GlobalDropzoneWrapper className="flex-1 min-h-0 relative flex flex-col">
            <div className="main-content">
              {children}
            </div>
          </GlobalDropzoneWrapper>
        </section>

        <Toaster />
      </main>
    </>
  );
};

export default Layout;
