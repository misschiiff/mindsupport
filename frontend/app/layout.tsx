import type { Metadata } from "next";
import "./globals.css";
import { SiteFrame } from "./components/site-frame";

export const metadata: Metadata = {
  metadataBase: new URL("https://www.mindsupporthq.com"),
  title: {
    default: "Psychotherapy and Counselling Support | Mindsupport",
    template: "%s | Mindsupport Psychotherapy",
  },
  description: "Looking for someone to talk to? Mindsupport Psychotherapy offers thoughtful therapy and counselling support online or in person. Request a free first conversation.",
  applicationName: "Mindsupport Psychotherapy Ltd",
  openGraph: {
    type: "website",
    siteName: "Mindsupport Psychotherapy",
    title: "Psychotherapy and Counselling Support | Mindsupport",
    description: "Thoughtful therapy and counselling support, online or in person. Start with a free first conversation and move at your own pace.",
    locale: "en_GB",
  },
  twitter: {
    card: "summary",
    title: "Psychotherapy and Counselling Support | Mindsupport",
    description: "Thoughtful therapy and counselling support, online or in person. Start with a free first conversation and move at your own pace.",
  },
};

export default function RootLayout({ children, sheet }: Readonly<{ children: React.ReactNode; sheet: React.ReactNode }>) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body><SiteFrame sheet={sheet}>{children}</SiteFrame></body>
    </html>
  );
}
