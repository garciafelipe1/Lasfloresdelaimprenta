import { zodResolver } from "@hookform/resolvers/zod";
import { Button, Drawer, InlineTip, Input, Label, toast } from "@medusajs/ui";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useForm } from "react-hook-form";
import {
  PutMembershipSchema,
  PutMembershipSchemaType,
} from "../../../api/membership/validators";
import { MembershipType } from "../../../types";
import { medusaSdk } from "../../lib/config";

const updateMembership = (input: PutMembershipSchemaType) => {
  return medusaSdk.client.fetch("/membership", {
    method: "PUT",
    body: input,
  });
};

type Props = Pick<MembershipType, "description" | "id" | "name" | "price">;

export function EditMembershipDrawer({ description, id, name, price }: Props) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const { mutate, isPending } = useMutation({
    mutationFn: updateMembership,
    mutationKey: ["update-membership"],
    onError() {
      toast.error("Error al actualizar la membresia");
    },
    onSuccess() {
      queryClient.invalidateQueries({ queryKey: ["memberships"] });
      toast.success("Informacion de la ciudad actualizada correctamente");
      setOpen(false);
    },
  });

  const form = useForm<PutMembershipSchemaType>({
    resolver: zodResolver(PutMembershipSchema),
    defaultValues: {
      description: description ?? "",
      price: price ?? "",
      name: name ?? "",
      id: id ?? "",
    },
  });

  const handleSubmit = (data: PutMembershipSchemaType) => {
    mutate(data);
  };

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <Drawer.Trigger asChild>
        <Button>Editar</Button>
      </Drawer.Trigger>
      <Drawer.Content>
        <Drawer.Header>
          <Drawer.Title>Editar Membresía</Drawer.Title>
        </Drawer.Header>
        <Drawer.Body className="p-4 flex flex-col gap-8">
          <form className="flex flex-col gap-y-2" {...form}>
            <div className="flex flex-col gap-y-2">
              <Label htmlFor="name" className="text-ui-fg-subtle">
                Nombre de la membresía
              </Label>
              <Input
                {...form.register("name")}
                placeholder="Bahía Blanca"
                id="name"
              />
            </div>
            <div className="flex flex-col gap-y-2">
              <Label htmlFor="description" className="text-ui-fg-subtle">
                Descripción
              </Label>
              <Input
                {...form.register("description")}
                id="description"
                placeholder="..."
              />
            </div>
            <div className="flex flex-col gap-y-2">
              <Label htmlFor="price" className="text-ui-fg-subtle">
                Precio mensual de la membresía
              </Label>
              <Input
                {...form.register("price")}
                id="price"
                placeholder="3000"
                type="number"
              />
            </div>
          </form>
          <InlineTip label="Tip">
            Los cambios en el precio solo aplicarán a nuevas suscripciones. Los
            usuarios que ya pagaron no se verán afectados hasta que renueven su
            membresía.
          </InlineTip>
        </Drawer.Body>
        <Drawer.Footer>
          <Drawer.Close asChild>
            <Button variant="secondary">Cancelar</Button>
          </Drawer.Close>
          <Button
            disabled={isPending}
            onClick={form.handleSubmit(handleSubmit)}
          >
            Actualizar
          </Button>
        </Drawer.Footer>
      </Drawer.Content>
    </Drawer>
  );
}
