import type { Metadata, Viewport } from "next";
import "lenis/dist/lenis.css";
import "@/styles/global.css";
import { Footer } from "@/components/Footer/Footer";
import { Nav } from "@/components/Nav/Nav";
import { TransitionProvider } from "@/components/Transition/TransitionProvider";
import { FlexWidth } from "@/lib/motion/FlexWidth";
import { LenisProvider } from "@/lib/motion/LenisProvider";
import { OPENING_SESSION_KEY } from "@/lib/motion/opening";
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

/**
 * data-lowend: few cores, little memory or data saver (same test as useLowEnd).
 * data-opening: first home visit this session, motion allowed; the opening covers the page.
 */
const BOOT_SCRIPT = `(function(){try{var d=document.documentElement,n=navigator,c=n.connection;if((n.hardwareConcurrency&&n.hardwareConcurrency<=4)||(n.deviceMemory&&n.deviceMemory<=4)||(c&&c.saveData))d.setAttribute("data-lowend","");if(location.pathname==="/"&&!matchMedia("(prefers-reduced-motion: reduce)").matches&&!sessionStorage.getItem("${OPENING_SESSION_KEY}"))d.setAttribute("data-opening","")}catch(e){}})();`;

export const viewport: Viewport = {
  themeColor: "#cbcac4",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const site = await loadSite();

  return (
    <html
      lang="id"
      className={`${archivo.variable} ${newsreader.variable}`}
      suppressHydrationWarning
    >
      <head>
        {/* Runs before first paint: flags low-end devices and the home opening sequence. */}
        <script dangerouslySetInnerHTML={{ __html: BOOT_SCRIPT }} />
      </head>
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
            <FlexWidth />
          </TransitionProvider>
        </LenisProvider>
      </body>
    </html>
  );
}
