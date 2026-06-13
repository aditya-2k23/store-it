"use client";

import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, X } from "lucide-react";
import { useRef, useState, useEffect } from "react";
import {
  WORKSPACE_ICONS,
  WORKSPACE_EMOJIS,
  WORKSPACE_THEME_COLORS,
} from "@/lib/workspace-icons";

interface WorkspaceAppearancePickerProps {
  iconValue: string;
  themeColorValue: string;
  onIconChange: (icon: string) => void;
  onThemeColorChange: (color: string) => void;
  showLabel?: boolean;
}

export function WorkspaceAppearancePicker({
  iconValue,
  themeColorValue,
  onIconChange,
  onThemeColorChange,
  showLabel = false,
}: WorkspaceAppearancePickerProps) {
  const colorInputRef = useRef<HTMLInputElement>(null);
  const [customColors, setCustomColors] = useState<string[]>([]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("storey_custom_colors");
      if (saved) {
        const parsed = JSON.parse(saved);
        // Ensure any currently selected custom color (e.g. from props) is included
        const merged = Array.from(new Set([...parsed, themeColorValue]));
        // Keep only actual custom colors
        const filtered = merged.filter((c) => !WORKSPACE_THEME_COLORS.includes(c));
        setCustomColors(filtered);
      } else if (!WORKSPACE_THEME_COLORS.includes(themeColorValue)) {
        // If no saved colors, but there is a custom color selected
        setCustomColors([themeColorValue]);
      }
    } catch (error) {
      console.error("Failed to load custom colors", error);
    }
  }, [themeColorValue]);

  const handleCustomColorAdd = (color: string) => {
    onThemeColorChange(color);
    if (!WORKSPACE_THEME_COLORS.includes(color) && !customColors.includes(color)) {
      const updated = [...customColors, color];
      setCustomColors(updated);
      try {
        localStorage.setItem("storey_custom_colors", JSON.stringify(updated));
      } catch (error) {
        console.error("Failed to save custom colors", error);
      }
    }
  };

  const handleCustomColorRemove = (colorToRemove: string) => {
    const updated = customColors.filter((c) => c !== colorToRemove);
    setCustomColors(updated);
    try {
      localStorage.setItem("storey_custom_colors", JSON.stringify(updated));
    } catch (error) {
      console.error("Failed to save custom colors", error);
    }
    // If the removed color is currently selected, fallback to the first default
    if (themeColorValue === colorToRemove) {
      onThemeColorChange(WORKSPACE_THEME_COLORS[0]);
    }
  };

  return (
    <div>
      {showLabel && (
        <label className="body-2 mb-2 block font-medium text-light-100">
          Workspace Identity
        </label>
      )}

      {/* Color Picker */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {WORKSPACE_THEME_COLORS.map((color) => (
          <button
            key={color}
            type="button"
            aria-label={`Select theme color ${color}`}
            aria-pressed={themeColorValue === color}
            onClick={() => onThemeColorChange(color)}
            className={cn(
              "size-8 rounded-full transition-transform hover:scale-110 cursor-pointer",
              themeColorValue === color
                ? "ring-2 ring-brand ring-offset-2 scale-110"
                : "",
            )}
            style={{ backgroundColor: color }}
          />
        ))}

        {/* Saved Custom Colors */}
        {customColors.map((color) => (
          <div key={color} className="group relative">
            <button
              type="button"
              aria-label={`Select custom color ${color}`}
              aria-pressed={themeColorValue === color}
              onClick={() => onThemeColorChange(color)}
              className={cn(
                "size-8 rounded-full transition-transform hover:scale-110 cursor-pointer",
                themeColorValue === color
                  ? "ring-2 ring-brand ring-offset-2 scale-110"
                  : "",
              )}
              style={{ backgroundColor: color }}
            />
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleCustomColorRemove(color);
              }}
              className="absolute -top-1 -right-1 hidden size-4 items-center justify-center rounded-full bg-red text-white hover:bg-red/80 group-hover:flex cursor-pointer shadow-sm"
              aria-label="Remove custom color"
            >
              <X className="size-2.5" />
            </button>
          </div>
        ))}

        {/* Custom Color Picker Button */}
        <div className="relative ml-1">
          <input
            type="color"
            ref={colorInputRef}
            value="#000000"
            onChange={(e) => handleCustomColorAdd(e.target.value)}
            className="sr-only"
            aria-label="Custom color picker"
          />
          <button
            type="button"
            onClick={() => colorInputRef.current?.click()}
            className="flex size-8 items-center justify-center rounded-full border border-dashed border-light-300 bg-white transition-colors hover:border-brand hover:text-brand cursor-pointer text-light-200"
            title="Add custom color"
          >
            <Plus className="size-4" />
          </button>
        </div>
      </div>

      {/* Icon Picker */}
      <Tabs defaultValue="icons" className="w-full">
        <TabsList className="w-full grid grid-cols-2 bg-light-400">
          <TabsTrigger value="icons" className="cursor-pointer">
            Icons
          </TabsTrigger>
          <TabsTrigger value="emojis" className="cursor-pointer">
            Emojis
          </TabsTrigger>
        </TabsList>
        <TabsContent value="icons" className="mt-3">
          <div className="grid grid-cols-6 gap-2">
            {Object.entries(WORKSPACE_ICONS).map(([name, Icon]) => {
              const iconKey = `lucide:${name}`;
              const isSelected = iconValue === iconKey;
              return (
                <button
                  key={name}
                  type="button"
                  aria-label={name}
                  aria-pressed={isSelected}
                  onClick={() => onIconChange(iconKey)}
                  className={cn(
                    "flex aspect-square items-center justify-center rounded-lg border transition-colors cursor-pointer",
                    isSelected
                      ? "border-brand bg-brand/10 text-brand"
                      : "border-light-300 bg-white text-light-100 hover:bg-light-400",
                  )}
                >
                  <Icon className="size-5" />
                </button>
              );
            })}
          </div>
        </TabsContent>
        <TabsContent value="emojis" className="mt-3">
          <div className="grid grid-cols-6 gap-2">
            {WORKSPACE_EMOJIS.map((emoji) => {
              const iconKey = `emoji:${emoji}`;
              const isSelected = iconValue === iconKey;
              return (
                <button
                  key={emoji}
                  type="button"
                  aria-label={`Emoji ${emoji}`}
                  aria-pressed={isSelected}
                  onClick={() => onIconChange(iconKey)}
                  className={cn(
                    "flex aspect-square items-center justify-center rounded-lg border text-xl transition-colors cursor-pointer",
                    isSelected
                      ? "border-brand bg-brand/10"
                      : "border-light-300 bg-white hover:bg-light-400",
                  )}
                >
                  {emoji}
                </button>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
