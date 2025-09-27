import { Img, Section } from "@react-email/components";

export function Header() {
  return (
    <Section className="bg-primary text-white px-6 py-4">
      <div className="w-24">
        <Img
          src="../static/logofondonegro.png"
          alt="Las flores de la imprenta"
          className="w-full h-full object-contain"
        />
      </div>
    </Section>
  );
}
