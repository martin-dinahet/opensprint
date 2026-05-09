import { Spinner } from "@/shared/ui/spinner";
import { cn } from "@/shared/lib/utils";

type Props = {
  label?: string;
  variant?: "page" | "shell";
};

export function LoadingScreen({ label = "Loading...", variant = "page" }: Props) {
  return (
    <div
      className={cn(
        "flex items-center justify-center gap-3 text-muted-foreground text-sm",
        variant === "page" ? "h-svh w-screen" : "min-h-64 w-full flex-1",
      )}
    >
      <Spinner />
      <span>{label}</span>
    </div>
  );
}
