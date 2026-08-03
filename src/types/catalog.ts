export interface BranchTaxConfig {
  vat?: number;
  sscl?: number;
  serviceCharge?: number;
  [key: string]: unknown;
}

export interface Branch {
  id: string;
  tenantId: string;
  name: string;
  code: string;
  address: string | null;
  phone: string | null;
  taxConfig: BranchTaxConfig;
  isActive: boolean;
  _count?: { tables: number; users: number };
}

export interface Category {
  id: string;
  tenantId: string;
  name: string;
  description: string | null;
  isActive: boolean;
  _count?: { products: number };
}

export interface ProductVariant {
  id: string;
  name: string;
  additionalPrice: string | number;
  isActive: boolean;
}

export interface ProductAddOn {
  id: string;
  name: string;
  price: string | number;
  isActive: boolean;
}

export interface Product {
  id: string;
  tenantId: string;
  categoryId: string;
  name: string;
  description: string | null;
  price: string | number;
  imageUrl: string | null;
  isActive: boolean;
  category?: { id: string; name: string };
  variants?: ProductVariant[];
  addOns?: ProductAddOn[];
}
