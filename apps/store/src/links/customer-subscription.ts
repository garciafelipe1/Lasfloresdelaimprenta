import { defineLink } from "@medusajs/framework/utils";
import CustomerModule from "@medusajs/medusa/customer";
import MembershipModule from "../modules/membership";

export default defineLink(
  {
    linkable: MembershipModule.linkable.subscription,
    isList: true,
  },
  CustomerModule.linkable.customer
);
