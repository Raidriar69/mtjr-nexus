import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/mongodb';
import Review from '@/models/Review';
import Order from '@/models/Order';

type Ctx = { params: { id: string } };

// GET — list reviews for a product
export async function GET(_req: NextRequest, { params }: Ctx) {
  try {
    await connectDB();
    const reviews = await Review.find({ productId: params.id })
      .sort({ createdAt: -1 })
      .lean();

    const avg =
      reviews.length > 0
        ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
        : 0;

    return NextResponse.json({ reviews, average: avg, count: reviews.length });
  } catch {
    return NextResponse.json({ error: 'Failed to load reviews' }, { status: 500 });
  }
}

// POST — submit a review (verified buyer only)
export async function POST(req: NextRequest, { params }: Ctx) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Sign in to leave a review' }, { status: 401 });
    }

    const { rating, textEn, textAr } = await req.json();

    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'Rating must be 1–5' }, { status: 400 });
    }
    if (!textEn?.trim()) {
      return NextResponse.json({ error: 'Review text is required' }, { status: 400 });
    }

    await connectDB();

    const buyerEmail = session.user.email;

    // Check if buyer actually purchased this product
    const hasPurchased = await Order.exists({
      $or: [
        { userId: (session.user as any).id, productId: params.id, status: 'completed' },
        { buyerEmail, productId: params.id, status: 'completed' },
      ],
    });

    const isVerifiedBuyer = Boolean(hasPurchased);

    // Upsert (one review per buyer per product)
    const review = await Review.findOneAndUpdate(
      { productId: params.id, buyerEmail },
      {
        userId: (session.user as any).id,
        rating,
        textEn: textEn.trim(),
        textAr: textAr?.trim() || undefined,
        isVerifiedBuyer,
      },
      { upsert: true, new: true }
    );

    return NextResponse.json({ review }, { status: 201 });
  } catch (err: any) {
    if (err.code === 11000) {
      return NextResponse.json({ error: 'You have already reviewed this product' }, { status: 409 });
    }
    return NextResponse.json({ error: err.message || 'Failed to submit review' }, { status: 500 });
  }
}
