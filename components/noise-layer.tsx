"use client";

import { useEffect, useState } from "react";

export default function NoiseLayer() {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    setEnabled(true);
  }, []);

  if (!enabled) return null;

  return <div className="noise-layer" aria-hidden />;
}
