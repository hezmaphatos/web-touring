import { formatKm, odometerDigits } from "@/lib/format";
import styles from "./OdometerReadout.module.css";

/**
 * The small odometer in the nav: total kilometers ridden.
 * The home opening sequence lands its big odometer on this element.
 */
export function OdometerReadout({ km }: { km: number }) {
  const digits = odometerDigits(km);

  return (
    <span className={styles.readout} role="img" aria-label={`Total ${formatKm(km)} km`}>
      <span className={styles.frame} data-odometer-readout aria-hidden="true">
        {digits.split("").map((digit, index) => (
          <span key={index} className={styles.digit}>
            {digit}
          </span>
        ))}
      </span>
      <span className={styles.unit} aria-hidden="true">
        km
      </span>
    </span>
  );
}
