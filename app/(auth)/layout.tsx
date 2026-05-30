import { Toaster } from "@/components/ui/toaster";
import Image from "next/image";
import React from "react";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

const Layout = async ({ children }: { children: React.ReactNode }) => {
  const { userId } = await auth();
  
  if (userId) {
    redirect("/dashboard");
  }

  return (
    <div className="flex min-h-screen overflow-hidden">
      <section className="bg-brand p-10 hidden w-1/2 items-center justify-center lg:flex xl:w-2/5">
        <div className="flex max-h-200 max-w-107.5 flex-col justify-center space-y-12">
          <div
            className="relative w-fit flex items-center justify-center mr-auto"
            style={{ filter: "drop-shadow(0px 2px 4px rgba(0, 0, 0, 0.1))" }}
          >
            {/* SVG definition for the clip path */}
            <svg width="0" height="0" className="absolute">
              <defs>
                <clipPath id="cloudShape" clipPathUnits="objectBoundingBox">
                  <path d="M0.15 0.9 C0.05 0.9 0 0.8 0 0.65 C0 0.5 0.1 0.4 0.25 0.4 C0.3 0.15 0.5 0 0.7 0.15 C0.85 0.05 1 0.2 1 0.45 C1 0.7 0.85 0.9 0.7 0.9 Z" />
                </clipPath>
              </defs>
            </svg>

            <div
              className="absolute bg-white"
              style={{
                clipPath: "url(#cloudShape)",
                width: "200px",
                height: "110px",
              }}
            />

            <Image
              src="/assets/icons/logo_brand.png"
              alt="Storey"
              width={200}
              height={200}
              className="relative z-10 pt-2"
              priority
            />
          </div>

          <div className="space-y-5 text-white">
            <h1 className="h1 font-dynapuff">Manage your files the best way</h1>
            <p className="body-1">
              Storey is the place where you can store and organize all your
              documents.
            </p>
          </div>

          <Image
            src="/assets/images/files-2.png"
            alt="Files"
            width={345}
            height={345}
            priority
          />
        </div>
      </section>

      <section className="flex flex-1 flex-col items-center bg-white p-4 py-10 lg:justify-center lg:p-10 lg:py-0">
        <div className="mb-16 lg:hidden">
          <Image
            src="/assets/icons/logo_brand.png"
            alt="Storey"
            width={180}
            height={60}
            className="h-auto w-auto"
            priority
          />
        </div>
        {children}
      </section>

      <Toaster />
    </div>
  );
};

export default Layout;
