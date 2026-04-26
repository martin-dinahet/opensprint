import { Spinner } from "@/components/ui/spinner";

export function LoadingScreen() {
  return (
    <div className="flex h-screen w-screen items-center justify-center">
      <Spinner />
    </div>
  );
}
