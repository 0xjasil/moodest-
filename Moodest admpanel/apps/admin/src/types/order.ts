
export interface ProductAttributes {
  key: string;
  value: string;
}

export interface OrderItem {
    id: string;
    quantity: number;
    price: number;
    createdAt: Date;
    updatedAt: Date;
    variant: {
      id: string;
      sku: string;
      price: number;
      qty: number;
      product: {
        id: string;
        name: string;
        description: string | null;
        image: string;
        createdAt: Date;
        updatedAt: Date;
        brand: {
          id: string;
          name: string;
        } | null;
        category: {
          id: string;
          name: string;
        } | null;
        subCategory: {
          id: string;
          name: string;
        } | null;
      };
      options: Array<{
        attribute: { name: string };
        attributeValue: { value: string };
      }>;
    };
}

export interface OrderDetailed {
  id: string;
  userId: string;
  totalAmount: number;
  status: string
  paymentMethod: string;
  razorpayOrderId: string | null;
  razorpayPaymentId: string | null;
  razorpaySignature: string | null;
  createdAt: Date;
  updatedAt: Date;

  // Address snapshot
  phoneNumber: string;
  street: string;
  city: string;
  state: string;
  pincode: string;

  user: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
  };

  items: OrderItem[];
}


// eg attribute

// {
//   "color": "Red",
//   "size": "M",
//   etc
// }
