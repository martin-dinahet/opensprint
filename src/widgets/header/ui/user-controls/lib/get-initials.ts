type User = {
  email?: string | null;
  name?: string | null;
};

export const getInitials = (user?: User | null) => {
  const source = user?.name || user?.email || "OpenSprint";
  const [first = "", second = ""] = source.split(/[\s@.]+/);

  return `${first[0] ?? "O"}${second[0] ?? "S"}`.toUpperCase();
};
