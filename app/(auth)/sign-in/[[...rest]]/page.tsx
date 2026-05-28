"use client";

import { useSignIn } from "@clerk/nextjs/legacy";
import { useRouter } from "next/navigation";
import { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { motion } from "framer-motion";
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

const signInSchema = z.object({
  identifier: z.string().min(1, { message: "Email or username is required" }),
  password: z
    .string()
    .min(6, { message: "Password must be at least 6 characters" }),
});

type SignInValues = z.infer<typeof signInSchema>;

export default function SignInPage() {
  const { signIn, isLoaded, setActive } = useSignIn();
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [ssoLoading, setSsoLoading] = useState<string | null>(null);
  const isSubmittingRef = useRef(false);

  const form = useForm<SignInValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      identifier: "",
      password: "",
    },
  });

  const onSubmit = async (values: SignInValues) => {
    if (!isLoaded || isSubmittingRef.current) return;
    isSubmittingRef.current = true;
    setIsLoading(true);

    try {
      const result = await signIn.create({
        identifier: values.identifier,
        password: values.password,
      });

      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });
        toast({
          title: "Welcome back!",
          description: "Successfully signed in to Storey.",
          variant: "default",
        });
        window.location.href = "/";
      } else {
        console.warn("Uncompleted auth status:", result.status);
        toast({
          title: "Authentication Incomplete",
          description: `Status is: ${result.status}. Please check your credentials or account configuration.`,
          variant: "destructive",
        });
      }
    } catch (err: any) {
      console.error("Sign in error:", err);
      const errorMessage =
        err?.errors?.[0]?.longMessage ||
        err?.errors?.[0]?.message ||
        "Failed to sign in. Please verify your credentials.";
      toast({
        title: "Sign In Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      isSubmittingRef.current = false;
      setIsLoading(false);
    }
  };

  const handleSSO = async (strategy: "oauth_google" | "oauth_microsoft") => {
    if (!isLoaded) return;
    setSsoLoading(strategy);

    try {
      await signIn.authenticateWithRedirect({
        strategy,
        redirectUrl: "/sso-callback",
        redirectUrlComplete: "/",
      });
    } catch (err: any) {
      console.error(`${strategy} sign in error:`, err);
      const errorMessage =
        err?.errors?.[0]?.message || "Failed to initiate social login.";
      toast({
        title: "OAuth Failed",
        description: errorMessage,
        variant: "destructive",
      });
      setSsoLoading(null);
    }
  };

  return (
    <div className="w-full max-w-[400px] px-4 py-8 md:py-12 flex flex-col justify-center min-h-screen lg:min-h-0 bg-white">
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Centered Heading */}
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">
            Sign in to <span className="text-brand">Storey</span>
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
            disabled={isLoading || ssoLoading !== null}
          >
            {ssoLoading === "oauth_google" ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <img
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
            disabled={isLoading || ssoLoading !== null}
          >
            {ssoLoading === "oauth_microsoft" ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <img
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
                      placeholder="Enter your password"
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
          <span>Don't have an account? </span>
          <Link
            href="/sign-up"
            className="text-brand hover:text-brand-100 font-semibold transition-colors cursor-pointer"
          >
            Sign up
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
