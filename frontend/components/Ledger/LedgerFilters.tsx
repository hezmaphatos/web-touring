import Link from "next/link";
import type { ReactNode } from "react";
import { filterHref, TERRAIN_PARAMS, type LedgerFilter } from "@/lib/filters";
import { TYPE_LABELS } from "@/lib/format";
import styles from "./Ledger.module.css";

interface Props {
  years: number[];
  filter: LedgerFilter;
}

/** Plain text toggles. State lives in the URL, so filters work without JavaScript. */
export function LedgerFilters({ years, filter }: Props) {
  return (
    <nav aria-label="Saring trip" className={`wrap ${styles.filters}`}>
      {years.length > 0 && (
        <div className={styles.filterGroup}>
          <span className={styles.filterLabel}>Tahun</span>
          <ul className={styles.filterList}>
            <li>
              <Option href={filterHref({ ...filter, year: null })} active={filter.year === null}>
                Semua
              </Option>
            </li>
            {years.map((year) => (
              <li key={year}>
                <Option
                  href={filterHref({ ...filter, year: filter.year === year ? null : year })}
                  active={filter.year === year}
                >
                  {year}
                </Option>
              </li>
            ))}
          </ul>
        </div>
      )}
      <div className={styles.filterGroup}>
        <span className={styles.filterLabel}>Medan</span>
        <ul className={styles.filterList}>
          <li>
            <Option
              href={filterHref({ ...filter, terrain: null })}
              active={filter.terrain === null}
            >
              Semua
            </Option>
          </li>
          {Object.entries(TERRAIN_PARAMS).map(([param, type]) => (
            <li key={param}>
              <Option
                href={filterHref({ ...filter, terrain: filter.terrain === param ? null : param })}
                active={filter.terrain === param}
              >
                {TYPE_LABELS[type]}
              </Option>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}

function Option({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      scroll={false}
      className={styles.option}
      aria-current={active ? "true" : undefined}
    >
      {children}
    </Link>
  );
}
