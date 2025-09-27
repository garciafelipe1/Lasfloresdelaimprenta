import { Book, DocumentText, XMarkMini } from "@medusajs/icons";
import { Button, Container, Heading, IconBadge, Text } from "@medusajs/ui";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import { MemberDTOO } from "../../../../api/membership/members/[id]/route";
import { Loading } from "../../../components/common/loading";
import { SubscriptionsList } from "../../../components/member/subscriptions-list";
import { SectionRow } from "../../../components/section-row";
import { TwoColumnLayout } from "../../../layout/two-columns";
import { medusaSdk } from "../../../lib/config";
import { formatARS } from "../../../lib/utils";

const getMember = (id: string) => {
  return medusaSdk.client.fetch<MemberDTOO>(`/membership/members/${id}`);
};

const CustomPage = () => {
  const { id } = useParams();

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: [`member`, id],
    queryFn: () => getMember(id!),
  });

  if (isError) {
    return (
      <div className="flex flex-col gap-4 justify-center items-center p-6">
        <XMarkMini className="text-ui-fg-error" />
        <Text>Hubo un error...</Text>
        <Button onClick={() => refetch()} variant="secondary">
          Reintentar
        </Button>
      </div>
    );
  }

  if (isLoading) {
    return <Loading />;
  }

  return (
    <TwoColumnLayout
      firstCol={
        <Container className="divide-y p-0">
          <div className="flex items-center gap-2 px-6 py-4">
            <IconBadge>
              <Book />
            </IconBadge>
            <Heading level="h2">Historial De Suscripciones</Heading>
          </div>
          <SubscriptionsList subscriptions={data?.subscriptions ?? []} />
        </Container>
      }
      secondCol={
        <Container className="divide-y p-0">
          <div className="flex items-center gap-2 px-6 py-4">
            <IconBadge>
              <DocumentText />
            </IconBadge>
            <Heading level="h2">Estadisticas Generales</Heading>
          </div>
          <SectionRow
            title="Suscripciones adquiridas"
            value={data?.subscriptions.length}
          />
          <SectionRow
            title="Ingresos a partir de suscripciones"
            value={formatARS(
              data?.subscriptions.reduce((acc, curr) => acc + curr.price, 0)!
            )}
          />
        </Container>
      }
    />
  );
};

export default CustomPage;
