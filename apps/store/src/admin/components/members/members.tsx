import { XMarkMini } from "@medusajs/icons";
import { Button, Text } from "@medusajs/ui";
import { useQuery } from "@tanstack/react-query";
import { MemberDTO } from "../../../api/membership/members/route";
import { medusaSdk } from "../../lib/config";
import { Loading } from "../common/loading";
import { MembersTable } from "../data-table/members-table";

const getMember = (): Promise<MemberDTO[]> => {
  return medusaSdk.client.fetch("/membership/members");
};

export function Members() {
  const { data, isLoading, isError, refetch } = useQuery({
    queryFn: getMember,
    queryKey: ["members"],
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

  return <MembersTable data={data ?? []} />;
}
