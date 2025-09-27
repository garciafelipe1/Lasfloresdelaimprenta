import { Image, LucideProps, StarIcon, User } from 'lucide-react';
import { CollectionSlug, GlobalSlug } from 'payload';
import { ExoticComponent } from 'react';
import { CustomLinks } from './custom-links';

export const navIconMap: Partial<
  Record<
    CollectionSlug | GlobalSlug | CustomLinks,
    ExoticComponent<LucideProps>
  >
> = {
  media: Image,
  users: User,
  Miembros: StarIcon,
};

export const getNavIcon = (slug: string) =>
  Object.hasOwn(navIconMap, slug)
    ? navIconMap[slug as CollectionSlug | GlobalSlug]
    : undefined;
