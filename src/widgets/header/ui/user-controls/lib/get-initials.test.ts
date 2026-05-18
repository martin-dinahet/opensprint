import { describe, expect, it } from "vitest";
import { getInitials } from "./get-initials";

describe("getInitials", () => {
  it("uses the first two name parts", () => {
    expect(getInitials({ name: "Ada Lovelace", email: "ada@example.com" })).toBe("AL");
  });

  it("falls back to email parts and then the product name", () => {
    expect(getInitials({ email: "grace.hopper@example.com" })).toBe("GH");
    expect(getInitials(null)).toBe("OS");
  });
});
