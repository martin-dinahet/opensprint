import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SidebarProvider, TooltipProvider } from "@/shared";
import { useDashboardHeaderState } from "../model";
import { HeaderWidget } from "./HeaderWidget";

vi.mock("../model", () => ({
  useDashboardHeaderState: vi.fn(),
}));

vi.mock("@/features/invitation-notifications", () => ({
  InvitationNotificationBell: () => <button type="button">Notifications</button>,
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

  it("renders fixed default header controls", () => {
    render(<HeaderWidget />, { wrapper: Wrapper });

    expect(screen.getByRole("button", { name: "Toggle Sidebar" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "OpenSprint" })).toBeInTheDocument();
  });

  it("renders configured title, context, and actions without breadcrumbs", () => {
    vi.mocked(useDashboardHeaderState).mockReturnValue({
      actions: <button type="button">Create</button>,
      description: "Current sprint work",
      eyebrow: <span>Planning</span>,
      title: "Sprint board",
    });

    render(<HeaderWidget />, { wrapper: Wrapper });

    expect(screen.getByRole("heading", { name: "Sprint board" })).toBeInTheDocument();
    expect(screen.getByText("Planning")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Create" })).toBeInTheDocument();
    expect(screen.queryByText("Current sprint work")).not.toBeInTheDocument();
  });

  it("uses the description as context when there is no eyebrow", () => {
    vi.mocked(useDashboardHeaderState).mockReturnValue({
      description: "Current sprint work",
      title: "Sprint board",
    });

    render(<HeaderWidget />, { wrapper: Wrapper });

    expect(screen.getByText("Current sprint work")).toBeInTheDocument();
  });
});
