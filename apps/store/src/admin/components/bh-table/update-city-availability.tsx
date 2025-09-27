import { Label, Switch, toast } from "@medusajs/ui";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { medusaSdk } from "../../lib/config";

interface Props {
  id: string;
  isActive: boolean;
}

const updateAvailability = (id: string) => {
  return medusaSdk.client.fetch(`/bahia-blanca/city/availability/${id}`, {
    method: "PUT",
  });
};

export function UpdateCityAvailability({ id, isActive }: Props) {
  const queryClient = useQueryClient();
  const { mutate, isPending } = useMutation({
    mutationFn: updateAvailability,
    mutationKey: ["update-availabilty", id, isActive],
    onSuccess() {
      queryClient.invalidateQueries({ queryKey: ["ciudades-bahia-blanca"] });
      toast.success("Ciudad actualizada correctamente");
    },
    onError() {
      toast.error("Error al actualizar la información de la ciudad.");
    },
  });

  const handleChange = () => {
    mutate(id);
  };

  return (
    <div className="flex gap-2 items-center">
      <Switch
        checked={isActive}
        onClick={handleChange}
        disabled={isPending}
        id="city"
      />
      <Label htmlFor="city">{isActive ? "Activo" : "Inactivo"}</Label>
    </div>
  );
}
