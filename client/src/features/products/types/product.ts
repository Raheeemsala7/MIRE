export interface ProductColor {
  id: string;
  nameEn: string;
  nameAr: string;
  hex: string;
  image: string;
}

export interface ProductDetail {
  id: string;
  slug: string;
  categoryEn: string;
  categoryAr: string;
  titleEn: string;
  titleAr: string;
  price: number;
  descriptionEn: string;
  descriptionAr: string;
  colors: ProductColor[];
  sizes: string[];
}

