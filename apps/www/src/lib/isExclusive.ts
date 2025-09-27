import { CATEGORIES } from '@server/constants';

// This function checks if any of the provided categories match the exclusive category.
// It returns true if at least one category matches, otherwise false.
// The type parameter T is used to ensure that the function can accept an array of any object
export function isExclusive<T extends { name: string }>(categories: T[]) {
  return categories.some((c) => c.name === CATEGORIES['diseniosExclusivos']);
}
