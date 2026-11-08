import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { ui, type Appearance } from "@clerk/ui";
import { shadcn } from "@clerk/ui/themes";
import "./globals.css";
import { Poppins, DynaPuff } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
  variable: "--font-poppins",
});

const dynaPuff = DynaPuff({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-dynapuff",
});

export const metadata: Metadata = {
  title: "Storey",
  description: "Storey - AI-powered storage for modern teams.",
};

const clerkAppearance = {
  theme: [shadcn],
  options: {
    unsafe_disableDevelopmentModeWarnings: true,
  },
  // The shadcn theme reads shadcn CSS variables (--foreground, --input, ...) this app never defines,
  // so every color the theme sets must be given a concrete value here or Clerk renders it invalid.
  variables: {
    colorPrimary: "#FA7275",
    colorPrimaryForeground: "#FFFFFF",
    colorForeground: "#333F4E",
    colorMutedForeground: "#A3B2C7",
    colorMuted: "#F2F4F8",
    colorNeutral: "#333F4E",
    colorBackground: "#FFFFFF",
    colorInput: "#F2F5F9",
    colorInputForeground: "#333F4E",
    colorRing: "#FA7275",
    colorDanger: "#b80000",
    colorSuccess: "#3DD9B3",
    borderRadius: "0.5rem",
    fontFamily: "var(--font-poppins), ui-sans-serif, system-ui",
  },
  elements: {
    card: "shadow-drop-1 border border-light-300 bg-white",
    navbar: "bg-light-400 border-r border-light-300",
    pageScrollBox: "bg-white",
    headerTitle: "text-light-100",
    headerSubtitle: "text-light-200",
    formFieldInput:
      "h-[52px] rounded-full border border-light-300 bg-light-300 px-4 text-[14px] leading-[20px] text-light-100",
    formFieldLabel: "text-light-100",
    formButtonPrimary: "primary-btn h-[52px] text-white",
    socialButtonsBlockButton:
      "rounded-full border border-light-300 bg-white text-light-100 shadow-drop-1 hover:bg-light-400",
    socialButtonsBlockButtonText: "text-light-100",
    dividerLine: "bg-light-300",
    footerActionLink: "text-brand hover:text-brand-100",
    userButtonPopoverCard: "shadow-drop-1 border border-light-300",
    userProfileCard: "shadow-drop-1 border border-light-300 bg-white",
    modalContent: "rounded-[30px] border border-light-300 bg-white overflow-hidden",
  },
} satisfies Appearance;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body className={`${poppins.variable} ${dynaPuff.variable} antialiased`}>
        <ClerkProvider
          signInUrl="/sign-in"
          signUpUrl="/sign-up"
          signInFallbackRedirectUrl="/dashboard"
          signUpFallbackRedirectUrl="/dashboard"
          appearance={clerkAppearance}
          afterSignOutUrl="/sign-in"
          ui={ui}
        >
          {children}
        </ClerkProvider>
        <Analytics />
      </body>
    </html>
  );
}
