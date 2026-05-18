import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useDashboardHeaderState } from "../model";
import { HeaderWidget } from "./HeaderWidget";

vi.mock("../model", () => ({
  useDashboardHeaderState: vi.fn(),
}));

vi.mock("./breadcrumbs", () => ({
  HeaderBreadcrumbs: () => <nav>Breadcrumbs</nav>,
}));

vi.mock("./logo", () => ({
  HeaderLogo: () => <a href="/dashboard">OpenSprint</a>,
}));

vi.mock("./theme-switcher", () => ({
  HeaderThemeSwitcher: () => <button type="button">Theme</button>,
}));

vi.mock("./user-controls", () => ({
  HeaderUserControls: () => <button type="button">User</button>,
}));

describe("HeaderWidget", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useDashboardHeaderState).mockReturnValue({});
  });

  it("renders default header controls and breadcrumbs", () => {
    render(<HeaderWidget />);

    expect(screen.getByText("OpenSprint")).toBeInTheDocument();
    expect(screen.getByText("Breadcrumbs")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Theme" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "User" })).toBeInTheDocument();
  });

  it("renders configured title, description, eyebrow, and actions", () => {
    vi.mocked(useDashboardHeaderState).mockReturnValue({
      actions: <button type="button">Create</button>,
      description: "Current sprint work",
      eyebrow: <span>Planning</span>,
      title: "Sprint board",
    });

    render(<HeaderWidget />);

    expect(screen.getByRole("heading", { name: "Sprint board" })).toBeInTheDocument();
    expect(screen.getByText("Current sprint work")).toBeInTheDocument();
    expect(screen.getByText("Planning")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Create" })).toBeInTheDocument();
    expect(screen.queryByText("Breadcrumbs")).not.toBeInTheDocument();
  });
});
