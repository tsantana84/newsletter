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

interface NewsletterEmailProps {
  title: string;
  htmlContent: string;
  unsubscribeUrl: string;
  issueUrl: string;
}

export function NewsletterEmail({
  title,
  htmlContent,
  unsubscribeUrl,
  issueUrl,
}: NewsletterEmailProps) {
  return (
    <Html>
      <Head />
      <Body style={body}>
        <Container style={container}>
          <Section>
            <Text style={heading}>{title}</Text>
            <div dangerouslySetInnerHTML={{ __html: htmlContent }} />
            <Hr style={hr} />
            <Text style={footer}>
              <Link href={issueUrl}>Read online</Link>
              {" | "}
              <Link href={unsubscribeUrl}>Unsubscribe</Link>
            </Text>
            <Text style={footer}>
              You received this because you subscribed to the newsletter.
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
  fontSize: "28px",
  fontWeight: "bold" as const,
  marginBottom: "24px",
};
const hr = { borderColor: "#e6e6e6", margin: "32px 0" };
const footer = {
  fontSize: "14px",
  color: "#666",
  textAlign: "center" as const,
};
