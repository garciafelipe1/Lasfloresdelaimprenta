export const memberships = [
  {
    id: "BASICO",
    name: "Básica",
  },
  {
    id: "MEDIANO",
    name: "Mediana",
  },
  {
    id: "PREMIUM",
    name: "Premium",
  },
] as const;

export type MembershipId = (typeof memberships)[number]["id"];
export type MembershipName = (typeof memberships)[number]["name"];
