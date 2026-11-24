import { describe, expect, it } from "vitest";

import { safeRedirect } from "./demo-auth";

describe("safeRedirect", () => {
  it("keeps an in-app path with its query", () => {
    expect(safeRedirect("/review?from=DEL&to=BOM&out=abc.saver")).toBe("/review?from=DEL&to=BOM&out=abc.saver");
  });
  it("sends outside links back home", () => {
    expect(safeRedirect("https://evil.example")).toBe("/");
    expect(safeRedirect("//evil.example")).toBe("/");
  });
  it("defaults to home when missing", () => {
    expect(safeRedirect(undefined)).toBe("/");
  });
});
