"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/shared/shadcn/avatar";

type User = {
  email?: string | null;
  image?: string | null;
  name?: string | null;
};

function initialsFor(user?: User | null) {
  const source = user?.name || user?.email || "OpenSprint";
  const [first = "", second = ""] = source.split(/[\s@.]+/);
  return `${first[0] ?? "O"}${second[0] ?? "S"}`.toUpperCase();
}

export function UserAvatar({ className, user }: { className?: string; user?: User | null }) {
  return (
    <Avatar className={className}>
      {user?.image && <AvatarImage src={user.image} alt={user.name || user.email || "User"} />}
      <AvatarFallback>{initialsFor(user)}</AvatarFallback>
    </Avatar>
  );
}
