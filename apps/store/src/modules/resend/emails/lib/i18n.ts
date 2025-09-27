import { createIntl } from "@formatjs/intl";
import { i18nKeys, messages } from "../messages";

export function geti18n(locale: "en" | "es") {
  const intl = createIntl({
    locale,
    messages: messages[locale],
  });

  // return a function t(key, values?)
  return (key: i18nKeys, values?: Record<string, any>) =>
    intl.formatMessage({ id: key }, values);
}
