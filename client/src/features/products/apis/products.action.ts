"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { auth } from "@/auth";
import { serverApiPost, serverApiPatch, serverApiDelete } from "@/lib/auth/session";
import { BackendApiError } from "@/lib/auth/backend-client";
import { assertSessionPermission } from "@/lib/permissions/server-authorization";
import { PERMISSIONS } from "@/config/rbac.config";
import {
  createProductSchema,
  updateProductSchema,
  type CreateProductInput,
  type UpdateProductInput,
} from "../schemas/product.schema";
import type { SingleProductResponse } from "../types/product.types";

/**
 * Revalidate all product-related cache tags and routes
 */
function invalidateProductCaches(slug?: string, id?: string) {
  try {
    revalidateTag("products", "default");
    if (slug) {
      revalidateTag(`product-slug-${slug}`, "default");
    }
    if (id) {
      revalidateTag(`product-related-${id}`, "default");
    }
    revalidatePath("/[locale]/admin/products", "page");
    if (id) {
      revalidatePath(`/[locale]/admin/products/${id}`, "page");
      revalidatePath(`/[locale]/admin/products/${id}/edit`, "page");
    }
    revalidatePath("/[locale]/(platform)/@user/(website)/products", "page");
  } catch {
    // In dev / test environments revalidation context may not always be active
  }
}

/**
 * Server Action: Create Product with variants
 */
export async function createProductAction(
  payload: CreateProductInput
): Promise<SingleProductResponse> {
  // Authorization
  const session = await auth();
  const authorization = assertSessionPermission(
    session,
    PERMISSIONS.PRODUCTS_CREATE
  );

  if (!authorization.authorized) {
    throw new Error(authorization.error || "Unauthorized");
  }

  // Validation
  const parseResult = createProductSchema.safeParse(payload);
  if (!parseResult.success) {
    const errorDetails = Object.values(parseResult.error.flatten().fieldErrors)
      .flat()
      .join(", ");
    throw new Error(`Validation error: ${errorDetails}`);
  }

  const validatedData = parseResult.data;
  const sanitizedPayload = {
    ...validatedData,
    images: validatedData.images.map((img) => ({
      url: img.url,
      ...(img.publicId ? { publicId: img.publicId } : {}),
      ...(img.isPrimary !== undefined ? { isPrimary: img.isPrimary } : {}),
    })),
  };

  // Execution
  try {
    const response = await serverApiPost<SingleProductResponse>(
      "/products",
      sanitizedPayload
    );

    invalidateProductCaches(response?.data?.slug, response?.data?._id);
    return response;
  } catch (error) {
    if (error instanceof BackendApiError) {
      throw new Error(error.messageText || "Failed to create product in backend service");
    }
    if (error instanceof Error) throw error;
    throw new Error("Failed to create product");
  }
}

/**
 * Server Action: Update Product details
 */
export async function updateProductAction(
  id: string,
  payload: UpdateProductInput
): Promise<SingleProductResponse> {
  // Authorization
  const session = await auth();
  const authorization = assertSessionPermission(
    session,
    PERMISSIONS.PRODUCTS_UPDATE
  );

  if (!authorization.authorized) {
    throw new Error(authorization.error || "Unauthorized");
  }

  if (!id || !id.trim()) {
    throw new Error("Product ID is required");
  }

  // Validation
  const parseResult = updateProductSchema.safeParse(payload);
  if (!parseResult.success) {
    const errorDetails = Object.values(parseResult.error.flatten().fieldErrors)
      .flat()
      .join(", ");
    throw new Error(`Validation error: ${errorDetails}`);
  }

  const validatedData = parseResult.data;
  const cleanId = encodeURIComponent(id.trim());
  const sanitizedPayload = {
    ...validatedData,
    ...(validatedData.images
      ? {
          images: validatedData.images.map((img) => ({
            url: img.url,
            ...(img.publicId ? { publicId: img.publicId } : {}),
            ...(img.isPrimary !== undefined ? { isPrimary: img.isPrimary } : {}),
          })),
        }
      : {}),
  };

  // Execution
  try {
    const response = await serverApiPatch<SingleProductResponse>(
      `/products/${cleanId}` as `/${string}`,
      sanitizedPayload
    );

    invalidateProductCaches(response?.data?.slug, response?.data?._id);
    return response;
  } catch (error) {
    if (error instanceof BackendApiError) {
      throw new Error(error.messageText || "Failed to update product in backend service");
    }
    if (error instanceof Error) throw error;
    throw new Error("Failed to update product");
  }
}

/**
 * Server Action: Archive Product (DELETE /products/:id)
 */
export async function archiveProductAction(
  id: string
): Promise<{ success: boolean; message: string }> {
  // Authorization
  const session = await auth();
  const authorization = assertSessionPermission(
    session,
    PERMISSIONS.PRODUCTS_ARCHIVE
  );

  if (!authorization.authorized) {
    throw new Error(authorization.error || "Unauthorized");
  }

  if (!id || !id.trim()) {
    throw new Error("Product ID is required");
  }

  const cleanId = encodeURIComponent(id.trim());

  // Execution
  try {
    const response = await serverApiDelete<{ success: boolean; message?: string }>(
      `/products/${cleanId}` as `/${string}`
    );

    invalidateProductCaches(undefined, id);
    return {
      success: true,
      message: response.message || "Product archived successfully",
    };
  } catch (error) {
    if (error instanceof BackendApiError) {
      throw new Error(error.messageText || "Failed to archive product");
    }
    if (error instanceof Error) throw error;
    throw new Error("Failed to archive product");
  }
}
