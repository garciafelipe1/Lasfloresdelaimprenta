import {
  Column,
  Container,
  Heading,
  Link,
  Row,
  Section,
  Text,
} from "@react-email/components";
import { EmailBanner } from "../types/types";

type Props = EmailBanner;

export function Banner({ body, title, url }: Props) {
  return (
    <Container
      className="mb-4 rounded-lg p-7"
      style={{
        background: "linear-gradient(to right, #3b82f6, #4f46e5)",
      }}
    >
      <Section>
        <Row>
          <Column align="left">
            <Heading className="text-white text-xl font-semibold">
              {title}
            </Heading>
            <Text className="text-white mt-2">{body}</Text>
          </Column>
          <Column align="right">
            <Link
              href={url}
              className="font-semibold px-2 text-white underline"
            >
              Shop Now
            </Link>
          </Column>
        </Row>
      </Section>
    </Container>
  );
}
