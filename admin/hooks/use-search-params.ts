

// src/hooks/use-search-params.ts
import { useCallback } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

export function useQueryParams<T>() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  // Get all query params
  const getAll = useCallback(() => {
    const params: Record<string, string> = {};
    searchParams.forEach((value, key) => {
      params[key] = value;
    });
    return params as T;
  }, [searchParams]);
  
  // Set query params
  const set = useCallback((params: Record<string, string | number | null | undefined>) => {
    const newSearchParams = new URLSearchParams(searchParams.toString());
    
    Object.entries(params).forEach(([key, value]) => {
      if (value === null || value === undefined) {
        newSearchParams.delete(key);
      } else {
        newSearchParams.set(key, String(value));
      }
    });
    
    const search = newSearchParams.toString();
    const query = search ? `?${search}` : '';
    
    router.push(`${pathname}${query}`);
  }, [pathname, router, searchParams]);
  
  return { getAll, set };
}