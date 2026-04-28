import mongoose, { Schema, Document } from 'mongoose';

export interface IReview extends Document {
  productId: mongoose.Types.ObjectId;
  userId?: string;
  buyerEmail: string;
  rating: number;      // 1–5
  textEn: string;      // English review text
  textAr?: string;     // Arabic review text (optional)
  isVerifiedBuyer: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ReviewSchema = new Schema<IReview>(
  {
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
    userId: { type: String },
    buyerEmail: { type: String, required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    textEn: { type: String, required: true, maxlength: 1000 },
    textAr: { type: String, maxlength: 1000 },
    isVerifiedBuyer: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// One review per buyer per product
ReviewSchema.index({ productId: 1, buyerEmail: 1 }, { unique: true });

export default mongoose.models.Review ||
  mongoose.model<IReview>('Review', ReviewSchema);
