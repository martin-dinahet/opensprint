"use client";

import { IconArrowRight, IconStack2, IconUsers } from "@tabler/icons-react";
import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";

const FEATURES = [
  {
    icon: IconStack2,
    title: "Organize work",
    description: "Kanban boards that scale with your team. Drag, drop, done.",
  },
  {
    icon: IconUsers,
    title: "Collaborate",
    description: "Invite your team and work together in real-time.",
  },
];

export default function Home() {
  const session = authClient.useSession() as { data?: { user?: unknown } | null };

  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex h-14 items-center justify-between border-b px-6">
        <span className="font-semibold tracking-tight">OpenSprint</span>
        <div className="flex gap-3">
          {session ? (
            <Link href="/dashboard">
              <Button size="sm">
                Go to Dashboard
                <IconArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          ) : (
            <>
              <Link href="/sign-in" className={buttonVariants({ variant: "ghost", size: "sm" })}>
                Sign in
              </Link>
              <Link href="/sign-up" className={buttonVariants({ size: "sm" })}>
                Get started
              </Link>
            </>
          )}
        </div>
      </header>

      <main className="flex flex-1 flex-col items-center justify-center px-4">
        <div className="max-w-2xl text-center">
          <h1 className="font-bold text-4xl tracking-tight sm:text-5xl lg:text-6xl">
            Your new favorite project manager
          </h1>
          <p className="mx-auto mt-6 max-w-lg text-balance text-lg text-muted-foreground">
            OpenSprint is a fast, simple project management tool that helps your team stay organized and ship faster.
          </p>
          <div className="mt-10 flex flex-col gap-4 sm:flex-row">
            <Link href={session ? "/dashboard" : "/sign-up"}>
              <Button size="lg" className="h-12 px-8">
                {session ? "Go to Dashboard" : "Start for free"}
                <IconArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>

        <div className="mt-24 grid max-w-3xl grid-cols-1 gap-8 sm:grid-cols-2">
          {FEATURES.map((feature) => (
            <div key={feature.title} className="flex flex-col gap-2 text-center sm:text-left">
              <feature.icon className="h-8 w-8 text-muted-foreground" />
              <h2 className="font-semibold text-lg">{feature.title}</h2>
              <p className="text-sm text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>
      </main>

      <footer className="border-t py-6">
        <div className="container flex items-center justify-between px-4">
          <p className="text-sm text-muted-foreground">OpenSprint</p>
          <p className="text-sm text-muted-foreground">v1.0.0</p>
        </div>
      </footer>
    </div>
  );
}
