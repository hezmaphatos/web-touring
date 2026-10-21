import localFont from "next/font/local";

/*
 * Self-hosted variable fonts (OFL), subset to Latin and limited to the axis ranges the
 * design uses, so the first paint loads one 76 KB file instead of three larger ones.
 */

/** Display, headings, labels, data and UI. wdth 62–125 (velocity effect), wght 500–900. */
export const archivo = localFont({
  src: "./fonts/archivo-var.woff2",
  weight: "500 900",
  style: "normal",
  variable: "--font-archivo",
  display: "swap",
  declarations: [{ prop: "font-stretch", value: "62% 125%" }],
});

/** Story body text, optical sizes 14–28, wght 400–700. Loaded when text needs it. */
export const newsreader = localFont({
  src: [
    { path: "./fonts/newsreader-var.woff2", weight: "400 700", style: "normal" },
    { path: "./fonts/newsreader-italic-var.woff2", weight: "400 700", style: "italic" },
  ],
  variable: "--font-newsreader",
  display: "swap",
  preload: false,
});
