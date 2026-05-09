"use client";

import { PaletteIcon } from "lucide-react";
import { useTheme } from "next-themes";
import { ToggleGroup, ToggleGroupItem } from "@/shared/ui/toggle-group";
import { themeItems } from "../lib/constants";

export function ThemeToggleGroup() {
  const { setTheme, theme = "system" } = useTheme();

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2 px-1 text-sidebar-foreground/60 text-xs">
        <PaletteIcon className="size-3.5" />
        <span>Theme</span>
      </div>
      <ToggleGroup
        value={[theme]}
        onValueChange={(value) => {
          const nextTheme = value[0];
          if (nextTheme) setTheme(nextTheme);
        }}
        variant="outline"
        size="sm"
        className="grid w-full grid-cols-3 rounded-md bg-sidebar-accent/35 p-0.5"
      >
        {themeItems.map((item) => {
          const Icon = item.icon;

          return (
            <ToggleGroupItem key={item.value} value={item.value} aria-label={item.label} className="rounded-sm">
              <Icon />
            </ToggleGroupItem>
          );
        })}
      </ToggleGroup>
    </div>
  );
}
