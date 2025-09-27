import { MANUAL_PAYMENT_PROVIDER_ID } from "@/shared/constants";
import {
  BigNumberValue,
  CustomerDTO,
  OrderDTO,
} from "@medusajs/framework/types";
import {
  Column,
  Container,
  Heading,
  Img,
  Row,
  Section,
  Text,
} from "@react-email/components";
import { Banner } from "./components/banner";
import { Layout } from "./components/layout";
import { OrderFooter } from "./components/order-footer";
import { mockOrder } from "./data/order-mock";
import { geti18n } from "./lib/i18n";
import { PropsBase } from "./types/types";

type PaymentCollection = {
  payment_sessions: {
    provider_id: string;
  }[];
};

type OrderPlacedEmailProps = PropsBase & {
  order: OrderDTO & {
    customer: CustomerDTO;
  } & {
    payment_collections: PaymentCollection[];
  };
};

function OrderPlacedEmailComponent({
  order,
  email_banner,
  locale = "en",
}: OrderPlacedEmailProps) {
  const shouldDisplayBanner = email_banner && "title" in email_banner;
  const t = geti18n(locale);

  const formatter = new Intl.NumberFormat([], {
    style: "currency",
    currencyDisplay: "narrowSymbol",
    currency: order.currency_code,
  });

  const formatPrice = (price: BigNumberValue) => {
    if (typeof price === "number") {
      return formatter.format(price);
    }

    if (typeof price === "string") {
      return formatter.format(parseFloat(price));
    }

    return price?.toString() || "";
  };

  const isManualOrder = order.payment_collections.some((pc) =>
    pc.payment_sessions.some(
      (ps) => ps.provider_id === MANUAL_PAYMENT_PROVIDER_ID
    )
  );

  return (
    <Layout preview="Thank you for your order from Medusa">
      <Container className="p-6">
        <Heading className="text-2xl font-bold text-center text-gray-800">
          {t("orderPlaced.heading", {
            name: order.shipping_address?.first_name || "Customer",
          })}
        </Heading>
        <Text className="text-center text-gray-600 mt-2">
          {t("orderPlaced.body")}
        </Text>
      </Container>

      {shouldDisplayBanner && <Banner {...email_banner} />}

      <Container className="px-6">
        <Heading className="text-xl font-semibold text-gray-800 mb-4">
          {t("orderPlaced.yourItems")}
        </Heading>
        <Row>
          <Column>
            <Text className="text-sm m-0 my-2 text-gray-500">
              {t("orderPlaced.orderId", { orderId: order.display_id })}
            </Text>
          </Column>
        </Row>
        {order.items?.map((item) => (
          <Section key={item.id} className="border-b border-gray-200 py-4">
            <Row>
              <Column className="w-1/3">
                <Img
                  src={item.thumbnail ?? ""}
                  alt={item.product_title ?? ""}
                  className="rounded-lg"
                  width="100%"
                />
              </Column>
              <Column className="w-2/3 pl-4">
                <Text className="text-lg font-semibold text-gray-800">
                  {item.product_title}
                </Text>
                <Text className="text-gray-600">{item.variant_title}</Text>
                <Text className="text-gray-800 mt-2 font-bold">
                  {formatPrice(item.total)}
                </Text>
              </Column>
            </Row>
          </Section>
        ))}

        {isManualOrder && (
          <Section className="mt-8 bg-yellow-50 p-4 rounded-lg">
            <Heading className="text-xl font-semibold text-gray-800 mb-4">
              {t("orderPlaced.paymentInstructions")}
            </Heading>
            <Text className="text-gray-700 mb-2">
              {t("orderPlaced.manual.body")}
            </Text>
            <Text className="text-gray-700 font-semibold">
              {t("orderPlaced.manual.accountHolder")}
            </Text>
            <Text className="text-gray-700 font-semibold">
              CVU: &lt;cvu cuenta bancaria&gt;
            </Text>
            <Text className="text-gray-700 font-semibold">
              Alias: las.flores.imprenta
            </Text>
            <Text className="text-gray-700 mt-4">
              {t("orderPlaced.manual.transferComplete")}
            </Text>
          </Section>
        )}

        <Section className="mt-8">
          <Heading className="text-xl font-semibold text-gray-800 mb-4">
            {t("orderPlaced.summary")}
          </Heading>
          <Row className="text-gray-600">
            <Column className="w-1/2">
              <Text className="m-0">Subtotal</Text>
            </Column>
            <Column className="w-1/2 text-right">
              <Text className="m-0">{formatPrice(order.item_total)}</Text>
            </Column>
          </Row>
          {order.shipping_methods?.map((method) => (
            <Row className="text-gray-600" key={method.id}>
              <Column className="w-1/2">
                <Text className="m-0">{method.name}</Text>
              </Column>
              <Column className="w-1/2 text-right">
                <Text className="m-0">{formatPrice(method.total)}</Text>
              </Column>
            </Row>
          ))}
          <Row className="text-gray-600">
            <Column className="w-1/2">
              <Text className="m-0">Tax</Text>
            </Column>
            <Column className="w-1/2 text-right">
              <Text className="m-0">{formatPrice(order.tax_total || 0)}</Text>
            </Column>
          </Row>
          <Row className="border-t border-gray-200 mt-4 font-bold text-primary">
            <Column className="w-1/2">
              <Text>Total</Text>
            </Column>
            <Column className="w-1/2 text-right">
              <Text>{formatPrice(order.total)}</Text>
            </Column>
          </Row>
        </Section>
      </Container>

      <OrderFooter orderId={order.id} />
    </Layout>
  );
}

export const orderPlacedEmail = (props: OrderPlacedEmailProps) => (
  <OrderPlacedEmailComponent {...props} />
);

// @ts-ignore
export default () => <OrderPlacedEmailComponent {...mockOrder} />;
