import type { User } from "@/shared/types";

type InitialsUser = Partial<Pick<User, "email" | "name">>;

export const getInitials = (user?: InitialsUser | null) => {
  const source = user?.name || user?.email || "OpenSprint";
  const [first = "", second = ""] = source.split(/[\s@.]+/);

  return `${first[0] ?? "O"}${second[0] ?? "S"}`.toUpperCase();
};
