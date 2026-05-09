import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ProjectCard } from "@/entities/project";
import { makeProject } from "@/test/factories";
import { renderWithClient } from "@/test/render";

describe("ProjectCard", () => {
  it("renders project navigation as a real link", () => {
    renderWithClient(<ProjectCard project={makeProject({ id: "project-42", name: "Website launch" })} />);

    const link = screen.getByRole("link", { name: /website launch/i });

    expect(link).toHaveAttribute("href", "/projects/project-42");
  });
});
