import { Container, Heading, Link, Text } from "@react-email/components";
import { Banner } from "./components/banner";
import { Layout } from "./components/layout";
import { OrderFooter } from "./components/order-footer";
import { geti18n } from "./lib/i18n";
import { PropsBase } from "./types/types";

export interface DeliveryCreatedEmailProps extends PropsBase {
  trackingNumber?: string;
  deliveryDate?: string;
  order: {
    id: string;
  };
}

function DeliveryCreatedEmailComponent({
  email_banner,
  trackingNumber,
  deliveryDate,
  order,
  locale = "es",
}: DeliveryCreatedEmailProps) {
  const shouldDisplayBanner = email_banner && "title" in email_banner;
  const t = geti18n(locale);

  return (
    <Layout preview={t("delivery.preview") as string}>
      <Container className="p-6">
        <Heading className="text-2xl font-bold text-center text-gray-800">
          {t("delivery.heading", { name: "Santiago" })}
        </Heading>
        <Text className="text-center text-gray-600 mt-2">
          {t("delivery.body", { orderId: order.id })}
        </Text>

        <Container className="bg-green-50 rounded-lg p-4 mt-4 border-l-4 border-green-500">
          <Text className="text-center text-green-800 font-semibold mb-2">
            {t("delivery.deliveryInfo")}
          </Text>
          {deliveryDate && (
            <Text className="text-center text-green-700">
              <strong>{t("delivery.deliveryDate")}</strong>
              {deliveryDate}
            </Text>
          )}
          {trackingNumber && (
            <Text className="text-center text-green-700">
              <strong>{t("delivery.trackingNumber")}</strong>
              {trackingNumber}
            </Text>
          )}
        </Container>

        <Text className="text-center text-gray-600 mt-4">
          {t("delivery.feedback")}
          <Link
            href="mailto:support@example.com"
            className="text-blue-600 underline"
          >
            {t("delivery.contactUs")}
          </Link>
        </Text>
      </Container>

      {shouldDisplayBanner && <Banner {...email_banner} />}

      <OrderFooter orderId={order.id} />
    </Layout>
  );
}

export const orderShippedEmail = (props: DeliveryCreatedEmailProps) => (
  <DeliveryCreatedEmailComponent {...props} />
);

const mockOrder: DeliveryCreatedEmailProps = {
  trackingNumber: "123456789",
  order: {
    id: "order_01K18P27Z2BD8VKRN91V",
  },
  locale: "es",
};

// @ts-ignore
export default () => <ShipmentCreatedEmailComponent {...mockOrder} />;
