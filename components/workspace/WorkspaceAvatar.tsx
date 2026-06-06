import React from "react";
import { cn } from "@/lib/utils";
import { WORKSPACE_ICONS } from "@/lib/workspace-icons";

interface WorkspaceAvatarProps {
  icon?: string | null;
  themeColor?: string | null;
  name: string;
  className?: string;
  iconClassName?: string;
}

export function WorkspaceAvatar({
  icon,
  themeColor,
  name,
  className,
  iconClassName,
}: WorkspaceAvatarProps) {
  const fallbackColor = "#FA7275"; // Brand
  const bgColor = themeColor || fallbackColor;

  let content = null;

  if (icon?.startsWith("emoji:")) {
    content = (
      <span className={cn("text-lg", iconClassName)}>
        {icon.replace("emoji:", "")}
      </span>
    );
  } else if (icon?.startsWith("lucide:")) {
    const iconName = icon.replace("lucide:", "");
    const IconComponent = WORKSPACE_ICONS[iconName as keyof typeof WORKSPACE_ICONS];
    
    if (IconComponent) {
      content = (
        <IconComponent className={cn("size-5 text-white", iconClassName)} />
      );
    } else {
      content = (
        <span className={cn("text-lg text-white font-semibold", iconClassName)}>
          {name ? name.charAt(0).toUpperCase() : "?"}
        </span>
      );
    }
  } else {
    // Fallback to first letter
    content = (
      <span className={cn("text-lg text-white font-semibold", iconClassName)}>
        {name ? name.charAt(0).toUpperCase() : "?"}
      </span>
    );
  }

  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-xl",
        className
      )}
      style={{ backgroundColor: bgColor }}
    >
      {content}
    </div>
  );
}
