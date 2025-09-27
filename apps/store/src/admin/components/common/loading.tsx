import { Loader } from "@medusajs/icons";

export function Loading() {
  return (
    <section className="flex flex-col gap-4 justify-center items-center p-6">
      <Loader className="animate-spin text-ui-fg-interactive" />
      <p>Cargando...</p>
    </section>
  );
}
