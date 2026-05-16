import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
};

export default function ProjectLayout({ children }: Props) {
  return <div className="flex min-h-0 flex-1 flex-col">{children}</div>;
}
