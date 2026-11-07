//product/[id]/page.tsx
import ProductDetails from '@/components/product/product-detail'
import React from 'react'

interface ProductDetailPageProps {
  params: Promise<{ id: string }>
}

async function ProductDetailPage({ params }: ProductDetailPageProps) {
  // Await the params promise to get the id
  const { id } = await params

  return <ProductDetails id={id} />

}

export default ProductDetailPage