"use client";

import { gsap } from "gsap";
import { Flip } from "gsap/Flip";
import { ScrollTrigger } from "gsap/ScrollTrigger";

// Registered once, client-side only.
if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger, Flip);
}

export { gsap, Flip, ScrollTrigger };
