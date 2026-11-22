"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { getServerSession } from "@/auth";
import { API_URL, HEADERS } from "@/shared/constant/api.constant";
import { getNextAuthToken } from "@/shared/lib/utils/auth.utils";
import { assertSessionPermission } from "@/lib/permissions/server-authorization";
import { PERMISSIONS } from "@/config/rbac.config";
import {
  categoryFormSchema,
  type CategoryFormValues,
} from "../schemas/category.schema";
import type {
  CategoryActionResponse,
  CategoryItem,
} from "../types/category.types";
import { getAdminCategories } from "./categories.api";
import { getDescendantCategoryIds } from "../utils/category.util";

/**
 * Helper to generate a clean URL slug supporting Unicode / Arabic characters
 */
function generateClientSlug(name: string): string {
  const clean = (name || "")
    .toLowerCase()
    .trim()
    .replace(/[\s_-]+/g, "-")
    .replace(/[^\p{L}\p{N}-]/gu, "")
    .replace(/^-+|-+$/g, "");
  return clean || `category-${Date.now()}`;
}

/**
 * Revalidates all storefront, products, and admin category caches after mutations.
 */
function invalidateCategoryCaches(categoryId?: string, slug?: string, oldSlug?: string) {
  try {
    revalidateTag("categories", "default");
    revalidateTag("categories-admin", "default");
    revalidateTag("products", "default");
    if (categoryId) {
      revalidateTag(`category-${categoryId}`, "default");
    }
    if (slug) {
      revalidateTag(`category-slug-${slug}`, "default");
    }
    if (oldSlug && oldSlug !== slug) {
      revalidateTag(`category-slug-${oldSlug}`, "default");
    }
    revalidatePath("/[locale]/admin/categories", "page");
    revalidatePath("/[locale]/admin/categories/new", "page");
    if (categoryId) {
      revalidatePath(`/[locale]/admin/categories/${categoryId}/edit`, "page");
    }
    revalidatePath("/[locale]/admin/products", "page");
    revalidatePath("/[locale]/admin/products/new", "page");
    revalidatePath("/[locale]/products", "page");
    revalidatePath("/[locale]", "page");
  } catch {
    // Revalidation context in local test environments
  }
}

/**
 * Server Action: Create new Category or Subcategory
 */
export async function createCategoryAction(
  values: CategoryFormValues
): Promise<CategoryActionResponse<CategoryItem>> {
  const session = await getServerSession();
  const auth = assertSessionPermission(session, PERMISSIONS.CATEGORIES_CREATE);
  if (!auth.authorized) {
    return { success: false, error: auth.error || "Unauthorized" };
  }

  const parseResult = categoryFormSchema.safeParse(values);
  if (!parseResult.success) {
    const errorDetails = Object.values(parseResult.error.flatten().fieldErrors)
      .flat()
      .join(", ");
    return { success: false, error: errorDetails || "Invalid form data" };
  }

  const token = await getNextAuthToken();
  if (!token?.token) {
    return { success: false, error: "Authentication token missing or expired" };
  }

  const data = parseResult.data;
  const parentCategory =
    data.parentCategory && data.parentCategory !== "none"
      ? data.parentCategory
      : null;

  const payload: Record<string, unknown> = {
    name: data.name,
    slug: generateClientSlug(data.slug || data.name),
    description: data.description || "",
    parentCategory,
    isActive: data.isActive,
    sortOrder: data.sortOrder,
  };

  if (data.image?.url && data.image.url.trim().length > 0) {
    payload.image = {
      url: data.image.url.trim(),
      publicId: data.image.publicId || "",
    };
  }

  try {
    const res = await fetch(`${API_URL}/categories`, {
      method: "POST",
      headers: {
        ...HEADERS.JsonBody,
        ...HEADERS.authorize(token.token),
      },
      body: JSON.stringify(payload),
    });

    const resJson = await res.json().catch(() => null);

    if (!res.ok) {
      const message =
        resJson?.message ||
        resJson?.error ||
        `Failed to create category (${res.status})`;
      return { success: false, error: message };
    }

    const created: CategoryItem = resJson.data;
    invalidateCategoryCaches(created?._id, created?.slug);
    return { success: true, data: created };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to communicate with category server",
    };
  }
}

/**
 * Server Action: Update existing Category
 */
export async function updateCategoryAction(
  id: string,
  values: CategoryFormValues
): Promise<CategoryActionResponse<CategoryItem>> {
  const session = await getServerSession();
  const auth = assertSessionPermission(session, PERMISSIONS.CATEGORIES_UPDATE);
  if (!auth.authorized) {
    return { success: false, error: auth.error || "Unauthorized" };
  }

  const parseResult = categoryFormSchema.safeParse(values);
  if (!parseResult.success) {
    const errorDetails = Object.values(parseResult.error.flatten().fieldErrors)
      .flat()
      .join(", ");
    return { success: false, error: errorDetails || "Invalid form data" };
  }

  const token = await getNextAuthToken();
  if (!token?.token) {
    return { success: false, error: "Authentication token missing or expired" };
  }

  const data = parseResult.data;
  const parentCategory =
    data.parentCategory && data.parentCategory !== "none"
      ? data.parentCategory
      : null;

  // Hierarchy cycle check: cannot set self or descendant as parent
  if (parentCategory) {
    if (parentCategory === id) {
      return {
        success: false,
        error: "A category cannot be its own parent",
      };
    }
    const allCategories = await getAdminCategories();
    const descendants = getDescendantCategoryIds(allCategories, id);
    if (descendants.has(parentCategory)) {
      return {
        success: false,
        error: "Cannot set a descendant subcategory as the parent",
      };
    }
  }

  const payload: Record<string, unknown> = {
    name: data.name,
    slug: generateClientSlug(data.slug || data.name),
    description: data.description ?? "",
    parentCategory,
    isActive: data.isActive,
    sortOrder: data.sortOrder,
  };

  if (data.image?.url && data.image.url.trim().length > 0) {
    payload.image = {
      url: data.image.url.trim(),
      publicId: data.image.publicId || "",
    };
  } else if (data.image && !data.image.url) {
    payload.image = { url: "", publicId: "" };
  }

  try {
    const res = await fetch(`${API_URL}/categories/${encodeURIComponent(id)}`, {
      method: "PATCH",
      headers: {
        ...HEADERS.JsonBody,
        ...HEADERS.authorize(token.token),
      },
      body: JSON.stringify(payload),
    });

    const resJson = await res.json().catch(() => null);

    if (!res.ok) {
      const message =
        resJson?.message ||
        resJson?.error ||
        `Failed to update category (${res.status})`;
      return { success: false, error: message };
    }

    const updated: CategoryItem = resJson.data;
    const oldSlug = data.slug && data.slug !== updated?.slug ? data.slug : undefined;
    invalidateCategoryCaches(id, updated?.slug, oldSlug);
    return { success: true, data: updated };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to communicate with category server",
    };
  }
}

/**
 * Server Action: Delete category (blocked if active subcategories or assigned products exist)
 */
export async function deleteCategoryAction(
  id: string,
  slug?: string
): Promise<CategoryActionResponse<void>> {
  const session = await getServerSession();
  const auth = assertSessionPermission(session, PERMISSIONS.CATEGORIES_DELETE);
  if (!auth.authorized) {
    return { success: false, error: auth.error || "Unauthorized" };
  }

  const token = await getNextAuthToken();
  if (!token?.token) {
    return { success: false, error: "Authentication token missing or expired" };
  }

  try {
    const res = await fetch(`${API_URL}/categories/${encodeURIComponent(id)}`, {
      method: "DELETE",
      headers: {
        ...HEADERS.JsonBody,
        ...HEADERS.authorize(token.token),
      },
    });

    const resJson = await res.json().catch(() => null);

    if (!res.ok) {
      const message =
        resJson?.message ||
        resJson?.error ||
        `Failed to delete category (${res.status})`;
      return { success: false, error: message };
    }

    invalidateCategoryCaches(id, slug);
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to communicate with category server",
    };
  }
}
