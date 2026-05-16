import { LABELS } from "../model/labels";

export const formatLabel = (slug: string): string => {
  return (
    LABELS[slug] ??
    slug
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ")
  );
};
