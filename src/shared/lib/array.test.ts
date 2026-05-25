import { describe, expect, it } from "vitest";
import { moveArrayItem } from "./array";

describe("moveArrayItem", () => {
  it("moves an item up or down without mutating the original array", () => {
    const items = ["first", "second", "third"];

    expect(moveArrayItem(items, 1, -1)).toEqual(["second", "first", "third"]);
    expect(moveArrayItem(items, 1, 1)).toEqual(["first", "third", "second"]);
    expect(items).toEqual(["first", "second", "third"]);
  });

  it("returns the original array when the move is out of bounds", () => {
    const items = ["first", "second"];

    expect(moveArrayItem(items, 0, -1)).toBe(items);
    expect(moveArrayItem(items, 1, 1)).toBe(items);
    expect(moveArrayItem(items, -1, 1)).toBe(items);
  });
});
