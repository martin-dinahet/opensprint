import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { authClient } from "@/shared";
import { HeaderUserControls } from "./HeaderUserControls";

const { pushMock, signOutMock, signOutState } = vi.hoisted(() => ({
  pushMock: vi.fn(),
  signOutMock: vi.fn(),
  signOutState: {
    error: null as string | null,
    pending: false,
  },
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
}));

vi.mock("@/features/auth", () => ({
  useSignOut: () => ({
    action: signOutMock,
    error: signOutState.error,
    pending: signOutState.pending,
  }),
}));

vi.mock("@/shared", async () => {
  const actual = await vi.importActual<typeof import("@/shared")>("@/shared");
  return {
    ...actual,
    authClient: {
      useSession: vi.fn(),
    },
  };
});

describe("HeaderUserControls", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    signOutState.error = null;
    signOutState.pending = false;
    vi.mocked(authClient.useSession).mockReturnValue({
      data: { user: { id: "user-1", name: "Ada Lovelace", email: "ada@example.com", image: null } },
    } as never);
  });

  it("renders user initials and account actions", () => {
    render(<HeaderUserControls />);

    fireEvent.click(screen.getByRole("button"));

    expect(screen.getByText("AL")).toBeInTheDocument();
    expect(screen.getByText("Account settings")).toBeInTheDocument();
    expect(screen.getByText("Profile")).toBeInTheDocument();
  });

  it("routes account actions and triggers sign out", () => {
    render(<HeaderUserControls />);

    fireEvent.click(screen.getByRole("button"));
    fireEvent.click(screen.getByText("Account settings"));
    fireEvent.click(screen.getByRole("button"));
    fireEvent.click(screen.getByText("Sign out"));

    expect(pushMock).toHaveBeenCalledWith("/account");
    expect(signOutMock).toHaveBeenCalled();
  });

  it("shows sign-out errors and pending state", () => {
    signOutState.error = "Unable to sign out";
    signOutState.pending = true;

    render(<HeaderUserControls />);

    fireEvent.click(screen.getByRole("button"));

    expect(screen.getByText("Unable to sign out")).toBeInTheDocument();
    expect(screen.getByText("Signing out...")).toBeInTheDocument();
  });
});
