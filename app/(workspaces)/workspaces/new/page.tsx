"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  createWorkspace,
  setActiveWorkspace,
} from "@/lib/actions/workspace.actions";
import { toast } from "@/hooks/use-toast";

const formSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(50, "Name must be at most 50 characters"),
});

type FormValues = z.infer<typeof formSchema>;

export default function NewWorkspacePage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: { name: "" },
  });

  const nameValue = watch("name");
  const slugPreview = nameValue
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  const onSubmit = (data: FormValues) => {
    startTransition(async () => {
      try {
        const result = await createWorkspace(data.name);
        if (result?.id) {
          await setActiveWorkspace(result.id);
          toast({
            description: (
              <p className="body-2 text-white">
                Workspace <span className="font-semibold">{data.name}</span>{" "}
                created successfully.
              </p>
            ),
            className: "success-toast",
          });
          router.push("/dashboard");
        }
      } catch (error: any) {
        const message =
          error?.message?.includes("limit")
            ? "You've reached the 5 workspace limit"
            : "Failed to create workspace. Please try again.";
        toast({
          description: <p className="body-2 text-white">{message}</p>,
          className: "error-toast",
        });
      }
    });
  };

  return (
    <div className="flex min-h-screen overflow-hidden">
      {/* Left panel — matches auth layout */}
      <section className="hidden w-1/2 items-center justify-center bg-brand p-10 lg:flex xl:w-2/5">
        <div className="flex max-h-200 max-w-107.5 flex-col justify-center space-y-12">
          <div
            className="relative mr-auto flex w-fit items-center justify-center"
            style={{ filter: "drop-shadow(0px 2px 4px rgba(0, 0, 0, 0.1))" }}
          >
            <svg width="0" height="0" className="absolute">
              <defs>
                <clipPath id="cloudShapeNew" clipPathUnits="objectBoundingBox">
                  <path d="M0.15 0.9 C0.05 0.9 0 0.8 0 0.65 C0 0.5 0.1 0.4 0.25 0.4 C0.3 0.15 0.5 0 0.7 0.15 C0.85 0.05 1 0.2 1 0.45 C1 0.7 0.85 0.9 0.7 0.9 Z" />
                </clipPath>
              </defs>
            </svg>
            <div
              className="absolute bg-white"
              style={{
                clipPath: "url(#cloudShapeNew)",
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
              loading="eager"
              priority
            />
          </div>

          <div className="space-y-5 text-white">
            <h1 className="h1 font-dynapuff">Create a team workspace</h1>
            <p className="body-1">
              Collaborate with your team. Share files, manage access, and stay
              organized together.
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

      {/* Right panel — form */}
      <section className="flex flex-1 flex-col items-center bg-white p-4 py-10 lg:justify-center lg:p-10 lg:py-0">
        <div className="mb-16 lg:hidden">
          <Image
            src="/assets/icons/logo_brand.png"
            alt="Storey"
            width={180}
            height={180}
            loading="eager"
            priority
          />
        </div>

        <div className="w-full max-w-md">
          <h2 className="h2 mb-2 text-dark-100">New Workspace</h2>
          <p className="body-2 mb-8 text-light-200">
            Give your team workspace a name to get started.
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <label className="body-2 mb-2 block font-medium text-light-100">
                Workspace name
              </label>
              <Input
                {...register("name")}
                placeholder="e.g. Design Team"
                className="h-11 rounded-xl border border-light-300 px-4 text-sm"
                autoFocus
              />
              {errors.name && (
                <p className="shad-form-message mt-1">{errors.name.message}</p>
              )}
              {slugPreview && (
                <p className="caption mt-2 text-light-200">
                  Workspace URL preview:{" "}
                  <span className="font-medium text-light-100">
                    {slugPreview}
                  </span>
                </p>
              )}
            </div>

            <Button
              type="submit"
              disabled={isPending}
              className="primary-btn h-12 w-full gap-2 text-white"
            >
              {isPending ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Creating…
                </>
              ) : (
                <>
                  Create Workspace
                  <ArrowRight className="size-4" />
                </>
              )}
            </Button>
          </form>

          <Link
            href="/workspaces"
            className="caption mt-6 inline-flex items-center gap-1.5 font-medium text-brand transition-colors hover:text-brand-100"
          >
            <ArrowLeft className="size-3" />
            Back to workspaces
          </Link>
        </div>
      </section>
    </div>
  );
}
