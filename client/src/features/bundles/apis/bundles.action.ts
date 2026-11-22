"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { getServerSession } from "@/auth";
import { API_URL, HEADERS } from "@/shared/constant/api.constant";
import { getNextAuthToken } from "@/shared/lib/utils/auth.utils";
import { assertSessionPermission } from "@/lib/permissions/server-authorization";
import { PERMISSIONS } from "@/config/rbac.config";
import {
  createBundleSchema,
  updateBundleSchema,
  type CreateBundleInput,
  type UpdateBundleInput,
} from "../schemas/bundle.schema";
import type { SingleBundleResponse } from "../types/bundle.types";

/**
 * Revalidate all bundle-related cache tags and admin paths
 */
function invalidateBundleCaches(bundleId?: string) {
  try {
    revalidateTag("bundles", "default");
    if (bundleId) {
      revalidateTag(`bundle-${bundleId}`, "default");
    }
    revalidatePath("/[locale]/admin/bundles", "page");
    if (bundleId) {
      revalidatePath(`/[locale]/admin/bundles/${bundleId}`, "page");
      revalidatePath(`/[locale]/admin/bundles/${bundleId}/edit`, "page");
    }
  } catch {
    // In dev / test environments revalidation context may not always be active
  }
}

function generateClientSlug(title: string): string {
  const clean = (title || "")
    .toLowerCase()
    .trim()
    .replace(/[\s_-]+/g, "-")
    .replace(/[^\p{L}\p{N}-]/gu, "")
    .replace(/^-+|-+$/g, "");
  return clean || `bundle-${Date.now()}`;
}

/**
 * Server Action: Create new promotional bundle
 */
export async function createBundleAction(
  payload: CreateBundleInput
): Promise<SingleBundleResponse> {
  const session = await getServerSession();
  const authorization = assertSessionPermission(
    session,
    PERMISSIONS.BUNDLES_CREATE
  );

  if (!authorization.authorized) {
    throw new Error(authorization.error || "Unauthorized");
  }

  const parseResult = createBundleSchema.safeParse(payload);
  if (!parseResult.success) {
    const errorDetails = Object.values(parseResult.error.flatten().fieldErrors)
      .flat()
      .join(", ");
    throw new Error(`Validation error: ${errorDetails}`);
  }

  const validatedData = parseResult.data;
  const token = await getNextAuthToken();

  const cleanProducts = (validatedData.eligibleProducts || []).filter(
    (id) => typeof id === "string" && id.trim().length === 24
  );
  const cleanCategories = (validatedData.eligibleCategories || []).filter(
    (id) => typeof id === "string" && id.trim().length === 24
  );

  const cleanPayload = {
    ...validatedData,
    slug: generateClientSlug(validatedData.title),
    eligibleProducts: cleanProducts,
    eligibleCategories: cleanCategories,
    bannerImage: validatedData.bannerImage?.trim() || "",
    description: validatedData.description?.trim() || "",
  };

  const res = await fetch(`${API_URL}/bundles`, {
    method: "POST",
    headers: {
      ...HEADERS.JsonBody,
      ...(token?.token ? HEADERS.authorize(token.token) : {}),
    },
    body: JSON.stringify(cleanPayload),
  });

  const response: any = await res.json().catch(() => null);
  if (!res.ok || !response?.success) {
    const errorDetails = Array.isArray(response?.errors)
      ? response.errors.map((e: any) => `${e.field || "field"}: ${e.message || "invalid"}`).join(" | ")
      : "";
    const errorMsg = errorDetails
      ? `${response?.message || "Validation failed"}: ${errorDetails}`
      : response?.message || `Failed to create bundle (${res.status})`;
    throw new Error(errorMsg);
  }

  invalidateBundleCaches(response?.data?._id);
  return response;
}

/**
 * Server Action: Update existing promotional bundle
 */
export async function updateBundleAction(
  id: string,
  payload: UpdateBundleInput
): Promise<SingleBundleResponse> {
  const session = await getServerSession();
  const authorization = assertSessionPermission(
    session,
    PERMISSIONS.BUNDLES_UPDATE
  );

  if (!authorization.authorized) {
    throw new Error(authorization.error || "Unauthorized");
  }

  const parseResult = updateBundleSchema.safeParse(payload);
  if (!parseResult.success) {
    const errorDetails = Object.values(parseResult.error.flatten().fieldErrors)
      .flat()
      .join(", ");
    throw new Error(`Validation error: ${errorDetails}`);
  }

  const cleanId = encodeURIComponent(id.trim());
  const token = await getNextAuthToken();

  const res = await fetch(`${API_URL}/bundles/${cleanId}`, {
    method: "PATCH",
    headers: {
      ...HEADERS.JsonBody,
      ...(token?.token ? HEADERS.authorize(token.token) : {}),
    },
    body: JSON.stringify(parseResult.data),
  });

  const response: any = await res.json().catch(() => null);
  if (!res.ok || !response?.success) {
    const errorDetails = Array.isArray(response?.errors)
      ? response.errors.map((e: any) => `${e.field || "field"}: ${e.message || "invalid"}`).join(" | ")
      : "";
    const errorMsg = errorDetails
      ? `${response?.message || "Validation failed"}: ${errorDetails}`
      : response?.message || `Failed to update bundle (${res.status})`;
    throw new Error(errorMsg);
  }

  invalidateBundleCaches(response?.data?._id || id);
  return response;
}

/**
 * Server Action: Delete promotional bundle
 */
export async function deleteBundleAction(
  id: string
): Promise<{ success: boolean; message: string }> {
  const session = await getServerSession();
  const authorization = assertSessionPermission(
    session,
    PERMISSIONS.BUNDLES_DELETE
  );

  if (!authorization.authorized) {
    throw new Error(authorization.error || "Unauthorized");
  }

  const cleanId = encodeURIComponent(id.trim());
  const token = await getNextAuthToken();

  const res = await fetch(`${API_URL}/bundles/${cleanId}`, {
    method: "DELETE",
    headers: {
      ...HEADERS.JsonBody,
      ...(token?.token ? HEADERS.authorize(token.token) : {}),
    },
  });

  const response = await res.json();
  if (!res.ok || !response?.success) {
    throw new Error(response?.message || "Failed to delete bundle");
  }

  invalidateBundleCaches(id);
  return {
    success: true,
    message: response?.message || "Bundle deleted successfully",
  };
}

/**
 * Server Action: Toggle active status of a bundle
 */
export async function toggleBundleStatusAction(
  id: string,
  isActive: boolean
): Promise<SingleBundleResponse> {
  const session = await getServerSession();
  const authorization = assertSessionPermission(
    session,
    PERMISSIONS.BUNDLES_UPDATE
  );

  if (!authorization.authorized) {
    throw new Error(authorization.error || "Unauthorized");
  }

  const cleanId = encodeURIComponent(id.trim());
  const token = await getNextAuthToken();

  const res = await fetch(`${API_URL}/bundles/${cleanId}`, {
    method: "PATCH",
    headers: {
      ...HEADERS.JsonBody,
      ...(token?.token ? HEADERS.authorize(token.token) : {}),
    },
    body: JSON.stringify({ isActive }),
  });

  const response: SingleBundleResponse = await res.json();
  if (!res.ok || !response?.success) {
    throw new Error((response as any)?.message || "Failed to toggle bundle status");
  }

  invalidateBundleCaches(id);
  return response;
}
