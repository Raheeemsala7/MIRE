export interface WishlistProduct {
  id: string;
  slug: string;
  titleEn: string;
  titleAr: string;
  price: number;
  image: string;
  category?: string;
  color?: string;
}

export interface WishlistStore {
  items: WishlistProduct[];
  toggleItem: (product: WishlistProduct) => void;
  removeItem: (productId: string) => void;
  clearWishlist: () => void;
  isWishlisted: (productId: string) => boolean;
  getCount: () => number;
}
