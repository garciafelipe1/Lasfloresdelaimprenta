import { model } from "@medusajs/framework/utils";
import Subscription from "./subscription";

const Membership = model.define("membership", {
  id: model.id().primaryKey(),
  name: model.enum(["Esencial", "Premium", "Elite"]),
  description: model.text(),
  price: model.number(),
  subscriptions: model.hasMany(() => Subscription, { mappedBy: "membership" }),
});

export default Membership;
