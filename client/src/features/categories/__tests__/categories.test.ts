import { describe, it, expect } from "vitest";
import {
  buildCategoryTree,
  getDescendantCategoryIds,
  calculateCategoryStats,
  filterCategories,
  getParentCategoryId,
  getParentCategoryName,
  countDirectSubcategories,
  flattenCategoryTree,
} from "../utils/category.util";
import {
  categoryFormSchema,
  categoryImageSchema,
} from "../schemas/category.schema";
import { can } from "@/lib/permissions/can";
import { PERMISSIONS, PERMISSION_BACKEND_MAP } from "@/config/rbac.config";
import type { CategoryItem } from "../types/category.types";

const mockCategories: CategoryItem[] = [
  {
    _id: "cat-root-1",
    name: "Evening Dresses",
    slug: "evening-dresses",
    description: "Luxury evening wear",
    parentCategory: null,
    isActive: true,
    sortOrder: 1,
    image: { url: "https://example.com/img1.jpg", publicId: "p1" },
  },
  {
    _id: "cat-sub-1a",
    name: "Satin Silhouettes",
    slug: "satin-silhouettes",
    description: "Double-lined satin",
    parentCategory: { _id: "cat-root-1", name: "Evening Dresses", slug: "evening-dresses" },
    isActive: true,
    sortOrder: 1,
  },
  {
    _id: "cat-sub-1b",
    name: "Velvet Gowns",
    slug: "velvet-gowns",
    description: "Rich velvet",
    parentCategory: "cat-root-1", // Unpopulated format test
    isActive: true,
    sortOrder: 2,
  },
  {
    _id: "cat-sub-sub-1",
    name: "Hand Embroidered Gowns",
    slug: "hand-embroidered-gowns",
    description: "Fine beadwork",
    parentCategory: "cat-sub-1a",
    isActive: false,
    sortOrder: 1,
  },
  {
    _id: "cat-root-2",
    name: "Modest Abayas",
    slug: "modest-abayas",
    description: "Crepe and linen abayas",
    parentCategory: null,
    isActive: true,
    sortOrder: 2,
  },
];

describe("Category Utilities & Hierarchy Engine", () => {
  describe("getParentCategoryId & getParentCategoryName", () => {
    it("correctly extracts parent ID from null, populated object, or string ID", () => {
      expect(getParentCategoryId(mockCategories[0])).toBeNull();
      expect(getParentCategoryId(mockCategories[1])).toBe("cat-root-1");
      expect(getParentCategoryId(mockCategories[2])).toBe("cat-root-1");
    });

    it("correctly resolves parent name from populated object or allCategories list", () => {
      expect(getParentCategoryName(mockCategories[0])).toBeNull();
      expect(getParentCategoryName(mockCategories[1])).toBe("Evening Dresses");
      expect(getParentCategoryName(mockCategories[2], mockCategories)).toBe("Evening Dresses");
    });
  });

  describe("buildCategoryTree", () => {
    it("builds a multi-level tree with accurate depth and subcategoriesCount", () => {
      const tree = buildCategoryTree(mockCategories);

      // Root level contains 2 root categories
      expect(tree).toHaveLength(2);
      expect(tree[0]._id).toBe("cat-root-1");
      expect(tree[0].depth).toBe(0);
      expect(tree[1]._id).toBe("cat-root-2");
      expect(tree[1].depth).toBe(0);

      // Root 1 has 2 direct children: Satin Silhouettes and Velvet Gowns
      expect(tree[0].children).toHaveLength(2);
      expect(tree[0].children[0]._id).toBe("cat-sub-1a");
      expect(tree[0].children[0].depth).toBe(1);
      expect(tree[0].children[1]._id).toBe("cat-sub-1b");
      expect(tree[0].children[1].depth).toBe(1);

      // Satin Silhouettes has 1 child: Hand Embroidered Gowns (grandchild at depth 2)
      expect(tree[0].children[0].children).toHaveLength(1);
      const grandchild = tree[0].children[0].children[0];
      expect(grandchild._id).toBe("cat-sub-sub-1");
      expect(grandchild.depth).toBe(2);

      // subcategoriesCount accumulates all descendants
      expect(tree[0].subcategoriesCount).toBe(3); // 2 children + 1 grandchild
      expect(tree[0].children[0].subcategoriesCount).toBe(1); // 1 child
      expect(tree[1].subcategoriesCount).toBe(0); // Leaf root node
    });

    it("respects sortOrder and alphabetical fallback", () => {
      const items: CategoryItem[] = [
        { _id: "b", name: "Bravo", slug: "bravo", isActive: true, sortOrder: 10, parentCategory: null },
        { _id: "a", name: "Alpha", slug: "alpha", isActive: true, sortOrder: 5, parentCategory: null },
        { _id: "c", name: "Charlie", slug: "charlie", isActive: true, sortOrder: 10, parentCategory: null },
      ];
      const tree = buildCategoryTree(items);
      expect(tree.map((n) => n.name)).toEqual(["Alpha", "Bravo", "Charlie"]);
    });

    it("safely handles circular references without infinite loops", () => {
      const cyclicItems: CategoryItem[] = [
        { _id: "c1", name: "C1", slug: "c1", isActive: true, parentCategory: "c2" },
        { _id: "c2", name: "C2", slug: "c2", isActive: true, parentCategory: "c1" },
      ];
      // Should not throw or crash
      expect(() => buildCategoryTree(cyclicItems)).not.toThrow();
    });
  });

  describe("getDescendantCategoryIds (Cycle Prevention)", () => {
    it("returns all direct and indirect descendants of a category", () => {
      const descendants = getDescendantCategoryIds(mockCategories, "cat-root-1");
      expect(descendants.has("cat-sub-1a")).toBe(true);
      expect(descendants.has("cat-sub-1b")).toBe(true);
      expect(descendants.has("cat-sub-sub-1")).toBe(true);
      expect(descendants.has("cat-root-2")).toBe(false);
    });

    it("returns empty set for leaf categories", () => {
      const descendants = getDescendantCategoryIds(mockCategories, "cat-sub-sub-1");
      expect(descendants.size).toBe(0);
    });

    it("detects and prevents circular parent selection", () => {
      const descendants = getDescendantCategoryIds(mockCategories, "cat-sub-1a");
      expect(descendants.has("cat-sub-sub-1")).toBe(true);
      // Thus, cat-sub-1a CANNOT choose cat-sub-sub-1 as its parent!
    });
  });

  describe("countDirectSubcategories & flattenCategoryTree", () => {
    it("counts only direct children", () => {
      expect(countDirectSubcategories("cat-root-1", mockCategories)).toBe(2);
      expect(countDirectSubcategories("cat-sub-1a", mockCategories)).toBe(1);
      expect(countDirectSubcategories("cat-root-2", mockCategories)).toBe(0);
    });

    it("flattens a hierarchical tree in preorder traversal with correct depth tags", () => {
      const tree = buildCategoryTree(mockCategories);
      const flat = flattenCategoryTree(tree);
      expect(flat).toHaveLength(5);
      expect(flat[0].node.name).toBe("Evening Dresses");
      expect(flat[0].depth).toBe(0);
      expect(flat[1].node.name).toBe("Satin Silhouettes");
      expect(flat[1].depth).toBe(1);
      expect(flat[2].node.name).toBe("Hand Embroidered Gowns");
      expect(flat[2].depth).toBe(2);
    });
  });

  describe("calculateCategoryStats", () => {
    it("computes overview metrics from real data", () => {
      const stats = calculateCategoryStats(mockCategories);
      expect(stats.totalCategories).toBe(5);
      expect(stats.parentCategories).toBe(2); // cat-root-1, cat-root-2
      expect(stats.subcategories).toBe(3); // cat-sub-1a, cat-sub-1b, cat-sub-sub-1
      expect(stats.activeCategories).toBe(4); // 4 active, 1 inactive

      // Dangling parent pointer category
      const withDangling: CategoryItem[] = [
        ...mockCategories,
        {
          _id: "cat-dangling",
          name: "Orphan Branch",
          slug: "orphan-branch",
          parentCategory: "non-existent-parent-id",
          isActive: true,
        },
      ];
      const statsWithDangling = calculateCategoryStats(withDangling);
      expect(statsWithDangling.parentCategories).toBe(3); // Counted as root because parent is missing
      expect(statsWithDangling.subcategories).toBe(3);
    });
  });

  describe("filterCategories", () => {
    it("filters by search string across name, slug, and description", () => {
      const byName = filterCategories(mockCategories, { search: "velvet" });
      expect(byName).toHaveLength(1);
      expect(byName[0].slug).toBe("velvet-gowns");

      const bySlug = filterCategories(mockCategories, { search: "embroidered" });
      expect(bySlug).toHaveLength(1);

      const byDesc = filterCategories(mockCategories, { search: "beadwork" });
      expect(byDesc).toHaveLength(1);
    });

    it("filters by active and inactive status", () => {
      const activeOnly = filterCategories(mockCategories, { status: "active" });
      expect(activeOnly).toHaveLength(4);

      const inactiveOnly = filterCategories(mockCategories, { status: "inactive" });
      expect(inactiveOnly).toHaveLength(1);
      expect(inactiveOnly[0]._id).toBe("cat-sub-sub-1");
    });

    it("filters by root vs subcategory type", () => {
      const roots = filterCategories(mockCategories, { type: "root" });
      expect(roots).toHaveLength(2);

      const subs = filterCategories(mockCategories, { type: "sub" });
      expect(subs).toHaveLength(3);
    });
  });
});

describe("Category Zod Schema Validation", () => {
  describe("categoryFormSchema", () => {
    it("validates valid category input with Arabic text", () => {
      const arabicCategory = {
        name: "فساتين سهرة حريرية",
        slug: "فساتين-سهرة-حريرية",
        description: "فساتين مصنوعة يدوياً من الحرير الطبيعي",
        isActive: true,
        sortOrder: 1,
      };

      const result = categoryFormSchema.safeParse(arabicCategory);
      expect(result.success).toBe(true);
    });

    it("returns localized error key for invalid sort order", () => {
      const invalid = {
        name: "Valid Name",
        isActive: true,
        sortOrder: 1.5, // float instead of integer
      };
      const result = categoryFormSchema.safeParse(invalid);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.flatten().fieldErrors.sortOrder).toContain("category-sort-order-integer-error");
      }
    });

    it("rejects category name shorter than 2 characters", () => {
      const invalid = {
        name: "A",
        isActive: true,
        sortOrder: 0,
      };
      const result = categoryFormSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it("rejects category name longer than 100 characters", () => {
      const invalid = {
        name: "A".repeat(101),
        isActive: true,
        sortOrder: 0,
      };
      const result = categoryFormSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it("rejects description longer than 500 characters", () => {
      const invalid = {
        name: "Valid Name",
        description: "X".repeat(501),
        isActive: true,
        sortOrder: 0,
      };
      const result = categoryFormSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it("rejects negative sortOrder", () => {
      const invalid = {
        name: "Valid Name",
        isActive: true,
        sortOrder: -1,
      };
      const result = categoryFormSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });

  describe("categoryImageSchema", () => {
    it("accepts valid URL or empty string", () => {
      expect(categoryImageSchema.safeParse({ url: "https://example.com/pic.jpg" }).success).toBe(true);
      expect(categoryImageSchema.safeParse({ url: "" }).success).toBe(true);
    });

    it("rejects invalid URL string", () => {
      expect(categoryImageSchema.safeParse({ url: "not-a-valid-url" }).success).toBe(false);
    });
  });
});

describe("Categories RBAC & Permissions", () => {
  const categoriesStaffPermissions = ["categories:read", "categories:write", "products:read"];

  it("maps categories permissions to backend Express permissions", () => {
    expect(PERMISSION_BACKEND_MAP[PERMISSIONS.CATEGORIES_VIEW]).toBe("categories:read");
    expect(PERMISSION_BACKEND_MAP[PERMISSIONS.CATEGORIES_CREATE]).toBe("categories:write");
    expect(PERMISSION_BACKEND_MAP[PERMISSIONS.CATEGORIES_UPDATE]).toBe("categories:write");
    expect(PERMISSION_BACKEND_MAP[PERMISSIONS.CATEGORIES_DELETE]).toBe("categories:write");
  });

  it("allows SUPER_ADMIN full access via wildcard", () => {
    expect(can("SUPER_ADMIN", PERMISSIONS.CATEGORIES_VIEW)).toBe(true);
    expect(can("SUPER_ADMIN", PERMISSIONS.CATEGORIES_CREATE)).toBe(true);
    expect(can("SUPER_ADMIN", PERMISSIONS.CATEGORIES_UPDATE)).toBe(true);
    expect(can("SUPER_ADMIN", PERMISSIONS.CATEGORIES_DELETE)).toBe(true);
  });

  it("allows ADMIN and INVENTORY_MANAGER with verified backend permissions", () => {
    expect(can("ADMIN", PERMISSIONS.CATEGORIES_VIEW, categoriesStaffPermissions)).toBe(true);
    expect(can("ADMIN", PERMISSIONS.CATEGORIES_CREATE, categoriesStaffPermissions)).toBe(true);
    expect(can("ADMIN", PERMISSIONS.CATEGORIES_UPDATE, categoriesStaffPermissions)).toBe(true);
    expect(can("ADMIN", PERMISSIONS.CATEGORIES_DELETE, categoriesStaffPermissions)).toBe(true);

    expect(can("INVENTORY_MANAGER", PERMISSIONS.CATEGORIES_VIEW, categoriesStaffPermissions)).toBe(true);
    expect(can("INVENTORY_MANAGER", PERMISSIONS.CATEGORIES_CREATE, categoriesStaffPermissions)).toBe(true);
  });

  it("denies CUSTOMER, ACCOUNTANT, and ORDER_MANAGER", () => {
    expect(can("CUSTOMER", PERMISSIONS.CATEGORIES_VIEW, categoriesStaffPermissions)).toBe(false);
    expect(can("CUSTOMER", PERMISSIONS.CATEGORIES_CREATE, categoriesStaffPermissions)).toBe(false);
    expect(can("ACCOUNTANT", PERMISSIONS.CATEGORIES_VIEW, categoriesStaffPermissions)).toBe(false);
    expect(can("ORDER_MANAGER", PERMISSIONS.CATEGORIES_CREATE, categoriesStaffPermissions)).toBe(false);
  });

  it("denies unauthenticated or invalid roles", () => {
    expect(can(null, PERMISSIONS.CATEGORIES_VIEW)).toBe(false);
    expect(can(undefined, PERMISSIONS.CATEGORIES_CREATE)).toBe(false);
    expect(can("UNKNOWN_ROLE", PERMISSIONS.CATEGORIES_DELETE)).toBe(false);
  });
});
