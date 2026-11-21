"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { auth } from "@/auth";
import { serverApiPost, serverApiPatch, serverApiDelete } from "@/lib/auth/session";
import { BackendApiError } from "@/lib/auth/backend-client";
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

/**
 * Server Action: Create new promotional bundle
 */
export async function createBundleAction(
  payload: CreateBundleInput
): Promise<SingleBundleResponse> {
  const session = await auth();
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

  try {
    const response = await serverApiPost<SingleBundleResponse>(
      "/bundles",
      validatedData
    );

    invalidateBundleCaches(response?.data?._id);
    return response;
  } catch (error) {
    if (error instanceof BackendApiError) {
      throw new Error(error.messageText || "Failed to create bundle in backend service");
    }
    if (error instanceof Error) throw error;
    throw new Error("Failed to create bundle");
  }
}

/**
 * Server Action: Update existing promotional bundle
 */
export async function updateBundleAction(
  id: string,
  payload: UpdateBundleInput
): Promise<SingleBundleResponse> {
  const session = await auth();
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

  try {
    const response = await serverApiPatch<SingleBundleResponse>(
      `/bundles/${cleanId}` as `/${string}`,
      parseResult.data
    );

    invalidateBundleCaches(response?.data?._id || id);
    return response;
  } catch (error) {
    if (error instanceof BackendApiError) {
      throw new Error(error.messageText || "Failed to update bundle in backend service");
    }
    if (error instanceof Error) throw error;
    throw new Error("Failed to update bundle");
  }
}

/**
 * Server Action: Delete promotional bundle
 */
export async function deleteBundleAction(
  id: string
): Promise<{ success: boolean; message: string }> {
  const session = await auth();
  const authorization = assertSessionPermission(
    session,
    PERMISSIONS.BUNDLES_DELETE
  );

  if (!authorization.authorized) {
    throw new Error(authorization.error || "Unauthorized");
  }

  const cleanId = encodeURIComponent(id.trim());

  try {
    const response = await serverApiDelete<{ success: boolean; message: string }>(
      `/bundles/${cleanId}` as `/${string}`
    );

    invalidateBundleCaches(id);
    return {
      success: true,
      message: response?.message || "Bundle deleted successfully",
    };
  } catch (error) {
    if (error instanceof BackendApiError) {
      throw new Error(error.messageText || "Failed to delete bundle in backend service");
    }
    if (error instanceof Error) throw error;
    throw new Error("Failed to delete bundle");
  }
}

/**
 * Server Action: Toggle active status of a bundle
 */
export async function toggleBundleStatusAction(
  id: string,
  isActive: boolean
): Promise<SingleBundleResponse> {
  const session = await auth();
  const authorization = assertSessionPermission(
    session,
    PERMISSIONS.BUNDLES_UPDATE
  );

  if (!authorization.authorized) {
    throw new Error(authorization.error || "Unauthorized");
  }

  const cleanId = encodeURIComponent(id.trim());

  try {
    const response = await serverApiPatch<SingleBundleResponse>(
      `/bundles/${cleanId}` as `/${string}`,
      { isActive }
    );

    invalidateBundleCaches(id);
    return response;
  } catch (error) {
    if (error instanceof BackendApiError) {
      throw new Error(error.messageText || "Failed to toggle bundle status");
    }
    if (error instanceof Error) throw error;
    throw new Error("Failed to toggle bundle status");
  }
}
