"use client";

import { useTheme } from "next-themes";
import { useMemo } from "react";
import { useSignOut } from "@/features/auth";
import { UpdateProfileForm } from "@/features/update-profile";
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Field,
  FieldLabel,
  NativeSelect,
  NativeSelectOption,
} from "@/shared";
import { useDashboardHeader } from "@/widgets/header";

export function AccountConsole() {
  const signOut = useSignOut();
  const { setTheme, theme = "system" } = useTheme();
  const header = useMemo(
    () => ({ title: "Account console", description: "Profile, appearance, and current session controls." }),
    [],
  );

  useDashboardHeader(header);

  return (
    <main className="flex-1 p-4 sm:p-6">
      <div className="mx-auto grid max-w-4xl gap-4">
        <UpdateProfileForm />

        <Card className="border-2 shadow-none">
          <CardHeader>
            <CardTitle className="font-black uppercase">Appearance</CardTitle>
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

        <Card className="border-2 shadow-none">
          <CardHeader>
            <CardTitle className="font-black uppercase">Session</CardTitle>
            <CardDescription>End your current OpenSprint session on this browser.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" onClick={signOut.action} disabled={signOut.pending}>
              {signOut.pending ? "Signing out…" : "Sign Out"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
