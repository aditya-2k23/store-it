import Header from "@/components/Header";
import MobileNavigation from "@/components/MobileNavigation";
import Sidebar from "@/components/Sidebar";
import GlobalDropzoneWrapper from "@/components/GlobalDropzoneWrapper";
import { Toaster } from "@/components/ui/toaster";
import { getCurrentUser } from "@/lib/actions/user.actions";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import React from "react";

export const dynamic = "force-dynamic";

const Layout = async ({ children }: { children: React.ReactNode }) => {
  const { userId } = await auth();

  if (!userId) return redirect("/sign-in");

  const currentUser = await getCurrentUser();

  if (!currentUser) return redirect("/sign-in");

  return (
    <>
      <main className="app-shell">
        <Sidebar
          fullName={currentUser.fullName}
          avatar={currentUser.avatarUrl}
        />
        <section className="app-shell-content">
          <MobileNavigation
            fullName={currentUser.fullName}
            email={currentUser.email}
            avatar={currentUser.avatarUrl}
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
