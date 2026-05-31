"use client";

import { useSignUp } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
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

const signUpSchema = z.object({
  fullName: z.string().min(2, { message: "Full name is required" }),
  username: z.string().min(3, { message: "Username must be at least 3 characters" }),
  email: z.string().email({ message: "Invalid email address" }),
  password: z
    .string()
    .min(6, { message: "Password must be at least 6 characters" }),
});

type SignUpValues = z.infer<typeof signUpSchema>;

export default function SignUpPage() {
  const { signUp } = useSignUp();
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [ssoLoading, setSsoLoading] = useState<string | null>(null);
  const [pendingVerification, setPendingVerification] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [userEmail, setUserEmail] = useState("");

  const form = useForm<SignUpValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      fullName: "",
      username: "",
      email: "",
      password: "",
    },
  });

  const getRequirementDetails = (resource: {
    missingFields?: string[];
    unverifiedFields?: string[];
  }) => {
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

  const onSubmit = async (values: SignUpValues) => {
    if (!signUp || isLoading) return;
    setIsLoading(true);

    try {
      const nameParts = values.fullName.trim().split(/\s+/);
      const firstName = nameParts[0] || "";
      const lastName = nameParts.slice(1).join(" ") || "";

      const { error: signUpError } = await signUp.password({
        emailAddress: values.email,
        password: values.password,
        username: values.username,
        firstName,
        lastName,
      });

      if (signUpError) {
        throw signUpError;
      }

      const missingFields = signUp.missingFields ?? [];
      const unverifiedFields = signUp.unverifiedFields ?? [];
      const needsEmailVerification = unverifiedFields.includes("email_address");

      if (signUp.status === "complete") {
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
        return;
      }

      if (missingFields.length > 0) {
        const details = getRequirementDetails(signUp as {
          missingFields?: string[];
          unverifiedFields?: string[];
        });
        toast({
          title: "Additional info required",
          description:
            details ||
            "Your account needs additional details before verification.",
          variant: "destructive",
        });
        return;
      }

      if (needsEmailVerification) {
        const { error: emailCodeError } =
          await signUp.verifications.sendEmailCode();

        if (emailCodeError) {
          throw emailCodeError;
        }

        setUserEmail(values.email);
        setPendingVerification(true);
        toast({
          title: "Code Sent",
          description: `We've sent a 6-digit verification code to ${values.email}.`,
          variant: "default",
        });
      } else {
        const details = getRequirementDetails(signUp as {
          missingFields?: string[];
          unverifiedFields?: string[];
        });
        toast({
          title: "Sign up incomplete",
          description:
            details ||
            `Status is: ${signUp.status}. Please try again.`,
          variant: "destructive",
        });
      }
    } catch (err: any) {
      console.error("Sign up creation error:", err);
      const errorMessage =
        err?.longMessage ||
        err?.message ||
        err?.errors?.[0]?.longMessage ||
        err?.errors?.[0]?.message ||
        "Failed to create account. Please try again.";
      toast({
        title: "Registration Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signUp || verificationCode.length < 6 || isLoading) return;
    setIsLoading(true);

    try {
      const { error: verifyError } =
        await signUp.verifications.verifyEmailCode({ code: verificationCode });

      if (verifyError) {
        throw verifyError;
      }

      if (signUp.status === "complete") {
        toast({
          title: "Account Created!",
          description: "Welcome to Storey! Your account has been verified.",
          variant: "default",
        });
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
      } else {
        const details = getRequirementDetails(signUp as {
          missingFields?: string[];
          unverifiedFields?: string[];
        });
        console.warn("Uncompleted verification status:", signUp.status);
        toast({
          title: "Verification Incomplete",
          description:
            details ||
            `Status is: ${signUp.status}. Contact support if this persists.`,
          variant: "destructive",
        });
      }
    } catch (err: any) {
      console.error("OTP verification error:", err);
      const firstError = err?.errors?.[0];

      if (firstError?.code === "verification_already_verified") {
        try {
          await (signUp as any).reload();
          if (signUp.status === "complete") {
            toast({
              title: "Account Created!",
              description: "Welcome to Storey! Your account has been verified.",
              variant: "default",
            });
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
            return;
          }
        } catch (reloadErr) {
          console.error("Error reloading signup:", reloadErr);
        }
      }

      const errorMessage =
        firstError?.longMessage ||
        firstError?.message ||
        err?.longMessage ||
        err?.message ||
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
    if (!signUp) return;
    try {
      const { error: resendError } =
        await signUp.verifications.sendEmailCode();

      if (resendError) {
        throw resendError;
      }
      toast({
        title: "New Code Sent",
        description: "A new 6-digit code has been sent to your email.",
        variant: "default",
      });
    } catch (err: any) {
      console.error("Error resending code:", err);
      toast({
        title: "Resend Failed",
        description: err?.errors?.[0]?.message || "Could not resend code.",
        variant: "destructive",
      });
    }
  };

  const handleSSO = async (strategy: "oauth_google" | "oauth_microsoft") => {
    if (!signUp || isLoading) return;
    setSsoLoading(strategy);

    try {
      const { error: ssoError } = await signUp.sso({
        strategy,
        redirectUrl: "/sso-continue",
        redirectCallbackUrl: "/sso-callback",
      });

      if (ssoError) {
        throw ssoError;
      }
    } catch (err: any) {
      console.error(`${strategy} sign up error:`, err);
      const errorMessage =
        err?.longMessage ||
        err?.message ||
        err?.errors?.[0]?.message ||
        "Failed to initiate social sign-up.";
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
            key="signup-form"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.4 }}
          >
            {/* Centered Heading */}
            <div className="text-center mb-8">
              <h2 className="text-xl font-bold text-slate-800 tracking-tight">
                Create your Storey account
              </h2>
              <p className="text-[13px] text-slate-500 mt-1">
                Get started by creating your account
              </p>
            </div>

            {/* SSO Buttons - Side-by-side Layout */}
            <div className="flex gap-4 mt-8">
              <Button
                type="button"
                variant="outline"
                className="flex-1 h-12 rounded-xl border border-light-300 bg-white hover:bg-light-400 flex items-center justify-center gap-2 cursor-pointer shadow-sm transition-all"
                onClick={() => handleSSO("oauth_google")}
                disabled={isLoading || ssoLoading !== null}
              >
                {ssoLoading === "oauth_google" ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Image
                    src="https://img.icons8.com/color/48/000000/google-logo.png"
                    alt="Google"
                    width={18}
                    height={18}
                  />
                )}
                <span className="font-semibold text-xs text-slate-700">Google</span>
              </Button>

              <Button
                type="button"
                variant="outline"
                className="flex-1 h-12 rounded-xl border border-light-300 bg-white hover:bg-light-400 flex items-center justify-center gap-2 cursor-pointer shadow-sm transition-all"
                onClick={() => handleSSO("oauth_microsoft")}
                disabled={isLoading || ssoLoading !== null}
              >
                {ssoLoading === "oauth_microsoft" ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Image
                    src="https://img.icons8.com/color/48/000000/microsoft.png"
                    alt="Microsoft"
                    width={18}
                    height={18}
                  />
                )}
                <span className="font-semibold text-xs text-slate-700">Microsoft</span>
              </Button>
            </div>

            {/* Centered or Divider */}
            <div className="text-center my-6">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest">
                or
              </span>
            </div>

            {/* Registration Form */}
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="fullName"
                  render={({ field }) => (
                    <FormItem className="space-y-1.5">
                      <FormLabel className="text-xs font-semibold text-slate-700">
                        Full Name
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter your full name"
                          className="w-full h-11 px-4 border border-light-300 rounded-xl bg-white text-slate-800 placeholder:text-slate-400/80 outline-none focus-visible:ring-1 focus-visible:ring-brand focus-visible:border-brand shadow-sm text-sm"
                          disabled={isLoading || ssoLoading !== null}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage className="text-red text-xs pl-1" />
                    </FormItem>
                  )}
                />

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
                          disabled={isLoading || ssoLoading !== null}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage className="text-red text-xs pl-1" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem className="space-y-1.5">
                      <FormLabel className="text-xs font-semibold text-slate-700">
                        Email Address
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="Enter your email"
                          className="w-full h-11 px-4 border border-light-300 rounded-xl bg-white text-slate-800 placeholder:text-slate-400/80 outline-none focus-visible:ring-1 focus-visible:ring-brand focus-visible:border-brand shadow-sm text-sm"
                          disabled={isLoading || ssoLoading !== null}
                          {...field}
                        />
                      </FormControl>
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
                        <Input
                          type="password"
                          placeholder="Create a password"
                          className="w-full h-11 px-4 border border-light-300 rounded-xl bg-white text-slate-800 placeholder:text-slate-400/80 outline-none focus-visible:ring-1 focus-visible:ring-brand focus-visible:border-brand shadow-sm text-sm"
                          disabled={isLoading || ssoLoading !== null}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage className="text-red text-xs pl-1" />
                    </FormItem>
                  )}
                />

                <div id="clerk-captcha" className="mt-4" />

                <Button
                  type="submit"
                  className="bg-brand hover:bg-brand-100 text-white w-full h-12 rounded-xl font-semibold mt-8 shadow-sm flex items-center justify-center gap-1.5 cursor-pointer transition-all duration-300"
                  disabled={isLoading || ssoLoading !== null}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Creating Account...</span>
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
              <span>Already have an account? </span>
              <Link
                href="/sign-in"
                className="text-brand hover:text-brand-100 font-semibold transition-colors cursor-pointer"
              >
                Sign in
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
            {/* Centered Heading for OTP */}
            <div className="text-center mb-8">
              <h2 className="text-xl font-bold text-slate-800 tracking-tight">
                Verify your email
              </h2>
              <p className="text-[13px] text-slate-500 mt-2">
                We've sent a 6-digit verification code to{" "}
                <span className="font-semibold text-slate-800">{userEmail}</span>.
                Please enter it below to verify your account.
              </p>
            </div>

            {/* Verification Form */}
            <form onSubmit={handleVerify} className="space-y-6 mt-8">
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
                      <span>Verify Code</span>
                      <span className="text-xs translate-y-[0.5px]">▸</span>
                    </>
                  )}
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  className="w-full text-xs text-brand hover:text-brand-100 hover:bg-transparent font-semibold py-2 cursor-pointer transition-colors"
                  onClick={handleResendCode}
                  disabled={isLoading}
                >
                  I need a new code
                </Button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
