import mongoose, { Schema, Document } from 'mongoose';

export type OrderStatus =
  | 'pending'
  | 'waiting_confirmation'
  | 'completed'
  | 'failed'
  | 'refunded'
  | 'rejected';

export interface IOrder extends Document {
  userId?: string;
  buyerEmail: string;
  productId: mongoose.Types.ObjectId;
  amount: number;
  currency: string;
  status: OrderStatus;
  paymentMethod?: 'stripe' | 'paypal' | 'crypto' | 'paypal_manual' | 'crypto_manual';
  quantity: number;
  stripePaymentIntentId?: string;
  stripeSessionId?: string;
  paypalOrderId?: string;
  cryptoPaymentId?: string;
  cryptoCurrency?: string;
  // ── Manual PayPal fields ────────────────────────────────────────────────────
  paypalInvoiceId?: string;          // e.g. "INV-A3B2C1D4"
  paypalVerificationCode?: string;   // e.g. "couch – tiger – lamp – rocket"
  paypalManual?: boolean;            // true = manual PayPal verification flow
  // ── Manual Crypto fields ────────────────────────────────────────────────────
  cryptoInvoiceId?: string;          // e.g. "INV-B7D3E1F8"
  cryptoManualAmount?: number;       // unique amount with noise, e.g. 0.000443642
  cryptoManualCoin?: string;         // BTC | ETH | SOL | LTC
  cryptoManualAddress?: string;      // destination wallet address
  cryptoManual?: boolean;            // true = manual crypto verification flow
  // ── Delivery ────────────────────────────────────────────────────────────────
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
      enum: ['pending', 'waiting_confirmation', 'completed', 'failed', 'refunded', 'rejected'],
      default: 'pending',
    },
    paymentMethod: {
      type: String,
      enum: ['stripe', 'paypal', 'crypto', 'paypal_manual', 'crypto_manual'],
      default: 'stripe',
    },
    quantity: { type: Number, default: 1 },
    stripePaymentIntentId: { type: String },
    stripeSessionId: { type: String },
    paypalOrderId: { type: String },
    cryptoPaymentId: { type: String },
    cryptoCurrency: { type: String },
    paypalInvoiceId: { type: String },
    paypalVerificationCode: { type: String },
    paypalManual: { type: Boolean, default: false },
    cryptoInvoiceId: { type: String },
    cryptoManualAmount: { type: Number },
    cryptoManualCoin: { type: String },
    cryptoManualAddress: { type: String },
    cryptoManual: { type: Boolean, default: false },
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
