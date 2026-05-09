import { fireEvent, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AppSidebar } from "@/widgets/app-sidebar";
import { SidebarProvider } from "@/shared/ui/sidebar";
import { TooltipProvider } from "@/shared/ui/tooltip";
import { makeProject } from "@/test/factories";
import { renderWithClient } from "@/test/render";

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

vi.mock("@/shared/lib/auth-client", () => ({
  authClient: {
    useSession: () => ({ data: { user: mocks.user }, isPending: false }),
  },
}));

vi.mock("@/features/auth/hooks/use-sign-out", () => ({
  useSignOut: () => ({ action: mocks.signOut, pending: false }),
}));

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

  it("opens the account menu without crashing and navigates through client routing", async () => {
    renderWithClient(
      <Wrapper>
        <AppSidebar />
      </Wrapper>,
    );

    fireEvent.click(screen.getByRole("button", { name: /ada lovelace/i }));

    const accountItem = await screen.findByRole("menuitem", { name: "Account" });
    fireEvent.click(accountItem);

    expect(mocks.push).toHaveBeenCalledWith("/account");
  });
});
