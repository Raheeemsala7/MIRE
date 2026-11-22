// Types
export * from "./types/product.types";
export * from "./types/product";

// Schemas
export * from "./schemas/product.schema";

// Utils
export * from "./utils/product.util";

// Hooks
export * from "./hooks/use-products";
export * from "./hooks/use-product";
export * from "./hooks/use-create-product";
export * from "./hooks/use-update-product";
export * from "./hooks/use-archive-product";

// Services & Queries
export * from "./services/products.service";

// Components - Admin
export { ProductsDashboard } from "./components/admin/products-dashboard";
export { ProductsTable } from "./components/admin/products-table";
export { ProductsOverview } from "./components/admin/products-overview";
export { ProductForm } from "./components/admin/product-form";
export { ProductDetails } from "./components/admin/product-details";
export { ArchiveProductDialog } from "./components/admin/archive-product-dialog";
export { ProductsSkeleton } from "./components/admin/products-skeleton";

// Components - Storefront
export { ProductCard } from "./components/product-card";
export { ProductView } from "./components/product-view";
export { ProductsCatalog } from "./components/products-catalog";
export { RelatedProducts } from "./components/related-products";
export { ProductAccordion } from "./components/product-accordion";
