import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { HeaderThemeSwitcher } from "./HeaderThemeSwitcher";

const { setThemeMock, themeState } = vi.hoisted(() => ({
  setThemeMock: vi.fn(),
  themeState: { theme: "light" },
}));

vi.mock("next-themes", () => ({
  useTheme: () => ({
    theme: themeState.theme,
    setTheme: setThemeMock,
  }),
}));

describe("HeaderThemeSwitcher", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    themeState.theme = "light";
  });

  it("switches from light to dark theme after mounting", async () => {
    render(<HeaderThemeSwitcher />);

    const button = await screen.findByRole("button", { name: "Switch to dark theme" });
    fireEvent.click(button);

    expect(setThemeMock).toHaveBeenCalledWith("dark");
  });

  it("switches from dark to light theme", async () => {
    themeState.theme = "dark";

    render(<HeaderThemeSwitcher />);

    const button = await screen.findByRole("button", { name: "Switch to light theme" });
    fireEvent.click(button);

    await waitFor(() => expect(setThemeMock).toHaveBeenCalledWith("light"));
  });
});
