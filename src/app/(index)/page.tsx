"use client";

import { IconArrowRight, IconCheck, IconLayoutKanban, IconUsersGroup } from "@tabler/icons-react";
import Link from "next/link";
import { authClient } from "@/shared/lib/auth-client";
import { Button, buttonVariants } from "@/shared/shadcn/button";

const columns = [
  { name: "Backlog", tasks: ["Scope release notes", "Review onboarding copy", "Invite product team"] },
  { name: "In progress", tasks: ["Polish column drag states", "Wire project creation"] },
  { name: "Ready", tasks: ["Auth flows", "API result handling"] },
];

export default function Home() {
  const session = authClient.useSession();
  const isSignedIn = !!session.data?.user;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="fixed inset-x-0 top-0 z-20 border-b bg-background/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
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
        <section className="relative flex min-h-[88vh] items-center overflow-hidden border-b pt-14">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] bg-[size:56px_56px] opacity-35" />
          <div className="absolute right-[-18rem] bottom-[-6rem] hidden w-[56rem] rotate-[-8deg] gap-4 opacity-70 lg:flex">
            {columns.map((column) => (
              <div key={column.name} className="h-[28rem] w-64 shrink-0 rounded-lg border bg-muted/70 p-3 shadow-sm">
                <div className="mb-3 flex items-center justify-between border-b pb-2">
                  <span className="font-medium text-sm">{column.name}</span>
                  <span className="text-muted-foreground text-xs">{column.tasks.length}</span>
                </div>
                <div className="space-y-2">
                  {column.tasks.map((task) => (
                    <div key={task} className="rounded-lg border bg-card p-3 shadow-sm">
                      <div className="h-2 w-10 rounded-sm bg-foreground" />
                      <p className="mt-3 text-sm">{task}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="relative z-10 mx-auto grid w-full max-w-6xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(28rem,1fr)]">
            <div className="max-w-2xl self-center">
              <p className="mb-4 inline-flex items-center gap-2 rounded-md border bg-background px-3 py-1 font-medium text-sm">
                <IconUsersGroup className="h-4 w-4" />
                Built for focused project teams
              </p>
              <h1 className="text-balance font-semibold text-5xl tracking-tight sm:text-6xl lg:text-7xl">OpenSprint</h1>
              <p className="mt-6 max-w-xl text-lg text-muted-foreground">
                Plan projects, move tasks, and keep ownership visible without turning the project into a ceremony.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link href={isSignedIn ? "/dashboard" : "/sign-up"}>
                  <Button size="lg" className="h-12 px-6">
                    {isSignedIn ? "Open dashboard" : "Start a project"}
                    <IconArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link
                  href="/sign-in"
                  className={buttonVariants({ variant: "outline", size: "lg", className: "h-12 px-6" })}
                >
                  Sign in
                </Link>
              </div>
            </div>

            <div className="relative min-h-[24rem] lg:hidden">
              <div className="absolute inset-x-0 top-0 flex gap-3 overflow-hidden">
                {columns.slice(0, 2).map((column) => (
                  <div key={column.name} className="w-64 shrink-0 rounded-lg border bg-muted p-3">
                    <div className="mb-3 font-medium text-sm">{column.name}</div>
                    <div className="space-y-2">
                      {column.tasks.slice(0, 2).map((task) => (
                        <div key={task} className="rounded-lg border bg-card p-3 text-sm shadow-sm">
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

        <section className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:px-6 md:grid-cols-3">
          {["Feature-owned projects", "Fast task movement", "Clear team access"].map((item) => (
            <div key={item} className="flex items-center gap-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border bg-muted">
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
