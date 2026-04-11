import type { ZodType } from "zod";
import { handle } from "./handle";
import { parseFormData } from "./parse-form-data";
import type { Action, ActionState } from "./types/action";

type ActionFn<T> = (data: T) => Promise<unknown>;
type CreateActionParams<T> = {
  schema: ZodType<T>;
  fn: ActionFn<T>;
  onSuccess?: () => void | Promise<void>;
};
type CreateAction = <T>({ schema, fn }: CreateActionParams<T>) => Action;

export const createAction: CreateAction = ({ schema, fn, onSuccess }) => {
  return async (_prevState, formData): Promise<ActionState> => {
    const { data, fieldErrors } = parseFormData(schema, formData);
    if (!data) return { status: "error", fieldErrors, message: "Invalid form data" };
    const result = await handle(fn(data));
    if (result.error) return { status: "error", message: result.error };
    if (onSuccess) await onSuccess();
    return { status: "success" };
  };
};
