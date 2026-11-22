import type {
  CategoryItem,
  CategoryTreeNode,
  CategoryOverviewStats,
  CategoryFilters,
} from "../types/category.types";

/**
 * Normalizes parentCategory field across unpopulated and populated backend representations.
 */
export function getParentCategoryId(category: CategoryItem): string | null {
  const parent = category.parentCategory;
  if (!parent) return null;
  if (typeof parent === "object" && "_id" in parent) {
    return String(parent._id);
  }
  if (typeof parent === "string" && parent.trim().length > 0) {
    return parent.trim();
  }
  return null;
}

/**
 * Returns parent category display name when populated, or resolves from categories list.
 */
export function getParentCategoryName(
  category: CategoryItem,
  allCategories?: CategoryItem[]
): string | null {
  const parent = category.parentCategory;
  if (!parent) return null;
  if (typeof parent === "object" && "name" in parent) {
    return parent.name;
  }
  if (allCategories && typeof parent === "string") {
    const found = allCategories.find((c) => c._id === parent);
    return found?.name || null;
  }
  return null;
}

/**
 * Returns a Set of all descendant category IDs (direct children, grandchildren, etc.)
 * for the target category. Used to prevent cyclic parent assignments.
 */
export function getDescendantCategoryIds(
  categories: CategoryItem[],
  targetId: string
): Set<string> {
  const descendants = new Set<string>();
  const queue = [targetId];

  // Adjacency map for fast parent -> children lookup
  const childrenMap = new Map<string, string[]>();
  for (const cat of categories) {
    const parentId = getParentCategoryId(cat);
    if (parentId) {
      const existing = childrenMap.get(parentId) || [];
      existing.push(cat._id);
      childrenMap.set(parentId, existing);
    }
  }

  while (queue.length > 0) {
    const currentId = queue.shift()!;
    const directChildren = childrenMap.get(currentId) || [];
    for (const childId of directChildren) {
      if (!descendants.has(childId)) {
        descendants.add(childId);
        queue.push(childId);
      }
    }
  }

  return descendants;
}

/**
 * Builds a hierarchical Category tree from a flat list of categories.
 * Root categories are those with parentCategory === null or an unresolved parent.
 * Children are sorted by sortOrder (asc) then name (asc).
 */
export function buildCategoryTree(categories: CategoryItem[]): CategoryTreeNode[] {
  const nodeMap = new Map<string, CategoryTreeNode>();

  // 1. Initialize all nodes
  for (const cat of categories) {
    nodeMap.set(cat._id, {
      ...cat,
      children: [],
      depth: 0,
      subcategoriesCount: 0,
    });
  }

  const rootNodes: CategoryTreeNode[] = [];

  // 2. Link children to their respective parents
  for (const cat of categories) {
    const node = nodeMap.get(cat._id)!;
    const parentId = getParentCategoryId(cat);

    if (parentId && nodeMap.has(parentId) && parentId !== cat._id) {
      const parentNode = nodeMap.get(parentId)!;
      parentNode.children.push(node);
    } else {
      rootNodes.push(node);
    }
  }

  // 3. Recursive helper to assign depth, sort children, and calculate total descendant counts
  function processNode(node: CategoryTreeNode, currentDepth: number): number {
    node.depth = currentDepth;
    node.children.sort((a, b) => {
      const orderA = a.sortOrder ?? 0;
      const orderB = b.sortOrder ?? 0;
      if (orderA !== orderB) return orderA - orderB;
      return a.name.localeCompare(b.name);
    });

    let totalSubcategories = node.children.length;
    for (const child of node.children) {
      totalSubcategories += processNode(child, currentDepth + 1);
    }

    node.subcategoriesCount = totalSubcategories;
    return totalSubcategories;
  }

  // 4. Sort and process root nodes
  rootNodes.sort((a, b) => {
    const orderA = a.sortOrder ?? 0;
    const orderB = b.sortOrder ?? 0;
    if (orderA !== orderB) return orderA - orderB;
    return a.name.localeCompare(b.name);
  });

  for (const root of rootNodes) {
    processNode(root, 0);
  }

  return rootNodes;
}

/**
 * Flattens a category tree into an ordered array with depth indicators,
 * ideal for hierarchically indented parent selectors.
 */
export function flattenCategoryTree(
  tree: CategoryTreeNode[]
): Array<{ node: CategoryTreeNode; depth: number }> {
  const result: Array<{ node: CategoryTreeNode; depth: number }> = [];

  function traverse(nodes: CategoryTreeNode[]) {
    for (const node of nodes) {
      result.push({ node, depth: node.depth });
      if (node.children.length > 0) {
        traverse(node.children);
      }
    }
  }

  traverse(tree);
  return result;
}

/**
 * Counts direct subcategories for a given category ID
 */
export function countDirectSubcategories(
  categoryId: string,
  categories: CategoryItem[]
): number {
  let count = 0;
  for (const cat of categories) {
    if (getParentCategoryId(cat) === categoryId) {
      count++;
    }
  }
  return count;
}

/**
 * Calculates high-level metrics for dashboard cards
 */
export function calculateCategoryStats(
  categories: CategoryItem[]
): CategoryOverviewStats {
  let parentCount = 0;
  let subCount = 0;
  let activeCount = 0;

  const categoryIdSet = new Set(categories.map((c) => c._id));

  for (const cat of categories) {
    const parentId = getParentCategoryId(cat);
    if (parentId === null || !categoryIdSet.has(parentId)) {
      parentCount++;
    } else {
      subCount++;
    }
    if (cat.isActive) {
      activeCount++;
    }
  }

  return {
    totalCategories: categories.length,
    parentCategories: parentCount,
    subcategories: subCount,
    activeCategories: activeCount,
  };
}

/**
 * Filters a flat category list by search query, status, and type (root vs subcategory).
 */
export function filterCategories(
  categories: CategoryItem[],
  filters: CategoryFilters
): CategoryItem[] {
  const search = filters.search?.trim().toLowerCase() || "";
  const status = filters.status || "all";
  const type = filters.type || "all";

  return categories.filter((cat) => {
    // 1. Search filter
    if (search) {
      const matchName = cat.name.toLowerCase().includes(search);
      const matchSlug = cat.slug.toLowerCase().includes(search);
      const matchDesc = (cat.description || "").toLowerCase().includes(search);
      if (!matchName && !matchSlug && !matchDesc) {
        return false;
      }
    }

    // 2. Status filter
    if (status === "active" && !cat.isActive) return false;
    if (status === "inactive" && cat.isActive) return false;

    // 3. Type filter
    const isRoot = getParentCategoryId(cat) === null;
    if (type === "root" && !isRoot) return false;
    if (type === "sub" && isRoot) return false;

    return true;
  });
}
