"use client";

import { Loader2Icon, SaveIcon } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import z from "zod";
import { useSignOut } from "@/features/auth";
import { handleClientResult } from "@/shared/api/result";
import { authClient } from "@/shared/lib/auth-client";
import { parseFormData } from "@/shared/lib/forms";
import { Button } from "@/shared/shadcn/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/shadcn/card";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/shared/shadcn/field";
import { Input } from "@/shared/shadcn/input";
import { NativeSelect, NativeSelectOption } from "@/shared/shadcn/native-select";
import { UserAvatar } from "@/widgets/app-sidebar";
import { useDashboardHeader } from "@/widgets/header";

const profileSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(120),
  image: z.preprocess(
    (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
    z.string().trim().url("Enter a valid image URL").optional(),
  ),
});

type UpdateUserResponse = {
  error?: {
    message?: string;
  } | null;
};

export default function Page() {
  const session = authClient.useSession();
  const signOut = useSignOut();
  const { setTheme, theme = "system" } = useTheme();
  const [pending, startTransition] = useTransition();
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]> | null>(null);
  const [name, setName] = useState("");
  const [image, setImage] = useState("");
  const user = session.data?.user;
  const header = useMemo(() => ({ title: "Account", eyebrow: "Settings" }), []);

  useDashboardHeader(header);

  useEffect(() => {
    setName(user?.name ?? "");
    setImage(user?.image ?? "");
  }, [user?.image, user?.name]);

  const updateProfile = (formData: FormData) => {
    startTransition(async () => {
      setFieldErrors(null);
      const parsed = parseFormData(profileSchema, formData);
      if (parsed.fieldErrors) {
        setFieldErrors(parsed.fieldErrors);
        return;
      }

      const result = await handleClientResult(async () => {
        const response = (await authClient.updateUser({
          name: parsed.data.name,
          image: parsed.data.image ?? null,
        })) as UpdateUserResponse | undefined;

        if (response?.error) {
          throw new Error(response.error.message || "Unable to update profile");
        }

        return true;
      }, "Unable to update profile");

      result.match({
        ok: () => {
          toast.success("Profile updated");
          session.refetch();
        },
        err: (error) => toast.error(error.message),
      });
    });
  };

  return (
    <main className="flex-1 p-6">
      <div className="mx-auto grid max-w-4xl gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
            <CardDescription>Update the identity shown around projects and task assignments.</CardDescription>
          </CardHeader>
          <CardContent>
            <form action={updateProfile} className="grid gap-5">
              <div className="flex items-center gap-3">
                <UserAvatar user={{ email: user?.email, image, name }} className="size-10" />
                <div className="min-w-0">
                  <p className="truncate font-medium text-sm">{name || user?.email}</p>
                  <p className="truncate text-muted-foreground text-sm">{user?.email}</p>
                </div>
              </div>

              <FieldGroup>
                <Field data-invalid={!!fieldErrors?.name}>
                  <FieldLabel htmlFor="name">Display name</FieldLabel>
                  <Input id="name" name="name" value={name} onChange={(event) => setName(event.target.value)} />
                  <FieldError>{fieldErrors?.name?.[0]}</FieldError>
                </Field>

                <Field data-invalid={!!fieldErrors?.image}>
                  <FieldLabel htmlFor="image">Avatar image URL</FieldLabel>
                  <Input
                    id="image"
                    name="image"
                    value={image}
                    onChange={(event) => setImage(event.target.value)}
                    placeholder="https://example.com/avatar.png"
                  />
                  <FieldDescription>Leave empty to use generated initials.</FieldDescription>
                  <FieldError>{fieldErrors?.image?.[0]}</FieldError>
                </Field>

                <Field>
                  <FieldLabel htmlFor="email">Email</FieldLabel>
                  <Input id="email" value={user?.email ?? ""} readOnly />
                  <FieldDescription>Email changes are not part of this account settings pass.</FieldDescription>
                </Field>
              </FieldGroup>

              <div className="flex justify-end">
                <Button type="submit" disabled={pending}>
                  {pending ? <Loader2Icon className="animate-spin" /> : <SaveIcon />}
                  Save profile
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Appearance</CardTitle>
            <CardDescription>Choose how OpenSprint should look on this device.</CardDescription>
          </CardHeader>
          <CardContent>
            <Field>
              <FieldLabel htmlFor="theme">Theme</FieldLabel>
              <NativeSelect
                id="theme"
                value={theme}
                onChange={(event) => setTheme(event.target.value)}
                className="w-48"
              >
                <NativeSelectOption value="light">Light</NativeSelectOption>
                <NativeSelectOption value="dark">Dark</NativeSelectOption>
                <NativeSelectOption value="system">System</NativeSelectOption>
              </NativeSelect>
            </Field>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Session</CardTitle>
            <CardDescription>End your current OpenSprint session on this browser.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" onClick={signOut.action} disabled={signOut.pending}>
              {signOut.pending ? "Signing out..." : "Sign out"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
