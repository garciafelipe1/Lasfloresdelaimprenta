import { zodResolver } from "@hookform/resolvers/zod";
import { Button, FocusModal, Heading, Input, Label, Text } from "@medusajs/ui";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useBahiaBlancaMutations } from "~/hooks/use-bahia-blanca-mutations";
import {
  ShippingOptionsDTO,
  shippingOptionsDto,
} from "../../../shared/dtos/shipping-options";

type Props = ShippingOptionsDTO;

const formSchema = shippingOptionsDto.omit({
  priceId: true,
  id: true,
});

type FormSchema = z.infer<typeof formSchema>;

export function UpdateCityModal({ id, name, price, priceId }: Props) {
  const [open, setOpen] = useState(false);
  const { update, updateIsPending } = useBahiaBlancaMutations({
    onUpdateSuccess() {
      setOpen(false);
    },
  });
  const form = useForm<FormSchema>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      price,
      name,
    },
  });

  const handleSubmit = (data: FormSchema) => {
    update({
      price: data.price!,
      name: data.name!,
      priceId,
      id,
    });
  };

  return (
    <FocusModal open={open} onOpenChange={setOpen}>
      <FocusModal.Trigger asChild>
        <Button>Editar</Button>
      </FocusModal.Trigger>
      <FocusModal.Content>
        <FocusModal.Header>
          <Button
            disabled={updateIsPending}
            onClick={form.handleSubmit(handleSubmit)}
          >
            Guardar
          </Button>
        </FocusModal.Header>
        <FocusModal.Body className="flex flex-col items-center py-16">
          <div className="flex w-full max-w-lg flex-col gap-y-8">
            <div className="flex flex-col gap-y-1">
              <Heading>Actualizar ciudad</Heading>
              <Text className="text-ui-fg-subtle">
                Modifica el nombre de la ciudad y su costo de envío. Asegúrate
                de que la información sea correcta antes de guardar los cambios.
              </Text>
            </div>
            <form {...form} className="flex flex-col gap-y-2">
              <div className="flex flex-col gap-y-2">
                <Label htmlFor="name" className="text-ui-fg-subtle">
                  Nombre de la ciudad
                </Label>
                <Input
                  {...form.register("name")}
                  placeholder="Bahia Blanca"
                  id="name"
                />
              </div>
              <div className="flex flex-col gap-y-2">
                <Label htmlFor="shipping_price" className="text-ui-fg-subtle">
                  Precio de envío
                </Label>
                <Input
                  {...form.register("price")}
                  placeholder="1000"
                  id="shipping_price"
                  type="number"
                />
              </div>
            </form>
          </div>
        </FocusModal.Body>
      </FocusModal.Content>
    </FocusModal>
  );
}
