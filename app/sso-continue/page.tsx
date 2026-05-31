"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth, useSignIn, useSignUp } from "@clerk/nextjs";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";

const usernameSchema = z.object({
  username: z.string().min(3, { message: "Username must be at least 3 characters" }),
});

type UsernameValues = z.infer<typeof usernameSchema>;

type RequirementResource = {
  missingFields?: string[];
  unverifiedFields?: string[];
  status?: string | null;
};

export default function SSOContinuePage() {
  const { isSignedIn } = useAuth();
  const { signUp } = useSignUp();
  const { signIn } = useSignIn();
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const hasShownRequirementToastRef = useRef(false);
  const hasSentEmailCodeRef = useRef(false);

  const form = useForm<UsernameValues>({
    resolver: zodResolver(usernameSchema),
    defaultValues: {
      username: "",
    },
  });

  const needsUsername = useMemo(() => {
    if (!signUp) return false;
    return (
      signUp.status === "missing_requirements" &&
      (signUp.missingFields ?? []).includes("username")
    );
  }, [signUp]);

  const needsEmailVerification = useMemo(() => {
    if (!signUp) return false;
    return (
      signUp.status === "missing_requirements" &&
      (signUp.unverifiedFields ?? []).includes("email_address")
    );
  }, [signUp]);

  const getRequirementDetails = (resource: RequirementResource) => {
    const missingFields = resource.missingFields ?? [];
    const unverifiedFields = resource.unverifiedFields ?? [];
    const details: string[] = [];

    if (missingFields.length > 0) {
      details.push(`Missing: ${missingFields.join(", ")}`);
    }

    if (unverifiedFields.length > 0) {
      details.push(`Unverified: ${unverifiedFields.join(", ")}`);
    }

    return details.join(" | ");
  };

  const completeSignUp = useCallback(async () => {
    if (!signUp) return;

    try {
      await signUp.finalize({
        navigate: ({ session, decorateUrl }) => {
          if (session?.currentTask) {
            console.warn("Pending session task:", session.currentTask);
            return;
          }

          const url = decorateUrl("/");
          if (url.startsWith("http")) {
            window.location.href = url;
          } else {
            router.push(url);
          }
        },
      });
    } catch (err: any) {
      const errorMessage =
        err?.longMessage ||
        err?.message ||
        err?.errors?.[0]?.message ||
        "Could not complete sign up.";
      toast({
        title: "Sign up incomplete",
        description: errorMessage,
        variant: "destructive",
      });
    }
  }, [router, signUp, toast]);

  const completeSignIn = useCallback(async () => {
    if (!signIn) return;

    try {
      await signIn.finalize({
        navigate: ({ session, decorateUrl }) => {
          if (session?.currentTask) {
            console.warn("Pending session task:", session.currentTask);
            return;
          }

          const url = decorateUrl("/");
          if (url.startsWith("http")) {
            window.location.href = url;
          } else {
            router.push(url);
          }
        },
      });
    } catch (err: any) {
      const errorMessage =
        err?.longMessage ||
        err?.message ||
        err?.errors?.[0]?.message ||
        "Could not complete sign in.";
      toast({
        title: "Sign in incomplete",
        description: errorMessage,
        variant: "destructive",
      });
    }
  }, [router, signIn, toast]);

  const sendEmailCode = useCallback(async () => {
    if (!signUp || isLoading) return;
    setIsLoading(true);

    try {
      const { error: sendError } = await signUp.verifications.sendEmailCode();

      if (sendError) {
        throw sendError;
      }

      toast({
        title: "Code Sent",
        description: "We sent a verification code to your email.",
        variant: "default",
      });
    } catch (err: any) {
      const errorMessage =
        err?.longMessage ||
        err?.message ||
        err?.errors?.[0]?.message ||
        "Unable to send verification code.";
      toast({
        title: "Verification Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, signUp, toast]);

  const handleVerifyEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signUp || isLoading || verificationCode.length < 6) return;
    setIsLoading(true);

    try {
      const { error: verifyError } =
        await signUp.verifications.verifyEmailCode({ code: verificationCode });

      if (verifyError) {
        throw verifyError;
      }

      if (signUp.status === "complete") {
        await completeSignUp();
        return;
      }

      const details = getRequirementDetails(signUp);
      toast({
        title: "Verification Incomplete",
        description:
          details || "Please complete the required details.",
        variant: "destructive",
      });
    } catch (err: any) {
      const errorMessage =
        err?.longMessage ||
        err?.message ||
        err?.errors?.[0]?.message ||
        "Failed to verify code.";
      toast({
        title: "Verification Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isSignedIn) {
      router.replace("/");
      return;
    }

    if (!signUp && !signIn) return;

    if (needsUsername) return;

    if (needsEmailVerification) {
      if (!hasSentEmailCodeRef.current) {
        hasSentEmailCodeRef.current = true;
        void sendEmailCode();
      }
      return;
    }

    if (
      signUp?.status === "missing_requirements" &&
      !hasShownRequirementToastRef.current
    ) {
      const details = getRequirementDetails(signUp);
      toast({
        title: "Additional details required",
        description: details || "Please complete the required details.",
        variant: "destructive",
      });
      hasShownRequirementToastRef.current = true;
      return;
    }

    if (signUp?.status === "complete") {
      void completeSignUp();
      return;
    }

    if (signIn?.status === "complete") {
      void completeSignIn();
    }
  }, [
    isSignedIn,
    completeSignIn,
    completeSignUp,
    needsEmailVerification,
    needsUsername,
    router,
    sendEmailCode,
    signIn,
    signUp,
    toast,
  ]);

  const onSubmit = async (values: UsernameValues) => {
    if (!signUp || isLoading) return;
    setIsLoading(true);

    try {
      const { error: updateError } = await signUp.update({
        username: values.username,
      });

      if (updateError) {
        throw updateError;
      }

      if (signUp.status === "complete") {
        await completeSignUp();
        return;
      }

      if (signUp.status === "missing_requirements") {
        const details = getRequirementDetails(signUp);
        toast({
          title: "More details needed",
          description: details || "Please complete the required details.",
          variant: "destructive",
        });
      }
    } catch (err: any) {
      const errorMessage =
        err?.longMessage ||
        err?.message ||
        err?.errors?.[0]?.message ||
        "Failed to save username.";
      toast({
        title: "Username required",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!needsUsername && !needsEmailVerification) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white px-4">
        <div className="flex flex-col items-center gap-4 text-center">
          <Loader2 className="h-6 w-6 animate-spin text-brand" />
          <p className="text-sm text-slate-600">Finishing your sign in...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-white px-4">
      <div className="w-full max-w-100 rounded-2xl border border-light-300 bg-white p-6 shadow-sm">
        <div className="text-center mb-8">
          <h2 className="text-xl font-bold text-slate-800 tracking-tight">
            {needsUsername ? "Choose a username" : "Verify your email"}
          </h2>
          <p className="text-[13px] text-slate-500 mt-2">
            {needsUsername
              ? "Finish setting up your account by adding a username."
              : "Enter the 6-digit code sent to your email."}
          </p>
        </div>

        {needsUsername ? (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem className="space-y-1.5">
                    <FormLabel className="text-xs font-semibold text-slate-700">
                      Username
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Choose a username"
                        className="w-full h-11 px-4 border border-light-300 rounded-xl bg-white text-slate-800 placeholder:text-slate-400/80 outline-none focus-visible:ring-1 focus-visible:ring-brand focus-visible:border-brand shadow-sm text-sm"
                        disabled={isLoading}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className="text-red text-xs pl-1" />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="bg-brand hover:bg-brand-100 text-white w-full h-12 rounded-xl font-semibold shadow-sm flex items-center justify-center gap-1.5 cursor-pointer transition-all duration-300"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <span>Continue</span>
                    <span className="text-xs translate-y-[0.5px]">▸</span>
                  </>
                )}
              </Button>
            </form>
          </Form>
        ) : (
          <form onSubmit={handleVerifyEmail} className="space-y-6">
            <div className="flex justify-center">
              <InputOTP
                maxLength={6}
                value={verificationCode}
                onChange={(val) => setVerificationCode(val)}
                disabled={isLoading}
                className="shad-otp"
              >
                <InputOTPGroup className="gap-2 sm:gap-3 flex justify-between w-full">
                  {[0, 1, 2, 3, 4, 5].map((index) => (
                    <InputOTPSlot
                      key={index}
                      index={index}
                      className="w-12 h-14 sm:w-14 sm:h-16 text-xl md:text-2xl text-slate-700 bg-light-300 border-2 border-light-300 rounded-xl focus:border-brand focus:ring-brand font-bold transition-all shadow-sm"
                    />
                  ))}
                </InputOTPGroup>
              </InputOTP>
            </div>

            <div className="flex flex-col gap-3">
              <Button
                type="submit"
                className="bg-brand hover:bg-brand-100 text-white w-full h-12 rounded-xl font-semibold shadow-sm flex items-center justify-center gap-1.5 cursor-pointer transition-all duration-300"
                disabled={isLoading || verificationCode.length < 6}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Verifying...</span>
                  </>
                ) : (
                  <>
                    <span>Verify Code</span>
                    <span className="text-xs translate-y-[0.5px]">▸</span>
                  </>
                )}
              </Button>

              <Button
                type="button"
                variant="ghost"
                className="w-full text-xs text-brand hover:text-brand-100 hover:bg-transparent font-semibold py-2 cursor-pointer transition-colors"
                onClick={sendEmailCode}
                disabled={isLoading}
              >
                I need a new code
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
