"use client";

import { UserButton } from "@clerk/nextjs";

export default function ClerkUserButton() {
  return (
    <div className="flex items-center">
      <UserButton
        appearance={{
          variables: {
            colorPrimary: "#FA7275",
            borderRadius: "0.75rem",
          },
          elements: {
            userButtonTrigger:
              "focus:outline-none !rounded-2xl transition-all duration-300 hover:scale-105",
            userButtonAvatarBox:
              "!w-11 !h-11 !rounded-full overflow-hidden border-2 border-brand/20 hover:border-brand/60 transition-all duration-300 shadow-drop-1 hover:shadow-drop-2 cursor-pointer",
            userButtonAvatarImage: "w-full h-full object-cover",
            userButtonPopoverCard:
              "shadow-drop-1 border border-light-300 rounded-[20px] bg-white",
            userButtonPopoverFooter: "hidden",
            userButtonPopoverActionButton:
              "hover:bg-brand/10 transition-colors duration-200 py-2.5 px-3 rounded-lg",
            userButtonPopoverActionButtonIcon: "text-brand",
          },
        }}
      />
    </div>
  );
}
