import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SidebarProvider, TooltipProvider } from "@/shared";
import { useDashboardHeaderState } from "../model";
import { HeaderWidget } from "./HeaderWidget";

vi.mock("../model", () => ({
  useDashboardHeaderState: vi.fn(),
}));

vi.mock("./breadcrumbs", () => ({
  HeaderBreadcrumbs: () => <nav>Breadcrumbs</nav>,
}));

function Wrapper({ children }: { children: ReactNode }) {
  return (
    <TooltipProvider>
      <SidebarProvider>{children}</SidebarProvider>
    </TooltipProvider>
  );
}

describe("HeaderWidget", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useDashboardHeaderState).mockReturnValue({});
  });

  it("renders default header controls and breadcrumbs", () => {
    render(<HeaderWidget />, { wrapper: Wrapper });

    expect(screen.getByRole("button", { name: "Toggle Sidebar" })).toBeInTheDocument();
    expect(screen.getByText("Breadcrumbs")).toBeInTheDocument();
  });

  it("renders configured title, description, eyebrow, and actions", () => {
    vi.mocked(useDashboardHeaderState).mockReturnValue({
      actions: <button type="button">Create</button>,
      description: "Current sprint work",
      eyebrow: <span>Planning</span>,
      title: "Sprint board",
    });

    render(<HeaderWidget />, { wrapper: Wrapper });

    expect(screen.getByRole("heading", { name: "Sprint board" })).toBeInTheDocument();
    expect(screen.getByText("Current sprint work")).toBeInTheDocument();
    expect(screen.getByText("Planning")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Create" })).toBeInTheDocument();
    expect(screen.queryByText("Breadcrumbs")).not.toBeInTheDocument();
  });
});
