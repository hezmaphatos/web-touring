import type { Metadata, Viewport } from "next";
import "lenis/dist/lenis.css";
import "@/styles/global.css";
import { Footer } from "@/components/Footer/Footer";
import { Nav } from "@/components/Nav/Nav";
import { TransitionProvider } from "@/components/Transition/TransitionProvider";
import { LenisProvider } from "@/lib/motion/LenisProvider";
import { loadSite, SITE_URL } from "@/lib/site";
import { archivo, newsreader } from "./fonts";

export async function generateMetadata(): Promise<Metadata> {
  const site = await loadSite();

  return {
    metadataBase: new URL(SITE_URL),
    title: { default: site.site_name, template: `%s | ${site.site_name}` },
    description: "Catatan perjalanan motor keliling Jawa: trip, rute, foto, video, dan motornya.",
    openGraph: { siteName: site.site_name, locale: "id_ID", type: "website" },
  };
}

export const viewport: Viewport = {
  themeColor: "#cbcac4",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const site = await loadSite();

  return (
    <html lang="id" className={`${archivo.variable} ${newsreader.variable}`}>
      <body>
        <a className="skip-link" href="#isi">
          Langsung ke isi
        </a>
        <LenisProvider>
          <TransitionProvider>
            <Nav siteName={site.site_name} totalKm={site.total_km} />
            <main id="isi" tabIndex={-1}>
              {children}
            </main>
            <Footer site={site} />
          </TransitionProvider>
        </LenisProvider>
      </body>
    </html>
  );
}
