export interface Product {
  _id: string;
  game: string;
  title: string;
  description: string;
  rank?: string;
  level?: number;
  skins?: string[];
  items?: string[];
  price: number;
  originalPrice?: number;
  images: string[];
  category: string;
  platform?: string;
  productType: 'single' | 'shared' | 'bulk';
  deliveryMethod: 'email_password' | 'account_transfer';
  accountEmail?: string;
  accountPassword?: string;
  accountInstructions?: string;
  availableStock?: number;  // computed: unsold accounts count for bulk
  isSold: boolean;
  isFeatured: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Order {
  _id: string;
  userId?: string;
  buyerEmail: string;
  productId: string;
  product?: Product;
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  paymentMethod?: 'stripe' | 'paypal' | 'crypto';
  stripePaymentIntentId?: string;
  stripeSessionId?: string;
  paypalOrderId?: string;
  cryptoPaymentId?: string;
  cryptoCurrency?: string;
  deliveryDetails?: {
    email?: string;
    password?: string;
    instructions?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface User {
  _id: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
  createdAt: string;
}

export type GameCategory =
  | 'fortnite'
  | 'valorant'
  | 'csgo'
  | 'apex'
  | 'cod'
  | 'steam'
  | 'other';

export const GAME_CATEGORIES: { value: GameCategory; label: string }[] = [
  { value: 'fortnite', label: 'Fortnite' },
  { value: 'valorant', label: 'Valorant' },
  { value: 'csgo', label: 'CS2' },
  { value: 'apex', label: 'Apex Legends' },
  { value: 'cod', label: 'Call of Duty' },
  { value: 'steam', label: 'Steam' },
  { value: 'other', label: 'Other' },
];
