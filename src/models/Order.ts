import mongoose, { Schema, Document } from 'mongoose';

export interface IOrder extends Document {
  userId?: string;
  buyerEmail: string;
  productId: mongoose.Types.ObjectId;
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  paymentMethod?: 'stripe' | 'paypal' | 'crypto';
  quantity: number;
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
  deliveredAccounts?: { email: string; password: string }[];
  createdAt: Date;
  updatedAt: Date;
}

const OrderSchema = new Schema<IOrder>(
  {
    userId: { type: String },
    buyerEmail: { type: String, required: true },
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    amount: { type: Number, required: true },
    currency: { type: String, default: 'usd' },
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'refunded'],
      default: 'pending',
    },
    paymentMethod: {
      type: String,
      enum: ['stripe', 'paypal', 'crypto'],
      default: 'stripe',
    },
    quantity: { type: Number, default: 1 },
    stripePaymentIntentId: { type: String },
    stripeSessionId: { type: String },
    paypalOrderId: { type: String },
    cryptoPaymentId: { type: String },
    cryptoCurrency: { type: String },
    deliveryDetails: {
      email: { type: String },
      password: { type: String },
      instructions: { type: String },
    },
    deliveredAccounts: [{
      email: { type: String },
      password: { type: String },
    }],
  },
  { timestamps: true }
);

export default mongoose.models.Order ||
  mongoose.model<IOrder>('Order', OrderSchema);
