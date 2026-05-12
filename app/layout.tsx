import type { Metadata } from "next";
import {
  ClerkProvider,
  Show,
  SignInButton,
  SignUpButton,
  UserButton,
} from "@clerk/nextjs";
import { shadcn } from "@clerk/ui/themes";
import "./globals.css";
import { Poppins } from "next/font/google";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
  variable: "--font-poppins",
});

export const metadata: Metadata = {
  title: "Storey",
  description: "Storey - AI-powered storage for modern teams.",
};

const clerkAppearance = {
  theme: [shadcn],
  variables: {
    colorPrimary: "#FA7275",
    colorText: "#333F4E",
    colorTextSecondary: "#A3B2C7",
    colorBackground: "#FFFFFF",
    colorInputBackground: "#F2F5F9",
    colorInputText: "#333F4E",
    colorDanger: "#b80000",
    colorSuccess: "#3DD9B3",
    borderRadius: "0.5rem",
    fontFamily: "var(--font-poppins), ui-sans-serif, system-ui",
  },
  elements: {
    card: "shadow-drop-1 border border-light-300",
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
    userProfileCard: "shadow-drop-1 border border-light-300",
    modalContent: "rounded-[30px] border border-light-300",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body className={`${poppins.variable} antialiased`}>
        <ClerkProvider appearance={clerkAppearance}>
          <header className="flex items-center justify-end gap-3 px-6 py-4">
            <Show when="signed-out">
              <SignInButton
                children={
                  <button
                    type="button"
                    className="primary-btn px-4 py-2 text-white"
                  >
                    Sign In
                  </button>
                }
              />
              <SignUpButton
                children={
                  <button
                    type="button"
                    className="rounded-full border border-brand px-4 py-2 text-[14px] leading-[20px] font-medium text-brand transition-all hover:bg-brand/10"
                  >
                    Sign Up
                  </button>
                }
              />
            </Show>
            <Show when="signed-in">
              <UserButton />
            </Show>
          </header>
          {children}
        </ClerkProvider>
      </body>
    </html>
  );
}
