import type { Metadata } from "next";

export const metadata: Metadata = {
  title: process.env.SITE_NAME ?? "Logbook",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
