import { fireEvent, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SidebarProvider, TooltipProvider } from "@/shared";
import { makeProject } from "@/test/factories";
import { renderWithClient } from "@/test/render";
import { AppSidebar } from "@/widgets/app-sidebar";

const mocks = vi.hoisted(() => ({
  push: vi.fn(),
  signOut: vi.fn(),
  user: { id: "user-1", name: "Ada Lovelace", email: "ada@example.com", image: null },
}));

vi.mock("next/navigation", () => ({
  useParams: () => ({}),
  usePathname: () => "/dashboard",
  useRouter: () => ({ push: mocks.push }),
}));

vi.mock("@/shared", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/shared")>();

  return {
    ...actual,
    authClient: {
      ...actual.authClient,
      useSession: () => ({ data: { user: mocks.user }, isPending: false }),
    },
  };
});

vi.mock("@/features/auth", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/features/auth")>();

  return {
    ...actual,
    useSignOut: () => ({ action: mocks.signOut, pending: false }),
  };
});

vi.mock("@/entities/project", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/entities/project")>();

  return {
    ...actual,
    useProjects: () => ({ data: [makeProject()], isLoading: false }),
  };
});

function Wrapper({ children }: { children: ReactNode }) {
  return (
    <TooltipProvider>
      <SidebarProvider>{children}</SidebarProvider>
    </TooltipProvider>
  );
}

describe("AppSidebar", () => {
  beforeEach(() => {
    mocks.push.mockReset();
    mocks.signOut.mockReset();
  });

  it("navigates to account settings through the sidebar footer", async () => {
    renderWithClient(
      <Wrapper>
        <AppSidebar />
      </Wrapper>,
    );

    fireEvent.click(screen.getByRole("button", { name: /ada lovelace/i }));

    const accountSettings = await screen.findByRole("button", { name: "Account settings" });
    fireEvent.click(accountSettings);

    expect(mocks.push).toHaveBeenCalledWith("/account");
  });

  it("opens project creation from the projects list", async () => {
    renderWithClient(
      <Wrapper>
        <AppSidebar />
      </Wrapper>,
    );

    const newProjectButtons = screen.getAllByRole("button", { name: "New Project" });
    expect(newProjectButtons).toHaveLength(1);

    fireEvent.click(newProjectButtons[0]);

    expect(await screen.findByRole("heading", { name: "Create project" })).toBeInTheDocument();
    expect(screen.getByLabelText("First board name")).toBeInTheDocument();
  });
});
