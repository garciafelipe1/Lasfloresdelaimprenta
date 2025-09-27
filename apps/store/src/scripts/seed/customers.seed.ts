import { MembershipId } from "@/shared/constants";

type CustomerSeed = {
  email: string;
  first_name: string;
  last_name: string;
  membership: MembershipId;
};

export const customersSeed: CustomerSeed[] = [
  {
    email: "username1@gmail.com",
    first_name: "Username-1",
    last_name: "Username-lastname-1",
    membership: "esencial",
  },
  {
    email: "username2@gmail.com",
    first_name: "Username-2",
    last_name: "Username-lastname-2",
    membership: "premium",
  },
  {
    email: "username3@gmail.com",
    first_name: "Username-3",
    last_name: "Username-lastname-3",
    membership: "elite",
  },
  {
    email: "username4@gmail.com",
    first_name: "Username-4",
    last_name: "Username-lastname-4",
    membership: "esencial",
  },
  {
    email: "username5@gmail.com",
    first_name: "Username-5",
    last_name: "Username-lastname-5",
    membership: "premium",
  },
  {
    email: "username6@gmail.com",
    first_name: "Username-6",
    last_name: "Username-lastname-6",
    membership: "elite",
  },
  {
    email: "username7@gmail.com",
    first_name: "Username-7",
    last_name: "Username-lastname-7",
    membership: "esencial",
  },
  {
    email: "username8@gmail.com",
    first_name: "Username-8",
    last_name: "Username-lastname-8",
    membership: "premium",
  },
  {
    email: "username9@gmail.com",
    first_name: "Username-9",
    last_name: "Username-lastname-9",
    membership: "esencial",
  },
  {
    email: "username10@gmail.com",
    first_name: "Username-10",
    last_name: "Username-lastname-10",
    membership: "esencial",
  },
  {
    email: "username11@gmail.com",
    first_name: "Username-11",
    last_name: "Username-lastname-11",
    membership: "esencial",
  },
  {
    email: "username12@gmail.com",
    first_name: "Username-12",
    last_name: "Username-lastname-12",
    membership: "premium",
  },
];
