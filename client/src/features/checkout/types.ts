export interface CheckoutAddress {
  fullName: string;
  phone: string;
  street: string;
  city: string;
  governorate: string;
}

export type PaymentMethod = "COD" | "STRIPE" | "PAYMOB";
