import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Text,
  Link,
  Hr,
} from "@react-email/components";

interface ConfirmationEmailProps {
  confirmUrl: string;
}

export function ConfirmationEmail({ confirmUrl }: ConfirmationEmailProps) {
  return (
    <Html>
      <Head />
      <Body style={body}>
        <Container style={container}>
          <Section>
            <Text style={heading}>Confirm your subscription</Text>
            <Text style={text}>
              Thanks for subscribing! Click the link below to confirm your email
              address and start receiving the newsletter.
            </Text>
            <Link href={confirmUrl} style={button}>
              Confirm Subscription
            </Link>
            <Hr style={hr} />
            <Text style={footer}>
              If you didn&apos;t subscribe, you can safely ignore this email.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

const body = {
  backgroundColor: "#f6f9fc",
  fontFamily: "system-ui, sans-serif",
};
const container = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  padding: "40px",
  maxWidth: "600px",
};
const heading = {
  fontSize: "24px",
  fontWeight: "bold" as const,
  marginBottom: "16px",
};
const text = { fontSize: "16px", lineHeight: "1.6", color: "#333" };
const button = {
  display: "inline-block",
  backgroundColor: "#000",
  color: "#fff",
  padding: "12px 24px",
  borderRadius: "6px",
  textDecoration: "none",
  fontSize: "16px",
  marginTop: "16px",
};
const hr = { borderColor: "#e6e6e6", margin: "24px 0" };
const footer = { fontSize: "14px", color: "#666" };
