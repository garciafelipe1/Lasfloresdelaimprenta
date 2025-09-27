import { Container, Heading, Link, Text } from "@react-email/components";
import { Banner } from "./components/banner";
import { Layout } from "./components/layout";
import { OrderFooter } from "./components/order-footer";
import { geti18n } from "./lib/i18n";
import { PropsBase } from "./types/types";

export interface ShipmentCreatedEmailProps extends PropsBase {
  trackingNumber?: string;
  order: {
    id: string;
  };
}

function ShipmentCreatedEmailComponent({
  email_banner,
  trackingNumber,
  order,
  locale = "es",
}: ShipmentCreatedEmailProps) {
  const shouldDisplayBanner = email_banner && "title" in email_banner;
  const t = geti18n(locale);

  return (
    <Layout preview={t("shipment.preview") as string}>
      <Container className="p-6">
        <Heading className="text-2xl font-bold text-center text-gray-800">
          {t("shipment.heading", { name: "Santiago" })}
        </Heading>
        <Text className="text-center text-gray-600 mt-2">
          {t("shipment.body", { orderId: order.id })}
        </Text>

        <Container className="bg-gray-50 rounded-lg p-4 mt-4">
          <Text className="text-center text-gray-800 font-semibold mb-2">
            {t("shipment.trackingInfo")}
          </Text>
          <Text className="text-center text-gray-600">
            <strong>{t("shipment.trackingNumber")}</strong>
            {trackingNumber}
          </Text>
          <Text className="text-center text-gray-600">
            {t("shipment.trackingCheck")}
            <Link
              href="https://www.correoargentino.com.ar/formularios/e-commerce"
              target="_blank"
            >
              Correo Argentino
            </Link>
          </Text>
        </Container>
      </Container>

      {shouldDisplayBanner && <Banner {...email_banner} />}

      <OrderFooter orderId={order.id} />
    </Layout>
  );
}

export const orderShippedEmail = (props: ShipmentCreatedEmailProps) => (
  <ShipmentCreatedEmailComponent {...props} />
);

const mockOrder: ShipmentCreatedEmailProps = {
  trackingNumber: "123456789",
  order: {
    id: "order_01K18P27Z2BD8VKRN91V",
  },
  locale: "es",
};

// @ts-ignore
export default () => <ShipmentCreatedEmailComponent {...mockOrder} />;
