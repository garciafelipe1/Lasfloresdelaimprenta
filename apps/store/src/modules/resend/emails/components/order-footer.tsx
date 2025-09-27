import { Section, Text } from "@react-email/components";
import { geti18n } from "../lib/i18n";

interface Props {
  orderId: string;
  locale?: "es" | "en";
}

export function OrderFooter({ orderId, locale = "es" }: Props) {
  const t = geti18n(locale);

  return (
    <Section className="bg-gray-50 p-6 mt-10">
      <Text className="text-center text-gray-500 text-sm">
        {t("orderFooter.question")}
      </Text>
      <Text className="text-center text-gray-500 text-sm">
        {t("orderFooter.token", { orderId })}
      </Text>
      <Text className="text-center text-gray-400 text-xs mt-4">
        © {new Date().getFullYear()} Las Flores De La Imprenta, Inc.{" "}
        {t("orderFooter.copyright")}
      </Text>
    </Section>
  );
}
