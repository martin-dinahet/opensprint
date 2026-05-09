"use client";

import { IconAlertCircle, IconArrowRight, IconLoader2, IconLock, IconMail, IconUser } from "@tabler/icons-react";
import Link from "next/link";
import type { FC } from "react";
import { Alert, AlertDescription } from "@/shared/ui/alert";
import { Button, buttonVariants } from "@/shared/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/shared/ui/card";
import { Field, FieldError, FieldLabel } from "@/shared/ui/field";
import { Input } from "@/shared/ui/input";
import { useSignUpForm } from "../lib/use-sign-up-form";

export const SignUpForm: FC = () => {
  const { action, fieldErrors, globalError, pending } = useSignUpForm();

  return (
    <div>
      <Card className="w-xs">
        <CardHeader className="space-y-1">
          <CardTitle className="font-semibold text-2xl tracking-tight">Sign up</CardTitle>
          <CardDescription>Create an account to get started.</CardDescription>
        </CardHeader>

        <form action={action}>
          <CardContent className="space-y-4">
            {globalError && (
              <Alert variant="destructive">
                <IconAlertCircle className="h-4 w-4" />
                <AlertDescription>{globalError}</AlertDescription>
              </Alert>
            )}

            <Field data-invalid={!!fieldErrors?.name}>
              <FieldLabel htmlFor="name">Name</FieldLabel>
              <div className="relative">
                <IconUser className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="name"
                  name="name"
                  type="text"
                  placeholder="John Doe"
                  autoComplete="name"
                  required
                  disabled={pending}
                  aria-invalid={!!fieldErrors?.name}
                  className={`pl-9 ${fieldErrors?.name ? "border-destructive focus-visible:ring-destructive" : ""}`}
                />
              </div>
              <FieldError>{fieldErrors?.name?.[0]}</FieldError>
            </Field>

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
                  autoComplete="new-password"
                  required
                  disabled={pending}
                  aria-invalid={!!fieldErrors?.password}
                  className={`pl-9 ${fieldErrors?.password ? "border-destructive focus-visible:ring-destructive" : ""}`}
                />
              </div>
              <FieldError>{fieldErrors?.password?.[0]}</FieldError>
            </Field>

            <Field data-invalid={!!fieldErrors?.confirmPassword}>
              <FieldLabel htmlFor="confirmPassword">Confirm password</FieldLabel>
              <div className="relative">
                <IconLock className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  autoComplete="new-password"
                  required
                  disabled={pending}
                  aria-invalid={!!fieldErrors?.confirmPassword}
                  className={`pl-9 ${fieldErrors?.confirmPassword ? "border-destructive focus-visible:ring-destructive" : ""}`}
                />
              </div>
              <FieldError>{fieldErrors?.confirmPassword?.[0]}</FieldError>
            </Field>
          </CardContent>

          <CardFooter className="mt-8 flex flex-col gap-3">
            <Button type="submit" className="w-full" disabled={pending}>
              {pending ? (
                <>
                  <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing up...
                </>
              ) : (
                <>
                  Sign up
                  <IconArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
            <Link href="/sign-in" className={buttonVariants({ variant: "outline", className: "w-full" })}>
              Sign in instead
            </Link>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};
