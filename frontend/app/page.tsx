import { TransitionLink } from "@/components/Transition/TransitionLink";
import { loadSite } from "@/lib/site";

// Placeholder until the map home (opening sequence and pinned map) lands.
export default async function Home() {
  const site = await loadSite();

  return (
    <div className="wrap" style={{ paddingBlock: "48px 96px" }}>
      <h1
        style={{
          fontSize: "var(--size-data)",
          fontWeight: 900,
          fontStretch: "75%",
          lineHeight: 0.85,
        }}
      >
        {site.site_name}
      </h1>
      <p style={{ marginTop: 24, fontSize: "1.25rem", fontWeight: 600 }}>
        <TransitionLink href="/trip">Lihat semua trip</TransitionLink>
      </p>
    </div>
  );
}
