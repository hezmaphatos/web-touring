import { formatDateRange } from "@/lib/format";
import type { GarageItem } from "@/lib/types";
import styles from "./Garage.module.css";

/** Every modification as a ruled table; items without a hotspot appear only here. */
export function GarageTable({ items }: { items: GarageItem[] }) {
  return (
    <table className={styles.table}>
      <caption className="visually-hidden">Daftar modifikasi</caption>
      <thead>
        <tr>
          <th scope="col">Part</th>
          <th scope="col">Kategori</th>
          <th scope="col">Dipasang</th>
          <th scope="col">Catatan</th>
        </tr>
      </thead>
      <tbody>
        {items.map((item) => (
          <tr key={item.id}>
            <th scope="row" className={styles.partName}>
              {item.name}
            </th>
            <td data-label="Kategori">{item.category}</td>
            <td data-label="Dipasang">{formatDateRange(item.installed_at, null) ?? "–"}</td>
            <td data-label="Catatan" className={styles.note}>
              {item.description_html ? (
                <div dangerouslySetInnerHTML={{ __html: item.description_html }} />
              ) : (
                "–"
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
