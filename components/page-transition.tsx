"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

export default function PageTransition() {
  const pathname = usePathname();

  useEffect(() => {
    const body = document.body;
    body.dataset.lastTransitionFrom = pathname;
    body.classList.add("page-transitioning");
    const timeout = window.setTimeout(() => {
      body.classList.remove("page-transitioning");
    }, 280);
    return () => {
      window.clearTimeout(timeout);
      if (body.dataset.lastTransitionFrom === pathname) {
        delete body.dataset.lastTransitionFrom;
      }
      body.classList.remove("page-transitioning");
    };
  }, [pathname]);

  return null;
}
