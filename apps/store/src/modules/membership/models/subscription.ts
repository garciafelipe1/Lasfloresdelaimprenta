import { model } from "@medusajs/framework/utils";
import Membership from "./membership";

const Subscription = model.define("subscription", {
  id: model.id().primaryKey(),
  started_at: model.dateTime(),
  ended_at: model.dateTime(),
  status: model.enum(["active", "pending", "cancelled"]),
  customer_id: model.text().unique("IDX_LOYALTY_CUSTOMER_ID"),
  external_id: model.text(),
  price: model.number(),

  membership: model.belongsTo(() => Membership, {
    mappedBy: "subscriptions",
  }),
});

export default Subscription;
