import { Container, Heading, Text } from "@react-email/components";
import { Banner } from "./components/banner";
import { Layout } from "./components/layout";
import { OrderFooter } from "./components/order-footer";
import { mockOrder } from "./data/order-mock";
import { geti18n } from "./lib/i18n";
import { PropsBase } from "./types/types";

interface PaymentCapturedEmailProps extends PropsBase {
  order: {
    id: string;
    display_id: string;
  };
}

function PaymentCapturedEmailComponent({
  order,
  email_banner,
  locale = "en",
}: PaymentCapturedEmailProps) {
  const shouldDisplayBanner = email_banner && "title" in email_banner;
  const t = geti18n(locale);

  return (
    <Layout preview="Your payment has been captured">
      <Container className="p-6">
        <Heading className="text-2xl font-bold text-center text-gray-800">
          {t("paymentCaptured.heading")}
        </Heading>
        <Text className="text-center text-gray-600 mt-2">
          {t("paymentCaptured.message", {
            orderId: order.display_id,
          })}
        </Text>
        <Text className="text-center text-gray-600 mt-2">
          {t("paymentCaptured.shipment")}
        </Text>
      </Container>

      {shouldDisplayBanner && <Banner {...email_banner} />}

      <OrderFooter orderId={order.id} />
    </Layout>
  );
}

export const paymentCapturedEmail = (props: PaymentCapturedEmailProps) => (
  <PaymentCapturedEmailComponent {...props} />
);

// @ts-ignore
export default () => <PaymentCapturedEmailComponent {...mockOrder} />;
