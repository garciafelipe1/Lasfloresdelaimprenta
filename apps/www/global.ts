import { routing } from '@/i18n/routing';

// Messages
import auth from './messages/en/auth.json';
import cart from './messages/en/cart.json';
import categoriesproducts from './messages/en/categories-products.json';
import dashboard from './messages/en/dashboard.json';
import landing from './messages/en/landing.json';
import membership from './messages/en/membership.json';
import navbar from './messages/en/navbar.json';
import services from './messages/en/services.json';

export type Messages = typeof landing &
  typeof auth &
  typeof services &
  typeof membership &
  typeof dashboard &
  typeof navbar &
  typeof cart &
  typeof categoriesproducts;

declare module 'next-intl' {
  interface AppConfig {
    Locale: (typeof routing.locales)[number];
    Messages: Messages;
  }
}
