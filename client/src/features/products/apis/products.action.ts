"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { getServerSession } from "@/auth";
import { API_URL, HEADERS } from "@/shared/constant/api.constant";
import { getNextAuthToken } from "@/shared/lib/utils/auth.utils";
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
  const session = await getServerSession();
  const authorization = assertSessionPermission(
    session,
    PERMISSIONS.PRODUCTS_CREATE
  );

  if (!authorization.authorized) {
    throw new Error(authorization.error || "Unauthorized");
  }

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

  const token = await getNextAuthToken();
  const res = await fetch(`${API_URL}/products`, {
    method: "POST",
    headers: {
      ...HEADERS.JsonBody,
      ...(token?.token ? HEADERS.authorize(token.token) : {}),
    },
    body: JSON.stringify(sanitizedPayload),
  });

  const response: SingleProductResponse = await res.json();
  if (!res.ok || !response?.success) {
    throw new Error((response as any)?.message || "Failed to create product");
  }

  invalidateProductCaches(response?.data?.slug, response?.data?._id);
  return response;
}

/**
 * Server Action: Update Product details
 */
export async function updateProductAction(
  id: string,
  payload: UpdateProductInput
): Promise<SingleProductResponse> {
  const session = await getServerSession();
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

  const token = await getNextAuthToken();
  const res = await fetch(`${API_URL}/products/${cleanId}`, {
    method: "PATCH",
    headers: {
      ...HEADERS.JsonBody,
      ...(token?.token ? HEADERS.authorize(token.token) : {}),
    },
    body: JSON.stringify(sanitizedPayload),
  });

  const response: SingleProductResponse = await res.json();
  if (!res.ok || !response?.success) {
    throw new Error((response as any)?.message || "Failed to update product");
  }

  invalidateProductCaches(response?.data?.slug, response?.data?._id);
  return response;
}

/**
 * Server Action: Archive Product (DELETE /products/:id)
 */
export async function archiveProductAction(
  id: string
): Promise<{ success: boolean; message: string }> {
  const session = await getServerSession();
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
  const token = await getNextAuthToken();

  const res = await fetch(`${API_URL}/products/${cleanId}`, {
    method: "DELETE",
    headers: {
      ...HEADERS.JsonBody,
      ...(token?.token ? HEADERS.authorize(token.token) : {}),
    },
  });

  const response = await res.json();
  if (!res.ok || !response?.success) {
    throw new Error(response?.message || "Failed to archive product");
  }

  invalidateProductCaches(undefined, id);
  return {
    success: true,
    message: response.message || "Product archived successfully",
  };
}
