import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Destekli LMS — nejdettut.com",
  description:
    "Küçük ölçekli, yapay zekâ destekli öğrenim yönetim sistemi: kurs + modül + ders + otomatik özet + öğrenci ödev teslimi + AI puanlama.",
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="tr">
      <body>{children}</body>
    </html>
  );
}
