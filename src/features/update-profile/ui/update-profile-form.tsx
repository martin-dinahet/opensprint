"use client";

import { Loader2Icon, SaveIcon } from "lucide-react";
import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import {
  authClient,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  handleClientResult,
  Input,
  parseFormData,
} from "@/shared";
import { UserAvatar } from "@/widgets/app-sidebar";
import { profileSchema, type UpdateUserResponse } from "../model";

export function UpdateProfileForm() {
  const session = authClient.useSession();
  const [pending, startTransition] = useTransition();
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]> | null>(null);
  const [name, setName] = useState("");
  const [image, setImage] = useState("");
  const user = session.data?.user;

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
    <Card className="border-2 shadow-none">
      <CardHeader>
        <CardTitle className="font-black uppercase">Profile</CardTitle>
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
                placeholder="https://example.com/avatar.png…"
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
  );
}
