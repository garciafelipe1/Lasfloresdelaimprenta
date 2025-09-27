import { MembershipId } from "@/shared/constants";
import { MembershipType } from "@/shared/types";

type MembershipSeed = {
  id: MembershipId;
  description: string;
  name: MembershipType["name"];
  price: number;
};

export const membershipSeed: MembershipSeed[] = [
  {
    description: "Membresía básica",
    id: "esencial",
    name: "Esencial",
    price: 100,
  },
  {
    description: "Membresía medium",
    id: "premium",
    name: "Premium",
    price: 200,
  },
  {
    description: "Membresía premium",
    id: "elite",
    name: "Elite",
    price: 500,
  },
];
