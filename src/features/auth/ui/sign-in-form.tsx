"use client";

import { IconAlertCircle, IconArrowRight, IconLoader2, IconLock, IconMail } from "@tabler/icons-react";
import Link from "next/link";
import type { FC } from "react";
import { Alert, AlertDescription } from "@/shared/shadcn/alert";
import { Button, buttonVariants } from "@/shared/shadcn/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/shared/shadcn/card";
import { Field, FieldError, FieldLabel } from "@/shared/shadcn/field";
import { Input } from "@/shared/shadcn/input";
import { useSignInForm } from "../model/use-sign-in-form";

export const SignInForm: FC = () => {
  const { action, fieldErrors, globalError, pending } = useSignInForm();

  return (
    <div>
      <Card className="w-xs">
        <CardHeader className="space-y-1">
          <CardTitle className="font-semibold text-2xl tracking-tight">Sign in</CardTitle>
          <CardDescription>Enter your email and password to access your account.</CardDescription>
        </CardHeader>

        <form action={action}>
          <CardContent className="space-y-4">
            {globalError && (
              <Alert variant="destructive">
                <IconAlertCircle className="h-4 w-4" />
                <AlertDescription>{globalError}</AlertDescription>
              </Alert>
            )}

            <Field data-invalid={!!fieldErrors?.email}>
              <FieldLabel htmlFor="email">Email</FieldLabel>
              <div className="relative">
                <IconMail className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="you@example.com"
                  autoComplete="email"
                  required
                  disabled={pending}
                  aria-invalid={!!fieldErrors?.email}
                  className={`pl-9 ${fieldErrors?.email ? "border-destructive focus-visible:ring-destructive" : ""}`}
                />
              </div>
              <FieldError>{fieldErrors?.email?.[0]}</FieldError>
            </Field>

            <Field data-invalid={!!fieldErrors?.password}>
              <FieldLabel htmlFor="password">Password</FieldLabel>
              <div className="relative">
                <IconLock className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  autoComplete="current-password"
                  required
                  disabled={pending}
                  aria-invalid={!!fieldErrors?.password}
                  className={`pl-9 ${fieldErrors?.password ? "border-destructive focus-visible:ring-destructive" : ""}`}
                />
              </div>
              <FieldError>{fieldErrors?.password?.[0]}</FieldError>
            </Field>
          </CardContent>

          <CardFooter className="mt-8 flex flex-col gap-3">
            <Button type="submit" className="w-full" disabled={pending}>
              {pending ? (
                <>
                  <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  Sign in
                  <IconArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
            <Link href="/sign-up" className={buttonVariants({ variant: "outline", className: "w-full" })}>
              Create an account
            </Link>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};
