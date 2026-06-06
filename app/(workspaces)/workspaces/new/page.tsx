"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Loader2, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  createWorkspace,
  setActiveWorkspace,
  createInviteLink,
} from "@/lib/actions/workspace.actions";
import { toast } from "@/hooks/use-toast";
import { WorkspaceAvatar } from "@/components/workspace/WorkspaceAvatar";
import {
  WORKSPACE_ICONS,
  WORKSPACE_EMOJIS,
  WORKSPACE_THEME_COLORS,
} from "@/lib/workspace-icons";
import { cn } from "@/lib/utils";

const formSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Workspace name is required")
    .max(50, "Name must be at most 50 characters"),
  expectedMembers: z.string().optional(),
  icon: z.string().optional(),
  themeColor: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface InviteLinkResult {
  id: string;
  inviteUrl: string;
}

export default function NewWorkspacePage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Success state handling
  const [createdWorkspace, setCreatedWorkspace] = useState<any>(null);
  const [inviteLink, setInviteLink] = useState<{
    url: string;
    id: string;
  } | null>(null);
  const [generatingLink, setGeneratingLink] = useState(false);
  const [copied, setCopied] = useState(false);
  const [selectedRole, setSelectedRole] = useState<
    "admin" | "editor" | "viewer"
  >("viewer");

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    control,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      expectedMembers: "just_me",
      icon: "lucide:building2",
      themeColor: "#FA7275",
    },
  });

  const nameValue = watch("name");
  const expectedMembersValue = watch("expectedMembers");
  const iconValue = watch("icon");
  const themeColorValue = watch("themeColor");

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
        const result = await createWorkspace(
          data.name,
          data.expectedMembers,
          data.icon,
          data.themeColor,
        );
        if (result?.id) {
          await setActiveWorkspace(result.id);
          setCreatedWorkspace({ ...data, ...result });
          toast({
            description: (
              <p className="body-2 text-white">
                Workspace <span className="font-semibold">{data.name}</span>{" "}
                created successfully.
              </p>
            ),
            className: "success-toast",
          });
        }
      } catch (error: any) {
        const message = error?.message?.includes("limit")
          ? "You've reached the 5 workspace limit"
          : "Failed to create workspace. Please try again.";
        toast({
          description: <p className="body-2 text-white">{message}</p>,
          className: "error-toast",
        });
      }
    });
  };

  const handleGenerateLink = async () => {
    if (!createdWorkspace) return;
    setGeneratingLink(true);
    try {
      const result = await createInviteLink(createdWorkspace.id, selectedRole);
      if (result) {
        const { id, inviteUrl } = result as InviteLinkResult;
        setInviteLink({
          url: `${window.location.origin}${inviteUrl}`,
          id: id,
        });
      }
    } catch {
      toast({
        description: (
          <p className="body-2 text-white">Failed to generate link.</p>
        ),
        className: "error-toast",
      });
    } finally {
      setGeneratingLink(false);
    }
  };

  const handleCopy = async () => {
    if (!inviteLink) return;
    try {
      await navigator.clipboard.writeText(inviteLink.url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({
        description: <p className="body-2 text-white">Failed to copy.</p>,
        className: "error-toast",
      });
    }
  };

  if (createdWorkspace) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-light-400/30 p-4">
        <div className="w-full max-w-md rounded-2xl border border-light-300 bg-white p-8 shadow-drop-1">
          <div className="mb-8 flex flex-col items-center text-center">
            <WorkspaceAvatar
              name={createdWorkspace.name}
              icon={createdWorkspace.icon}
              themeColor={createdWorkspace.themeColor}
              className="mb-4 size-20 text-3xl"
              iconClassName="size-10"
            />
            <h2 className="h2 text-dark-100">
              Welcome to {createdWorkspace.name}!
            </h2>
            <p className="body-2 mt-2 text-light-200">
              Your workspace is ready. Let's get to work.
            </p>
          </div>

          {expectedMembersValue !== "just_me" && (
            <div className="mb-8 rounded-xl border border-light-300 bg-light-400/20 p-5">
              <h3 className="h3 mb-1 text-dark-100">Invite your team</h3>
              <p className="caption mb-4 text-light-200">
                Share this link to let others join your workspace.
              </p>

              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Select
                    value={selectedRole}
                    onValueChange={(val) => {
                      setSelectedRole(val as any);
                      setInviteLink(null); // Invalidate previous link
                    }}
                  >
                    <SelectTrigger className="h-10 w-[110px] rounded-lg border-light-300 capitalize text-sm focus-visible:border-brand focus-visible:ring-brand">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin" className="cursor-pointer">
                        Admin
                      </SelectItem>
                      <SelectItem value="editor" className="cursor-pointer">
                        Editor
                      </SelectItem>
                      <SelectItem value="viewer" className="cursor-pointer">
                        Viewer
                      </SelectItem>
                    </SelectContent>
                  </Select>

                  <Button
                    onClick={handleGenerateLink}
                    disabled={generatingLink}
                    className="h-10 flex-1 bg-brand text-white hover:bg-brand-100 cursor-pointer"
                  >
                    {generatingLink ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      "Generate Link"
                    )}
                  </Button>
                </div>

                {inviteLink && (
                  <div className="flex items-center gap-2 mt-2">
                    <Input
                      value={inviteLink.url}
                      readOnly
                      className="h-10 flex-1 rounded-lg border-light-300 bg-white px-3 text-sm text-light-100 focus-visible:border-brand focus-visible:ring-brand"
                    />
                    <Button
                      onClick={handleCopy}
                      variant="outline"
                      className="h-10 w-24 gap-1.5 rounded-lg border-light-300 px-3 cursor-pointer"
                    >
                      {copied ? (
                        <>
                          <Check className="size-3.5 text-green" />
                          Copied
                        </>
                      ) : (
                        <>
                          <Copy className="size-3.5" />
                          Copy
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}

          <Button
            onClick={() => router.push("/dashboard")}
            className="primary-btn h-12 w-full text-white cursor-pointer"
          >
            Go to Dashboard
            <ArrowRight className="ml-2 size-4" />
          </Button>

          <p className="caption mt-4 text-center text-light-200">
            You can always invite members later in Workspace Settings.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Left panel */}
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

      {/* Right panel */}
      <section className="flex flex-1 flex-col items-center bg-white p-4 py-10 lg:py-14 overflow-y-auto">
        <div className="mb-10 lg:hidden">
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
            Set up your team's space to get started.
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Live Preview */}
            <div className="flex items-center gap-4 rounded-xl border border-light-300 bg-light-400/20 p-4">
              <WorkspaceAvatar
                name={nameValue || "Workspace"}
                icon={iconValue}
                themeColor={themeColorValue}
                className="size-14 text-2xl shadow-sm"
                iconClassName="size-7"
              />
              <div className="flex-1 min-w-0">
                <p className="body-1 truncate font-semibold text-dark-100">
                  {nameValue || "Workspace Name"}
                </p>
                <p className="caption truncate text-light-200">
                  storey.app/workspace/{slugPreview || "workspace-name"}
                </p>
              </div>
            </div>

            <div>
              <label className="body-2 mb-2 block font-medium text-light-100">
                Workspace name
              </label>
              <Input
                {...register("name")}
                placeholder="e.g. Design Team"
                className="h-11 rounded-xl border border-light-300 px-4 text-sm focus-visible:border-brand focus-visible:ring-brand"
                autoFocus
              />
              {errors.name && (
                <p className="shad-form-message mt-1">{errors.name.message}</p>
              )}
            </div>

            <div>
              <label className="body-2 mb-2 block font-medium text-light-100">
                Expected Team Size
              </label>
              <Controller
                control={control}
                name="expectedMembers"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="h-11 rounded-xl border border-light-300 px-4 text-sm focus:border-brand focus:ring-brand cursor-pointer">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="just_me" className="cursor-pointer">
                        Just me
                      </SelectItem>
                      <SelectItem value="2_to_5" className="cursor-pointer">
                        2 - 5 members
                      </SelectItem>
                      <SelectItem value="6_to_20" className="cursor-pointer">
                        6 - 20 members
                      </SelectItem>
                      <SelectItem value="20_plus" className="cursor-pointer">
                        20+ members
                      </SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <div>
              <label className="body-2 mb-2 block font-medium text-light-100">
                Workspace Identity
              </label>

              {/* Color Picker */}
              <div className="mb-4 flex flex-wrap gap-2">
                {WORKSPACE_THEME_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    aria-label={`Select theme color ${color}`}
                    aria-pressed={themeColorValue === color}
                    onClick={() => setValue("themeColor", color)}
                    className={cn(
                      "size-8 rounded-full transition-transform hover:scale-110 cursor-pointer",
                      themeColorValue === color
                        ? "ring-2 ring-brand ring-offset-2 scale-110"
                        : "",
                    )}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>

              {/* Icon Picker */}
              <Tabs defaultValue="icons" className="w-full">
                <TabsList className="w-full grid grid-cols-2 bg-light-400">
                  <TabsTrigger value="icons" className="cursor-pointer">
                    Icons
                  </TabsTrigger>
                  <TabsTrigger value="emojis" className="cursor-pointer">
                    Emojis
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="icons" className="mt-3">
                  <div className="grid grid-cols-6 gap-2">
                    {Object.entries(WORKSPACE_ICONS).map(([name, Icon]) => {
                      const iconKey = `lucide:${name}`;
                      const isSelected = iconValue === iconKey;
                      return (
                        <button
                          key={name}
                          type="button"
                          aria-label={name}
                          aria-pressed={isSelected}
                          onClick={() => setValue("icon", iconKey)}
                          className={cn(
                            "flex aspect-square items-center justify-center rounded-lg border transition-colors cursor-pointer",
                            isSelected
                              ? "border-brand bg-brand/10 text-brand"
                              : "border-light-300 bg-white text-light-100 hover:bg-light-400",
                          )}
                        >
                          <Icon className="size-5" />
                        </button>
                      );
                    })}
                  </div>
                </TabsContent>
                <TabsContent value="emojis" className="mt-3">
                  <div className="grid grid-cols-6 gap-2">
                    {WORKSPACE_EMOJIS.map((emoji) => {
                      const iconKey = `emoji:${emoji}`;
                      const isSelected = iconValue === iconKey;
                      return (
                        <button
                          key={emoji}
                          type="button"
                          aria-label={`Emoji ${emoji}`}
                          aria-pressed={isSelected}
                          onClick={() => setValue("icon", iconKey)}
                          className={cn(
                            "flex aspect-square items-center justify-center rounded-lg border text-xl transition-colors cursor-pointer",
                            isSelected
                              ? "border-brand bg-brand/10"
                              : "border-light-300 bg-white hover:bg-light-400",
                          )}
                        >
                          {emoji}
                        </button>
                      );
                    })}
                  </div>
                </TabsContent>
              </Tabs>
            </div>

            <Button
              type="submit"
              disabled={isPending}
              className="primary-btn h-12 w-full gap-2 text-white cursor-pointer"
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
