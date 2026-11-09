import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Mindsupport Psychotherapy Ltd",
  description: "A thoughtful, human space to talk things through and move at your own pace.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
