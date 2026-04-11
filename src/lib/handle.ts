import type { Result } from "@/lib/types/result";

export async function handle<T>(promise: Promise<T>): Promise<Result<T>> {
  try {
    const data = await promise;
    return { data, error: null };
  } catch (err) {
    const error = err instanceof Error ? err.message : "Unknown error";
    return { data: null, error };
  }
}
