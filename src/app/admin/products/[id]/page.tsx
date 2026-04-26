import { connectDB } from '@/lib/mongodb';
import Product from '@/models/Product';
import { ProductForm } from '@/components/admin/ProductForm';
import { notFound } from 'next/navigation';

async function getProduct(id: string) {
  try {
    await connectDB();
    const product = await Product.findById(id).select('+accountEmail +accountPassword +accountInstructions').lean();
    if (!product) return null;
    return JSON.parse(JSON.stringify(product));
  } catch {
    return null;
  }
}

export default async function EditProductPage({ params }: { params: { id: string } }) {
  const product = await getProduct(params.id);
  if (!product) notFound();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Edit Product</h1>
        <p className="text-gray-500 text-sm mt-1 truncate max-w-md">{product.title}</p>
      </div>
      <ProductForm initialData={product} productId={params.id} />
    </div>
  );
}
