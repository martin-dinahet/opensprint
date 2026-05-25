"use client";

import { useState, useTransition } from "react";
import type { ColumnOutput } from "@/entities/column";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
  Input,
} from "@/shared";
import type { ColumnSettingsInput } from "./kanban-types";

type Props = {
  column: ColumnOutput;
  onOpenChange: (open: boolean) => void;
  onSave: (input: ColumnSettingsInput) => Promise<unknown> | unknown;
  open: boolean;
};

export function ColumnSettingsDialog({ column, onOpenChange, onSave, open }: Props) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const action = (formData: FormData) => {
    startTransition(async () => {
      setError(null);
      const name = String(formData.get("name") ?? "").trim();

      if (!name) {
        setError("Column name is required");
        return;
      }

      const rawWipLimit = String(formData.get("wipLimit") ?? "").trim();
      const parsedWipLimit = Number(rawWipLimit);
      const wipLimit = rawWipLimit ? parsedWipLimit : null;
      if (rawWipLimit) {
        if (!Number.isInteger(parsedWipLimit) || parsedWipLimit < 1) {
          setError("WIP limit must be a positive whole number");
          return;
        }
      }

      try {
        await onSave({ name, wipLimit });
        onOpenChange(false);
      } catch (error) {
        setError(error instanceof Error ? error.message : "Unable to update column");
      }
    });
  };

  return (
    <AlertDialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) setError(null);
        onOpenChange(nextOpen);
      }}
    >
      <AlertDialogContent>
        <form action={action}>
          <AlertDialogHeader>
            <AlertDialogTitle>Edit column</AlertDialogTitle>
            <AlertDialogDescription>
              Set the column name and optional work-in-progress limit for this board.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <FieldGroup className="py-4">
            <Field data-invalid={!!error}>
              <FieldLabel htmlFor={`column-name-${column.id}`}>Name</FieldLabel>
              <Input
                id={`column-name-${column.id}`}
                name="name"
                defaultValue={column.name}
                disabled={pending}
                autoFocus
              />
              <FieldError>{error}</FieldError>
            </Field>
            <Field>
              <FieldLabel htmlFor={`column-wip-limit-${column.id}`}>WIP limit</FieldLabel>
              <Input
                id={`column-wip-limit-${column.id}`}
                name="wipLimit"
                type="number"
                min={1}
                defaultValue={column.wipLimit ?? ""}
                disabled={pending}
                placeholder="No limit"
              />
            </Field>
          </FieldGroup>
          <AlertDialogFooter>
            <AlertDialogCancel type="button">Cancel</AlertDialogCancel>
            <AlertDialogAction type="submit" disabled={pending}>
              Save
            </AlertDialogAction>
          </AlertDialogFooter>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  );
}
