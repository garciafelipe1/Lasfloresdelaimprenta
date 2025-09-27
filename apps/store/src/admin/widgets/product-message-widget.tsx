import { defineWidgetConfig } from "@medusajs/admin-sdk";
import { AdminOrder, DetailWidgetProps } from "@medusajs/framework/types";
import { Container, Text } from "@medusajs/ui";

const OrderGiftItemsWidget = ({ data }: DetailWidgetProps<AdminOrder>) => {
  const giftItems = data.items?.filter((item: any) =>
    Boolean(item.metadata?.message)
  );

  if (!giftItems?.length) {
    return null;
  }

  return (
    <Container className="mb-4">
      <Text className="font-medium h2-core mb-2">
        Productos del pedido con mensajes
      </Text>
      <div className="flex flex-col gap-4">
        {giftItems.map((item: any) => (
          <div key={item.id} className="border-b last:border-b-0 pb-2">
            <Text className="font-medium">
              {item.title} (x{item.quantity})
            </Text>
            <Text className="text-sm text-gray-600">
              Mensaje: {item.metadata?.message || "(No message)"}
            </Text>
          </div>
        ))}
      </div>
    </Container>
  );
};

export const config = defineWidgetConfig({
  zone: "order.details.side.after",
});

export default OrderGiftItemsWidget;
