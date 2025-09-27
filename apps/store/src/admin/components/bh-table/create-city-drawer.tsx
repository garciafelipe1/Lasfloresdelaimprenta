import { zodResolver } from "@hookform/resolvers/zod";
import { Button, Drawer, Input, Label, Text } from "@medusajs/ui";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useBahiaBlancaMutations } from "~/hooks/use-bahia-blanca-mutations";
import {
  createShippingOptionSchema,
  CreateShippingOptionsDTO,
} from "../../../shared/dtos/shipping-options";

export function CreateCityDrawer() {
  const [open, setOpen] = useState(false);
  const { create, createIsPending } = useBahiaBlancaMutations({
    onCreateSuccess() {
      setOpen(false);
    },
  });

  const form = useForm<CreateShippingOptionsDTO>({
    resolver: zodResolver(createShippingOptionSchema),
    defaultValues: {
      name: "",
      price: 0,
    },
  });

  const handleSubmit = (data: CreateShippingOptionsDTO) => {
    create(data);
  };

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <Drawer.Trigger asChild>
        <Button>Agregar Ciudad</Button>
      </Drawer.Trigger>
      <Drawer.Content>
        <Drawer.Header>
          <Drawer.Title>Agregar Ciudad</Drawer.Title>
        </Drawer.Header>
        <Drawer.Body className="p-4 flex flex-col gap-8">
          <Text>This is where you edit the variant&apos;s details</Text>
          <form className="flex flex-col gap-y-2" {...form}>
            <div className="flex flex-col gap-y-2">
              <Label htmlFor="name" className="text-ui-fg-subtle">
                Nombre de la ciudad
              </Label>
              <Input
                {...form.register("name")}
                placeholder="Bahía Blanca"
                id="name"
              />
            </div>
            <div className="flex flex-col gap-y-2">
              <Label htmlFor="shipping_price" className="text-ui-fg-subtle">
                Precio de envío
              </Label>
              <Input
                {...form.register("price")}
                id="shipping_price"
                placeholder="3000"
                type="number"
              />
            </div>
          </form>
        </Drawer.Body>
        <Drawer.Footer>
          <Drawer.Close asChild>
            <Button variant="secondary">Cancelar</Button>
          </Drawer.Close>
          <Button
            disabled={createIsPending}
            onClick={form.handleSubmit(handleSubmit)}
          >
            Crear
          </Button>
        </Drawer.Footer>
      </Drawer.Content>
    </Drawer>
  );
}
