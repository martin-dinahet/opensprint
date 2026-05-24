import type { Metadata } from "next";
import type { ReactNode } from "react";
import { ClientProviders } from "./providers";
import "@/app/globals.css";

export const metadata: Metadata = {
  title: {
    default: "OpenSprint",
    template: "%s | OpenSprint",
  },
  description: "A focused project workspace for planning projects, tasks, and team access.",
};

type Props = {
  children: ReactNode;
};

export default function RootLayout({ children }: Props) {
  return (
    <html lang="en" className="font-sans" suppressHydrationWarning>
      <body className="antialiased">
        <ClientProviders>{children}</ClientProviders>
      </body>
    </html>
  );
}
