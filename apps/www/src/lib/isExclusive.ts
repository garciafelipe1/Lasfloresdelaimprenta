// Categoría "Diseños exclusivos" eliminada: siempre false.
export function isExclusive<T extends { name: string }>(_categories: T[]) {
  return false;
}
