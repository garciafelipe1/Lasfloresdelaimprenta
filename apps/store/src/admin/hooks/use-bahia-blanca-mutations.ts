import { toast } from "@medusajs/ui";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  createCity,
  QUERY_KEYS,
  updateCity,
} from "~/queries/bahia-blanca-queries";

interface Props {
  onCreateSuccess?: () => void;
  onUpdateSuccess?: () => void;
}

export function useBahiaBlancaMutations({
  onCreateSuccess,
  onUpdateSuccess,
}: Props) {
  const queryClient = useQueryClient();

  const updateMutation = useMutation({
    mutationFn: updateCity,
    mutationKey: ["update-city"],
    onError(err) {
      console.error(err);
      toast.error("Error al actualizar la información de la ciudad");
    },
    onSuccess() {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.LIST_ALL });
      toast.success("Informacion de la ciudad actualizada correctamente");
      onUpdateSuccess && onUpdateSuccess();
    },
  });

  const createMutation = useMutation({
    mutationFn: createCity,
    mutationKey: ["update-city"],
    onError() {
      toast.error("Error al crear la ciudad");
    },
    onSuccess() {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.LIST_ALL });
      toast.success("Ciudad agregada correctamente");
      onCreateSuccess && onCreateSuccess();
    },
  });

  return {
    update: updateMutation.mutate,
    updateIsPending: updateMutation.isPending,
    create: createMutation.mutate,
    createIsPending: createMutation.isPending,
  };
}
