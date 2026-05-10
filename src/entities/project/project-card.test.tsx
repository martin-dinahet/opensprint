import { fireEvent, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ProjectCard } from "@/entities/project";
import { makeProject } from "@/test/factories";
import { renderWithClient } from "@/test/render";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

describe("ProjectCard", () => {
  it("renders project navigation as a real link", () => {
    renderWithClient(<ProjectCard project={makeProject({ id: "project-42", name: "Website launch" })} />);

    const link = screen.getByRole("link", { name: /website launch/i });

    expect(link).toHaveAttribute("href", "/projects/project-42");
  });

  it("exposes contextual project actions", async () => {
    renderWithClient(<ProjectCard project={makeProject({ name: "Website launch" })} />);

    fireEvent.click(screen.getByRole("button", { name: "Project actions" }));

    expect(await screen.findByRole("menuitem", { name: "Edit project" })).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: "Delete project" })).toBeInTheDocument();
  });
});
