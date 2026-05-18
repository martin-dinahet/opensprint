import type { LucideIcon } from "lucide-react";
import type { ComponentProps } from "react";
import { cn } from "@/shared/lib";

type IconProps = ComponentProps<LucideIcon> & {
  icon: LucideIcon;
};

export function Icon({ className, icon: IconComponent, ...props }: IconProps) {
  return <IconComponent aria-hidden="true" className={cn("size-4 shrink-0", className)} {...props} />;
}
