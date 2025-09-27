// src/locales/index.ts
import en from "./en";
import es from "./es";

export type i18nKeys = keyof typeof en;

export const messages: Record<string, Record<string, string>> = {
  en,
  es,
};
