"use client";

import Link from "next/link";
import type { ComponentProps, MouseEvent } from "react";
import { useTransition } from "./TransitionProvider";

type Props = Omit<ComponentProps<typeof Link>, "href"> & {
  href: string;
  /** Chapter color of the destination, e.g. "var(--gunung)". */
  color?: string;
};

/**
 * A normal link that plays the page transition before navigating.
 * Modified clicks (new tab, etc.) and reduced motion fall back to plain navigation.
 */
export function TransitionLink({ href, color = "var(--hitam)", onClick, ...props }: Props) {
  const transition = useTransition();

  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    onClick?.(event);

    const modified = event.metaKey || event.ctrlKey || event.shiftKey || event.altKey;

    if (event.defaultPrevented || event.button !== 0 || modified || props.target === "_blank") {
      return;
    }

    if (transition !== null) {
      event.preventDefault();
      transition.navigate(href, color);
    }
  }

  return <Link href={href} onClick={handleClick} {...props} />;
}
