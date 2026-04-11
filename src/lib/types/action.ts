export type Action = (
  prevState: ActionState,
  formData: FormData,
) => Promise<ActionState>;

export interface ActionState {
  fieldErrors?: Record<string, string[]>;
  inputs?: Record<string, unknown>;
  message?: string;
  status: "idle" | "success" | "error";
}
