"use client";

import { useSignIn, useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { navigateToAuthSuccess } from "@/lib/utils";
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

const signInSchema = z.object({
  identifier: z.string().min(1, { message: "Email or username is required" }),
  password: z
    .string()
    .min(6, { message: "Password must be at least 6 characters" }),
});

type SignInValues = z.infer<typeof signInSchema>;

export default function SignInPage() {
  const { signIn } = useSignIn();
  const { isLoaded: authLoaded, isSignedIn } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [ssoLoading, setSsoLoading] = useState<string | null>(null);
  const [pendingVerification, setPendingVerification] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [verificationStrategy, setVerificationStrategy] =
    useState<string>("mfa_email_code");
  const [showPassword, setShowPassword] = useState(false);
  const otpInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<SignInValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      identifier: "",
      password: "",
    },
  });

  useEffect(() => {
    if (authLoaded && isSignedIn) {
      navigateToAuthSuccess((url) => url, router);
    }
  }, [authLoaded, isSignedIn, router]);

  useEffect(() => {
    if (pendingVerification) {
      const timer = setTimeout(() => {
        otpInputRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [pendingVerification]);

  const initiateChallenge = async () => {
    if (!signIn) return;

    const hasMfaEmail = signIn.supportedSecondFactors?.some(
      (f) => f.strategy === "email_code",
    );
    const hasMfaPhone = signIn.supportedSecondFactors?.some(
      (f) => f.strategy === "phone_code",
    );
    const hasTotp = signIn.supportedSecondFactors?.some(
      (f) => f.strategy === "totp",
    );
    const hasFirstFactorEmail = signIn.supportedFirstFactors?.some(
      (f) => f.strategy === "email_code",
    );

    if (hasMfaEmail) {
      setVerificationStrategy("mfa_email_code");
      const { error } = await signIn.mfa.sendEmailCode();
      if (error) throw error;
    } else if (hasMfaPhone) {
      setVerificationStrategy("mfa_phone_code");
      const { error } = await signIn.mfa.sendPhoneCode();
      if (error) throw error;
    } else if (hasTotp) {
      setVerificationStrategy("totp");
    } else if (hasFirstFactorEmail) {
      setVerificationStrategy("first_factor_email_code");
      const { error } = await signIn.emailCode.sendCode();
      if (error) throw error;
    } else {
      // Fallback: attempt MFA email code, if not valid try first-factor email code
      try {
        setVerificationStrategy("mfa_email_code");
        const { error: mfaErr } = await signIn.mfa.sendEmailCode();
        if (mfaErr) {
          setVerificationStrategy("first_factor_email_code");
          await signIn.emailCode.sendCode();
        }
      } catch {
        setVerificationStrategy("first_factor_email_code");
        await signIn.emailCode.sendCode();
      }
    }
  };

  const onSubmit = async (values: SignInValues) => {
    if (!signIn || isLoading) return;
    setIsLoading(true);

    try {
      const { error: signInError } = await signIn.password({
        identifier: values.identifier,
        password: values.password,
      });

      if (signInError) {
        throw signInError;
      }

      if (signIn.status === "complete") {
        toast({
          title: "Welcome back!",
          description: "Successfully signed in to Storey.",
          variant: "default",
        });
        await signIn.finalize({
          navigate: ({ session, decorateUrl }) => {
            if (session?.currentTask) {
              console.warn("Pending session task:", session.currentTask);
              return;
            }

            navigateToAuthSuccess(decorateUrl, router);
          },
        });
      } else if (
        signIn.status === "needs_client_trust" ||
        signIn.status === "needs_second_factor" ||
        signIn.status === "needs_first_factor"
      ) {
        try {
          await initiateChallenge();
          setPendingVerification(true);
          toast({
            title: "Verification Required",
            description:
              "A verification code has been sent to authorize this sign-in.",
            variant: "default",
          });
        } catch (challengeErr: any) {
          console.warn("Failed to initiate challenge:", challengeErr);
          setPendingVerification(true);
          toast({
            title: "Verification Required",
            description:
              "Please enter the verification code sent to your email.",
            variant: "default",
          });
        }
      } else {
        console.warn("Uncompleted auth status:", signIn.status);
        toast({
          title: "Authentication Incomplete",
          description: `Status is: ${signIn.status}. Please check your credentials or account configuration.`,
          variant: "destructive",
        });
      }
    } catch (err: any) {
      console.error("Sign in error:", err);
      if (
        err?.code === "session_exists" ||
        err?.errors?.[0]?.code === "session_exists" ||
        err?.message?.includes("already signed in")
      ) {
        navigateToAuthSuccess((url) => url, router);
        return;
      }
      const errorMessage =
        err?.longMessage ||
        err?.message ||
        err?.errors?.[0]?.longMessage ||
        err?.errors?.[0]?.message ||
        "Failed to sign in. Please verify your credentials.";
      toast({
        title: "Sign In Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signIn || verificationCode.length < 6 || isLoading) return;
    setIsLoading(true);

    try {
      let verifyError: any = null;

      if (verificationStrategy === "first_factor_email_code") {
        const res = await signIn.emailCode.verifyCode({
          code: verificationCode,
        });
        verifyError = res.error;
      } else if (verificationStrategy === "mfa_phone_code") {
        const res = await signIn.mfa.verifyPhoneCode({
          code: verificationCode,
        });
        verifyError = res.error;
      } else if (verificationStrategy === "totp") {
        const res = await signIn.mfa.verifyTOTP({
          code: verificationCode,
        });
        verifyError = res.error;
      } else {
        const res = await signIn.mfa.verifyEmailCode({
          code: verificationCode,
        });
        if (
          res.error?.code === "strategy_for_user_invalid" ||
          res.error?.message?.includes("strategy is not valid")
        ) {
          const fallbackRes = await signIn.emailCode.verifyCode({
            code: verificationCode,
          });
          verifyError = fallbackRes.error;
        } else {
          verifyError = res.error;
        }
      }

      if (
        verifyError &&
        verifyError.code !== "verification_already_verified"
      ) {
        throw verifyError;
      }

      if (signIn.status === "complete") {
        toast({
          title: "Device Verified!",
          description: "Successfully signed in to Storey.",
          variant: "default",
        });
        await signIn.finalize({
          navigate: ({ session, decorateUrl }) => {
            if (session?.currentTask) {
              console.warn("Pending session task:", session.currentTask);
              return;
            }

            navigateToAuthSuccess(decorateUrl, router);
          },
        });
      } else {
        console.warn("Uncompleted 2FA status:", signIn.status);
        toast({
          title: "Verification Incomplete",
          description: `Status is: ${signIn.status}. Please try again.`,
          variant: "destructive",
        });
      }
    } catch (err: any) {
      console.error("Verification error:", err);
      const errorMessage =
        err?.longMessage ||
        err?.message ||
        err?.errors?.[0]?.longMessage ||
        err?.errors?.[0]?.message ||
        "Failed to verify code. Please try again.";
      toast({
        title: "Verification Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (!signIn || isLoading) return;
    try {
      if (verificationStrategy === "first_factor_email_code") {
        const { error } = await signIn.emailCode.sendCode();
        if (error) throw error;
      } else if (verificationStrategy === "mfa_phone_code") {
        const { error } = await signIn.mfa.sendPhoneCode();
        if (error) throw error;
      } else {
        const { error } = await signIn.mfa.sendEmailCode();
        if (error) {
          const { error: fbErr } = await signIn.emailCode.sendCode();
          if (fbErr) throw fbErr;
        }
      }
      toast({
        title: "Code Resent",
        description: "A new verification code has been sent to your email.",
        variant: "default",
      });
    } catch (err: any) {
      console.error("Resend error:", err);
      toast({
        title: "Resend Failed",
        description:
          err?.longMessage || err?.message || "Failed to resend code.",
        variant: "destructive",
      });
    }
  };

  const handleSSO = async (strategy: "oauth_google" | "oauth_microsoft") => {
    if (!signIn || isLoading) return;
    setSsoLoading(strategy);

    try {
      const { error } = await signIn.sso({
        strategy,
        redirectCallbackUrl: "/sso-callback",
        redirectUrl: "/dashboard",
      });

      if (error) {
        throw error;
      }
    } catch (err: any) {
      console.error(`${strategy} sign in error:`, err);
      const errorMessage =
        err?.longMessage ||
        err?.message ||
        err?.errors?.[0]?.message ||
        "Failed to initiate social login.";
      toast({
        title: "OAuth Failed",
        description: errorMessage,
        variant: "destructive",
      });
      setSsoLoading(null);
    }
  };

  return (
    <div className="w-full max-w-100 px-4 py-8 md:py-12 flex flex-col justify-center min-h-screen lg:min-h-0 bg-white">
      <AnimatePresence mode="wait">
        {!pendingVerification ? (
          <motion.div
            key="sign-in-form"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.4 }}
          >
            {/* Centered Heading */}
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-slate-800 tracking-tight">
                Sign in to{" "}
                <span className="text-brand font-dynapuff font-medium">Storey</span>
              </h2>
              <p className="text-lg text-slate-500 mt-1">
                Welcome back! Please sign in to continue
              </p>
            </div>

            {/* SSO Buttons - Side-by-side Layout */}
            <div className="flex gap-4 mt-8">
              <Button
                type="button"
                variant="outline"
                className="flex-1 h-12 rounded-xl border border-light-300 bg-white hover:bg-light-400 flex items-center justify-center gap-2 cursor-pointer shadow-sm transition-all"
                onClick={() => handleSSO("oauth_google")}
                disabled={!signIn || isLoading || ssoLoading !== null}
              >
                {ssoLoading === "oauth_google" ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Image
                    src="https://img.icons8.com/color/48/000000/google-logo.png"
                    alt="Google"
                    width={20}
                    height={20}
                  />
                )}
                <span className="font-semibold text-sm text-slate-700">Google</span>
              </Button>

              <Button
                type="button"
                variant="outline"
                className="flex-1 h-12 rounded-xl border border-light-300 bg-white hover:bg-light-400 flex items-center justify-center gap-2 cursor-pointer shadow-sm transition-all"
                onClick={() => handleSSO("oauth_microsoft")}
                disabled={!signIn || isLoading || ssoLoading !== null}
              >
                {ssoLoading === "oauth_microsoft" ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Image
                    src="https://img.icons8.com/color/48/000000/microsoft.png"
                    alt="Microsoft"
                    width={20}
                    height={20}
                  />
                )}
                <span className="font-semibold text-sm text-slate-700">
                  Microsoft
                </span>
              </Button>
            </div>

            {/* Centered or text */}
            <div className="text-center my-6">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
                or
              </span>
            </div>

            {/* Credentials Form */}
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="identifier"
                  render={({ field }) => (
                    <FormItem className="space-y-1.5">
                      <FormLabel className="text-xs font-semibold text-slate-700">
                        Email address or username
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter email or username"
                          className="w-full h-11 px-4 border border-light-300 rounded-xl bg-white text-slate-800 placeholder:text-slate-400/80 outline-none focus-visible:ring-1 focus-visible:ring-brand focus-visible:border-brand shadow-sm text-sm"
                          disabled={isLoading || ssoLoading !== null}
                          {...field}
                        />
                      </FormControl>
                      <p className="text-[11px] text-slate-500 pl-1">
                        Use your username or email.
                      </p>
                      <FormMessage className="text-red text-xs pl-1" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem className="space-y-1.5">
                      <FormLabel className="text-xs font-semibold text-slate-700">
                        Password
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type={showPassword ? "text" : "password"}
                            placeholder="Enter your password"
                            className="w-full h-11 pl-4 pr-11 border border-light-300 rounded-xl bg-white text-slate-800 placeholder:text-slate-400/80 outline-none focus-visible:ring-1 focus-visible:ring-brand focus-visible:border-brand shadow-sm text-sm"
                            disabled={isLoading || ssoLoading !== null}
                            {...field}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword((prev) => !prev)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none p-1 cursor-pointer transition-colors"
                            tabIndex={-1}
                            aria-label={showPassword ? "Hide password" : "Show password"}
                          >
                            {showPassword ? (
                              <EyeOff className="w-4 h-4" />
                            ) : (
                              <Eye className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage className="text-red text-xs pl-1" />
                    </FormItem>
                  )}
                />

                <div id="clerk-captcha" className="mt-4" />

                <Button
                  type="submit"
                  className="bg-brand hover:bg-brand-100 text-white w-full h-12 rounded-xl font-semibold mt-8 shadow-sm flex items-center justify-center gap-1.5 cursor-pointer transition-all duration-300"
                  disabled={!signIn || isLoading || ssoLoading !== null}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Continuing...</span>
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

            {/* Footer */}
            <div className="mt-8 text-center text-sm text-slate-500">
              <span>Don&apos;t have an account? </span>
              <Link
                href="/sign-up"
                className="text-brand hover:text-brand-100 font-semibold transition-colors cursor-pointer"
              >
                Sign up
              </Link>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="verification-form"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.4 }}
          >
            {/* Centered Heading for Device Trust / 2FA OTP */}
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-slate-800 tracking-tight">
                Verify your device
              </h2>
              <p className="text-lg text-slate-500 mt-2">
                We&apos;ve sent a 6-digit verification code to your email. Please enter it below to authorize this device.
              </p>
            </div>

            {/* Verification Form */}
            <form onSubmit={handleVerify} className="space-y-6 mt-8">
              <div className="flex justify-center">
                <InputOTP
                  ref={otpInputRef}
                  autoFocus
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

              <div className="flex flex-col gap-3 pt-4">
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
                      <span>Verify & Sign In</span>
                      <span className="text-xs translate-y-[0.5px]">▸</span>
                    </>
                  )}
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  className="w-full h-12 rounded-xl border border-light-300 bg-white hover:bg-light-400 font-semibold text-slate-700 cursor-pointer shadow-sm"
                  onClick={() => {
                    setPendingVerification(false);
                    setVerificationCode("");
                  }}
                  disabled={isLoading}
                >
                  Back to Sign In
                </Button>
              </div>

              <div className="text-center text-sm text-slate-500 pt-2">
                <span>Didn&apos;t receive the code? </span>
                <button
                  type="button"
                  onClick={handleResendCode}
                  disabled={isLoading}
                  className="text-brand hover:text-brand-100 font-semibold cursor-pointer disabled:opacity-50"
                >
                  Resend Code
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
