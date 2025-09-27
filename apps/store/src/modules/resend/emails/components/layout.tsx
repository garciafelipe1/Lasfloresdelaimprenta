import { Body, Head, Html, Preview, Tailwind } from "@react-email/components";
import { PropsWithChildren } from "react";
import { Header } from "./header";

type Props = PropsWithChildren & {
  preview: string;
};

export function Layout({ preview, children }: Props) {
  return (
    <Tailwind
      config={{
        theme: {
          extend: {
            colors: {
              background: "#FCFCFD",
              foreground: "#4C4F61",
              card: "#FFFFFF",
              "card-foreground": "#4C4F61",
              primary: "#6D5DFC",
              "primary-foreground": "#FFFFFF",
              secondary: "#EAE5F8",
              "secondary-foreground": "#7C77A1",
              muted: "#F4F1FA",
              "muted-foreground": "#8D8A9F",
              accent: "#CBC2FF",
              "accent-foreground": "#4C4F61",
              destructive: "#FF6D6D",
              "destructive-foreground": "#FFFFFF",
              border: "#EAE5F8",
              input: "#EAE5F8",
              ring: "#6D5DFC",
            },
          },
        },
      }}
    >
      <Html className="font-sans bg-gray-100">
        <Head />
        <Preview>{preview}</Preview>
        <Body className="bg-background my-10 mx-auto w-full max-w-2xl">
          <Header />
          {children}
        </Body>
      </Html>
    </Tailwind>
  );
}
