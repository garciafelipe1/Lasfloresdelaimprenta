export type EmailBanner = {
  title: string;
  body: string;
  url: string;
};

export type PropsBase = {
  email_banner?: EmailBanner;
  locale?: "es" | "en";
};
