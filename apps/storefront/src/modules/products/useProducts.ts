import { ref } from "vue";

export interface Product {
  product_id: number;
  name: string;
  price: number;
  priceCents?: number;
  image: string;
  category: string;
  description: string;
  rating: number;
  reviewCount: number;
}

const products = ref<Product[]>([]);
const loading = ref(false);
const error = ref<string | null>(null);

async function loadProducts() {
  loading.value = true;
  error.value = null;
  try {
    const res = await fetch(
      "https://kolzsticks.github.io/Free-Ecommerce-Products-Api/main/products.json",
    );
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    console.log(data, "res");
    products.value = (data as Record<string, unknown>[]).map((p) => ({
      product_id: Number((p.id ?? p.product_id) as number),
      name: p.name as string,
      price: +((((p.priceCents ?? p.price) as number)) / 100).toFixed(2),
      image: p.image as string,
      category: p.category as string,
      description: p.description as string,
      rating: (p.rating as { stars?: number } | undefined)?.stars ?? 0,
      reviewCount: (p.rating as { count?: number } | undefined)?.count ?? 0,
    }));
  } catch (e) {
    error.value = e instanceof Error ? e.message : "Failed to load products";
    products.value = [];
  } finally {
    loading.value = false;
  }
}

export function useProducts() {
  return { products, loading, error, loadProducts };
}
