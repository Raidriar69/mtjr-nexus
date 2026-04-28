import { connectDB } from '@/lib/mongodb';
import Product from '@/models/Product';
import { HeroSection } from '@/components/home/HeroSection';
import { TestimonialsSection } from '@/components/home/TestimonialsSection';
import { CategorySection } from '@/components/home/CategorySection';
import { TrustSection } from '@/components/home/TrustSection';
import { HomeContent } from '@/components/home/HomeContent';

async function getFeaturedProducts() {
  try {
    await connectDB();
    const products = await Product.find({ isSold: false, isFeatured: true })
      .sort({ createdAt: -1 })
      .limit(8)
      .lean();
    return JSON.parse(JSON.stringify(products));
  } catch {
    return [];
  }
}

async function getLatestProducts() {
  try {
    await connectDB();
    const products = await Product.find({ isSold: false })
      .sort({ createdAt: -1 })
      .limit(8)
      .lean();
    return JSON.parse(JSON.stringify(products));
  } catch {
    return [];
  }
}

export default async function HomePage() {
  const [featured, latest] = await Promise.all([getFeaturedProducts(), getLatestProducts()]);

  return (
    <>
      {/* 1. Hero + stats */}
      <HeroSection />

      {/* 2. Social proof carousel — immediately after hero */}
      <TestimonialsSection />

      {/* 3. Shop by Game */}
      <CategorySection />

      {/* 4. Featured + Latest product grids + CTA */}
      <HomeContent featured={featured} latest={latest} />

      {/* 5. Trust signals */}
      <TrustSection />
    </>
  );
}
