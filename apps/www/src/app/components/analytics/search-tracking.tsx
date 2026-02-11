'use client';

import { useEffect, useRef } from 'react';

/**
 * Dispara el evento Search de Facebook Pixel cuando el usuario llegó al catálogo con una búsqueda.
 */
export function SearchTracking({ searchQuery }: { searchQuery: string | undefined }) {
  const fired = useRef(false);

  useEffect(() => {
    if (!searchQuery?.trim() || fired.current) return;
    fired.current = true;

    if (typeof window !== 'undefined' && (window as any).fbq) {
      (window as any).fbq('track', 'Search', {
        search_string: searchQuery.trim(),
        content_category: 'catalog',
      });
    }
  }, [searchQuery]);

  return null;
}
