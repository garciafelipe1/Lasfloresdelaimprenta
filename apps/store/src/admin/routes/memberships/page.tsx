import { defineRouteConfig } from "@medusajs/admin-sdk";
import { Users } from "@medusajs/icons";
import { Container, Heading } from "@medusajs/ui";
import { Members } from "../../components/members/members";

const CustomPage = () => {
  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <Heading level="h2">Miembros</Heading>
        
      </div>
      <Members />
    </Container>
  );
};

export const config = defineRouteConfig({
  label: "Club de miembros",
  icon: Users,
});

export default CustomPage;
