import type { Metadata } from "next";
import "./globals.css";
import { SiteFrame } from "./components/site-frame";

export const metadata: Metadata = {
  title: {
    default: "Mindsupport Psychotherapy | A Space to Talk",
    template: "%s | Mindsupport Psychotherapy",
  },
  description: "Looking for someone to talk to? Mindsupport Psychotherapy offers a thoughtful space to explore support, online or in person, at your own pace.",
  applicationName: "Mindsupport Psychotherapy Ltd",
  openGraph: {
    type: "website",
    siteName: "Mindsupport Psychotherapy",
    title: "Mindsupport Psychotherapy | A Space to Talk",
    description: "A thoughtful space to explore therapy and find support at your own pace.",
    locale: "en_GB",
  },
  twitter: {
    card: "summary",
    title: "Mindsupport Psychotherapy | A Space to Talk",
    description: "A thoughtful space to explore therapy and find support at your own pace.",
  },
};

export default function RootLayout({ children, sheet }: Readonly<{ children: React.ReactNode; sheet: React.ReactNode }>) {
  return (
    <html lang="en">
      <body><SiteFrame sheet={sheet}>{children}</SiteFrame></body>
    </html>
  );
}
