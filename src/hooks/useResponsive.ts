"use client";

import { useEffect, useState } from "react";

/** Matches Tailwind `md` / custom `pos` — tablet & up get sidebar layout. */
const POS_BREAKPOINT_PX = 768;

export function useResponsive() {
  const [isMobile, setIsMobile] = useState(true);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${POS_BREAKPOINT_PX - 1}px)`);

    const update = () => {
      setIsMobile(mq.matches);
      setReady(true);
    };

    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  return {
    isMobile,
    isDesktop: !isMobile,
    ready,
  };
}
