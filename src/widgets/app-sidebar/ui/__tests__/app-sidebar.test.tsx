import { fireEvent, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AppSidebar } from "@/widgets/app-sidebar";
import { SidebarProvider } from "@/shared/ui/sidebar";
import { TooltipProvider } from "@/shared/ui/tooltip";
import { makeBoard, makeProject, makeProjectMember } from "@/test/factories";
import { renderWithClient } from "@/test/render";

const mocks = vi.hoisted(() => ({
  addMember: vi.fn(),
  pathname: "/dashboard",
  push: vi.fn(),
  signOut: vi.fn(),
  user: { id: "user-1", name: "Ada Lovelace", email: "ada@example.com", image: null },
}));

vi.mock("next/navigation", () => ({
  useParams: () => (mocks.pathname.startsWith("/projects/") ? { id: "project-1" } : {}),
  usePathname: () => mocks.pathname,
  useRouter: () => ({ push: mocks.push }),
}));

vi.mock("@/shared/lib/auth-client", () => ({
  authClient: {
    useSession: () => ({ data: { user: mocks.user }, isPending: false }),
  },
}));

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

vi.mock("@/entities/board", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/entities/board")>();

  return {
    ...actual,
    useBoards: () => ({ data: [makeBoard({ id: "board-1", name: "Sprint board" })], isLoading: false }),
  };
});

vi.mock("@/entities/member", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/entities/member")>();

  return {
    ...actual,
    useAddProjectMember: () => ({ isPending: false, mutateAsync: mocks.addMember }),
    useProjectMembers: () => ({ data: [makeProjectMember()], isLoading: false }),
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
    mocks.pathname = "/dashboard";
    mocks.addMember.mockReset();
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

  it("renders the general sidebar hierarchy", () => {
    renderWithClient(
      <Wrapper>
        <AppSidebar />
      </Wrapper>,
    );

    const home = screen.getByRole("link", { name: "Home" });
    const settings = screen.getByRole("button", { name: "Settings" });
    const projects = screen.getByRole("button", { name: "Projects" });

    expect(home).toHaveAttribute("href", "/dashboard");
    expect(home.compareDocumentPosition(settings)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
    expect(settings.compareDocumentPosition(projects)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);

    fireEvent.click(settings);

    expect(screen.getByRole("button", { name: "General" })).toBeDisabled();
    expect(screen.getByRole("link", { name: "Account" })).toHaveAttribute("href", "/account");
    expect(screen.queryByText("Current project")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "New project" })).toBeInTheDocument();
  });

  it("renders project-only navigation with boards and member actions", () => {
    mocks.pathname = "/projects/project-1/boards/board-1";

    renderWithClient(
      <Wrapper>
        <AppSidebar />
      </Wrapper>,
    );

    expect(screen.getByRole("link", { name: "Current project Launch" })).toHaveAttribute("href", "/projects/project-1");
    expect(screen.getByRole("link", { name: "Overview" })).toHaveAttribute("href", "/projects/project-1");
    expect(screen.getByRole("button", { name: "Boards" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Sprint board" })).toHaveAttribute(
      "href",
      "/projects/project-1/boards/board-1",
    );

    fireEvent.click(screen.getByRole("button", { name: "Members" }));

    expect(screen.getByRole("button", { name: "Invite member" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Manage" })).toHaveAttribute("href", "/projects/project-1/members");
  });

  it("opens the sidebar invite dialog from project member actions", async () => {
    mocks.pathname = "/projects/project-1";

    renderWithClient(
      <Wrapper>
        <AppSidebar />
      </Wrapper>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Members" }));
    fireEvent.click(screen.getByRole("button", { name: "Invite member" }));

    expect(await screen.findByRole("dialog")).toHaveTextContent("Invite member");
  });
});
