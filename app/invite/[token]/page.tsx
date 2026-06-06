import { validateInviteToken } from "@/lib/actions/workspace.actions";
import { auth } from "@clerk/nextjs/server";
import { Toaster } from "@/components/ui/toaster";
import Image from "next/image";
import Link from "next/link";
import { AlertCircle } from "lucide-react";
import AcceptInviteButtons from "@/components/AcceptInviteButtons";

const roleBadgeStyles: Record<string, string> = {
  owner: "bg-brand/10 text-brand",
  admin: "bg-blue/10 text-blue",
  editor: "bg-green/10 text-green",
  viewer: "bg-light-300 text-light-100",
};

interface InvitePageProps {
  params: Promise<{ token: string }>;
}

export default async function InvitePage({ params }: InvitePageProps) {
  const { token } = await params;
  const validation = await validateInviteToken(token);
  const { userId } = await auth();

  // State A — Invalid token
  if (!validation?.valid) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-light-400/50 p-4">
        <div className="w-full max-w-sm rounded-[30px] border border-light-300 bg-white p-10 shadow-drop-1 text-center">
          <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-red/10">
            <AlertCircle className="size-8 text-red" />
          </div>
          <h2 className="h2 text-dark-100">This invite link is invalid</h2>
          <p className="body-1 mt-3 text-light-100">
            {validation?.reason || "This invite link may have expired or been revoked."}
          </p>
          <Link
            href="/"
            className="primary-btn mt-6 inline-flex h-11 items-center justify-center rounded-full px-8 text-white"
          >
            Go to Storey
          </Link>
        </div>
        <Toaster />
      </div>
    );
  }

  const { workspaceName, role } = validation;

  // State B — Valid token, user not signed in
  if (!userId) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-light-400/50 p-4">
        <div className="w-full max-w-sm rounded-[30px] border border-light-300 bg-white p-10 shadow-drop-1 text-center">
          <Image
            src="/assets/icons/logo_brand.png"
            alt="Storey"
            width={120}
            height={120}
            className="mx-auto"
            priority
          />

          <p className="caption mt-6 text-light-200">
            You&apos;ve been invited to join
          </p>
          <h2 className="h2 mt-1 font-dynapuff text-dark-100">
            {workspaceName}
          </h2>

          <span
            className={`mt-3 inline-block rounded-full px-3 py-1 text-xs font-semibold capitalize ${
              roleBadgeStyles[role as string] || "bg-light-300 text-light-100"
            }`}
          >
            Joining as {role}
          </span>

          <div className="mt-8 space-y-3">
            <Link
              href={`/sign-in?redirect=/invite/${token}`}
              className="primary-btn flex h-12 w-full items-center justify-center rounded-full text-white"
            >
              Sign in to accept
            </Link>
            <p className="caption text-light-200">
              Don&apos;t have an account?{" "}
              <Link
                href={`/sign-up?redirect=/invite/${token}`}
                className="font-semibold text-brand hover:text-brand-100"
              >
                Sign up
              </Link>
            </p>
          </div>
        </div>
        <Toaster />
      </div>
    );
  }

  // State C — Valid token, user signed in
  return (
    <div className="flex min-h-screen items-center justify-center bg-light-400/50 p-4">
      <div className="w-full max-w-sm rounded-[30px] border border-light-300 bg-white p-10 shadow-drop-1 text-center">
        <Image
          src="/assets/icons/logo_brand.png"
          alt="Storey"
          width={120}
          height={120}
          className="mx-auto"
          priority
        />

        <p className="caption mt-6 text-light-200">
          You&apos;ve been invited to join
        </p>
        <h2 className="h2 mt-1 font-dynapuff text-dark-100">
          {workspaceName}
        </h2>

        <span
          className={`mt-3 inline-block rounded-full px-3 py-1 text-xs font-semibold capitalize ${
            roleBadgeStyles[role as string] || "bg-light-300 text-light-100"
          }`}
        >
          Joining as {role}
        </span>

        <div className="mt-8">
          <AcceptInviteButtons token={token} />
        </div>
      </div>
      <Toaster />
    </div>
  );
}
