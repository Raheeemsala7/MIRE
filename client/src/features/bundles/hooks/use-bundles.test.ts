import { describe, it, expect } from "vitest";
import { bundleQueryKeys } from "./use-bundles";

describe("bundleQueryKeys", () => {
  it("produces hierarchical stable query keys", () => {
    expect(bundleQueryKeys.all).toEqual(["admin", "bundles"]);
    expect(bundleQueryKeys.lists()).toEqual(["admin", "bundles", "list"]);
    expect(bundleQueryKeys.list({ page: 1 })).toEqual(["admin", "bundles", "list", { page: 1 }]);
    expect(bundleQueryKeys.details()).toEqual(["admin", "bundles", "detail"]);
    expect(bundleQueryKeys.detail("bundle-123")).toEqual(["admin", "bundles", "detail", "bundle-123"]);
  });
});
