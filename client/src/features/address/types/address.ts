export interface Address {
  id: string;
  title: string;
  fullName: string;
  phone: string;
  governorate: string;
  city: string;
  street: string;
  building?: string;
  apartment?: string;
  landmark?: string;
  latitude: number;
  longitude: number;
  isDefault?: boolean;
}

export interface AddressStore {
  addresses: Address[];
  selectedAddressId: string | null;
  addAddress: (address: Omit<Address, "id">) => Address;
  updateAddress: (id: string, address: Partial<Address>) => void;
  removeAddress: (id: string) => void;
  selectAddress: (id: string) => void;
  getSelectedAddress: () => Address | null;
}
