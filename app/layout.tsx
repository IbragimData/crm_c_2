import type { Metadata } from "next";
import { ClientLayout } from "./ClientLayout";
import "./globals.css";

export const metadata: Metadata = {
  title: "CRM-Call",
  description: "Lead, team and callback management",
  icons: {
    icon: "/icon.svg",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru">
      <body>
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
