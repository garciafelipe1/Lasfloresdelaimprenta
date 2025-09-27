import { parseAsBoolean, useQueryState } from 'nuqs';

// Este hook sirve para abrir el carrito cuando se añade un nuevo item
// Se usa en shopping-cart.tsx y /products/[page] interactive-section.tsx
export function useCartQueryParam() {
  const [openCart, setOpenCartRaw] = useQueryState(
    'open-cart',
    parseAsBoolean.withOptions({
      clearOnDefault: true,
    }),
  );

  const setOpenCart = (value: boolean) => {
    setOpenCartRaw(value);
  };

  const clearCartParam = () => {
    setOpenCartRaw(null);
  };

  return { openCart, setOpenCart, clearCartParam };
}
