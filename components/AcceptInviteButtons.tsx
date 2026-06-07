"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { acceptInvite } from "@/lib/actions/workspace.actions";
import { toast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

interface AcceptInviteButtonsProps {
  token: string;
}

const AcceptInviteButtons = ({ token }: AcceptInviteButtonsProps) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleJoin = () => {
    startTransition(async () => {
      try {
        const result = await acceptInvite(token);
        if (result?.workspaceId) {
          toast({
            description: (
              <p className="body-2 text-white">
                Successfully joined the workspace!
              </p>
            ),
            className: "success-toast",
          });
          router.push("/dashboard");
        } else {
          toast({
            description: (
              <p className="body-2 text-white">
                {result?.reason || "Failed to join workspace. Please try again."}
              </p>
            ),
            className: "error-toast",
          });
        }
      } catch (error: any) {
        if (error?.code === "ALREADY_MEMBER") {
          toast({
            description: (
              <p className="body-2 text-white">
                You are already a member of this workspace.
              </p>
            ),
            className: "success-toast",
          });
          router.push("/dashboard");
        } else {
          toast({
            description: (
              <p className="body-2 text-white">
                Failed to join workspace. Please try again.
              </p>
            ),
            className: "error-toast",
          });
        }
      }
    });
  };

  const handleDecline = () => {
    router.push("/dashboard");
  };

  return (
    <div className="flex w-full gap-3">
      <Button
        onClick={handleJoin}
        disabled={isPending}
        className="primary-btn h-12 flex-1 gap-2 text-white cursor-pointer font-dynapuff"
      >
        {isPending ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            Joining…
          </>
        ) : (
          "Join workspace"
        )}
      </Button>
      <Button
        onClick={handleDecline}
        disabled={isPending}
        variant="outline"
        className="h-12 flex-1 rounded-full border-light-300 text-light-100 hover:bg-light-400/50 cursor-pointer"
      >
        Decline
      </Button>
    </div>
  );
};

export default AcceptInviteButtons;
