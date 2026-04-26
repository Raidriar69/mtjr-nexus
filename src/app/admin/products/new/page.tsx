import { ProductForm } from '@/components/admin/ProductForm';

export default function NewProductPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Add New Product</h1>
        <p className="text-gray-500 text-sm mt-1">Create a new gaming account listing</p>
      </div>
      <ProductForm />
    </div>
  );
}
