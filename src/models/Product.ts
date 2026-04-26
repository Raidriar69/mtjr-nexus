import mongoose, { Schema, Document } from 'mongoose';

export interface IProduct extends Document {
  game: string;
  title: string;
  description: string;
  rank: string;
  level: number;
  skins: string[];
  items: string[];
  price: number;
  originalPrice: number;
  images: string[];
  category: string;
  platform: string;
  deliveryMethod: 'email_password' | 'account_transfer';
  accountEmail: string;
  accountPassword: string;
  accountInstructions: string;
  isSold: boolean;
  isFeatured: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ProductSchema = new Schema<IProduct>(
  {
    game: { type: String, required: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    rank: { type: String, default: '' },
    level: { type: Number, default: 0 },
    skins: [{ type: String }],
    items: [{ type: String }],
    price: { type: Number, required: true },
    originalPrice: { type: Number },
    images: [{ type: String }],
    category: { type: String, required: true },
    platform: { type: String, default: 'PC' },
    deliveryMethod: {
      type: String,
      enum: ['email_password', 'account_transfer'],
      default: 'email_password',
    },
    accountEmail: { type: String, select: false },
    accountPassword: { type: String, select: false },
    accountInstructions: { type: String, default: '' },
    isSold: { type: Boolean, default: false },
    isFeatured: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.models.Product ||
  mongoose.model<IProduct>('Product', ProductSchema);
