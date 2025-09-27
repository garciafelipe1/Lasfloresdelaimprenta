import delivery from "./delivery-created";
import footer from "./order-footer";
import orderPlaced from "./order-placed";
import payment from "./payment-captured";
import shipping from "./shipment-created";

export default {
  ...shipping,
  ...footer,
  ...payment,
  ...orderPlaced,
  ...delivery,
};
