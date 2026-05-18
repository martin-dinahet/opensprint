import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useProject } from "@/entities/project";
import { HeaderBreadcrumbs } from "./HeaderBreadcrumbs";

const { pathnameMock } = vi.hoisted(() => ({
  pathnameMock: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  usePathname: pathnameMock,
}));

vi.mock("@/entities/project", () => ({
  useProject: vi.fn(),
}));

describe("HeaderBreadcrumbs", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    pathnameMock.mockReturnValue("/dashboard");
    vi.mocked(useProject).mockReturnValue({ data: undefined } as never);
  });

  it("renders nothing for the root path", () => {
    pathnameMock.mockReturnValue("/");

    const { container } = render(<HeaderBreadcrumbs />);

    expect(container).toBeEmptyDOMElement();
  });

  it("renders formatted path labels", () => {
    pathnameMock.mockReturnValue("/dashboard/release-notes");

    render(<HeaderBreadcrumbs />);

    expect(screen.getByText("Projects")).toBeInTheDocument();
    expect(screen.getByText("Release Notes")).toBeInTheDocument();
  });

  it("uses the loaded project name for project id segments", () => {
    pathnameMock.mockReturnValue("/projects/project-1/members");
    vi.mocked(useProject).mockReturnValue({ data: { id: "project-1", name: "Website Redesign" } } as never);

    render(<HeaderBreadcrumbs />);

    expect(useProject).toHaveBeenCalledWith("project-1");
    expect(screen.getByText("Projects")).toBeInTheDocument();
    expect(screen.getByText("Website Redesign")).toBeInTheDocument();
    expect(screen.getByText("Members")).toBeInTheDocument();
  });
});
