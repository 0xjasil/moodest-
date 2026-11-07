// types/user.ts

import { User, Order, OrderItem, Product } from '@prisma/client';

export type Role = {
  id: string;
  name: string;
  value: string;
  description?: string;
};

// Existing User and UserFormData types are fine as is.
export type UserFormData = {
  id?: string;
  name: string;
  email: string;
  phone: string;
  password: string;
  role?: string;
};

export type UserFormProps = {
  roles: Role[];
  onSuccess?: () => void;
  initialData?: Partial<UserFormData>;
  isEdit?: boolean;
};

// Existing User and UsersTableProps can be re-used.
export type UsersTableProps = {
  users: User[];
  roles: Role[];
};

// Existing UserProfile interface.
export interface UserProfile {
  id: string;
  name: string;
  email: string;
  image?: string | null;
  role?: string | null;
}

// This matches the data structure from your server action.
export type UserWithOrders = User & {
  orders: (Order & {
    items: (OrderItem & {
      product: Product;
    })[];
  })[];
};

export interface FetchUserDetailsResponse {
  success?: boolean;
  message?: string;
  error?: string;
  user?: UserWithOrders;
}