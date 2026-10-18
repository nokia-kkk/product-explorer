import type { CategoryListResponse } from '@miniapp/shared';

export async function fetchCategories(): Promise<CategoryListResponse> {
  const response = await fetch('/api/categories');
  if (!response.ok) {
    throw new Error(`Failed to load categories (${response.status})`);
  }
  return (await response.json()) as CategoryListResponse;
}
