"use client";

import { IconArrowRight, IconCheck, IconLayoutKanban, IconPlus } from "@tabler/icons-react";
import Link from "next/link";
import { authClient, Button, buttonVariants } from "@/shared";

const columns = [
  { name: "Backlog", tasks: ["Scope release notes", "Review onboarding copy", "Invite product team"] },
  { name: "In progress", tasks: ["Polish column drag states", "Wire project creation"] },
  { name: "Ready", tasks: ["Auth flows", "API result handling"] },
];

export default function Home() {
  const session = authClient.useSession();
  const isSignedIn = !!session.data?.user;
  const primaryHref = isSignedIn ? "/dashboard" : "/sign-up";

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-20 border-b bg-background/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
            <IconLayoutKanban className="h-5 w-5" />
            OpenSprint
          </Link>
          <nav className="flex items-center gap-2">
            {isSignedIn ? (
              <Link href="/dashboard" className={buttonVariants({ size: "sm" })}>
                Dashboard
                <IconArrowRight className="ml-2 h-4 w-4" />
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
          </nav>
        </div>
      </header>

      <main>
        <section className="border-b">
          <div className="mx-auto grid min-h-[calc(100svh-3.5rem)] max-w-7xl gap-10 px-4 py-10 sm:px-6 lg:grid-cols-[minmax(18rem,0.58fr)_minmax(0,1fr)] lg:items-center">
            <div className="max-w-xl">
              <h1 className="text-balance font-semibold text-5xl tracking-tight sm:text-6xl">OpenSprint</h1>
              <p className="mt-5 text-pretty text-lg text-muted-foreground">
                Plan projects, move tasks, and keep ownership visible without turning the project into a ceremony.
              </p>
              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <Link href={primaryHref}>
                  <Button size="lg" className="h-12 px-6">
                    {isSignedIn ? "Open Dashboard" : "Start a Project"}
                    <IconArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                {!isSignedIn ? (
                  <Link
                    href="/sign-in"
                    className={buttonVariants({ variant: "ghost", size: "lg", className: "h-12 px-6" })}
                  >
                    Sign in
                  </Link>
                ) : null}
              </div>
            </div>

            <div className="min-w-0 overflow-hidden rounded-lg border bg-muted/30 p-3">
              <div className="mb-3 flex items-center justify-between px-1">
                <div className="min-w-0">
                  <p className="truncate font-medium text-sm">Release Plan</p>
                  <p className="text-muted-foreground text-xs">3 columns · 7 tasks</p>
                </div>
                <Button size="icon-sm" aria-label="Add task">
                  <IconPlus />
                </Button>
              </div>
              <div className="grid min-h-[26rem] gap-3 md:grid-cols-3">
                {columns.map((column) => (
                  <div key={column.name} className="min-w-0 rounded-md border bg-background p-3">
                    <div className="mb-3 flex items-center justify-between gap-2">
                      <span className="truncate font-medium text-sm">{column.name}</span>
                      <span className="text-muted-foreground text-xs tabular-nums">{column.tasks.length}</span>
                    </div>
                    <div className="space-y-2">
                      {column.tasks.map((task) => (
                        <div key={task} className="rounded-md border bg-card px-3 py-2 text-sm shadow-xs">
                          {task}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto grid max-w-7xl gap-4 px-4 py-6 sm:px-6 md:grid-cols-3">
          {["Feature-owned projects", "Fast task movement", "Clear team access"].map((item) => (
            <div key={item} className="flex items-center gap-3">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border bg-muted">
                <IconCheck className="h-4 w-4" />
              </span>
              <p className="font-medium text-sm">{item}</p>
            </div>
          ))}
        </section>
      </main>
    </div>
  );
}
