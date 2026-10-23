"use client";

import { useEffect, useRef, useState } from "react";
import { animate } from "animejs";

interface AnimatedCounterProps {
  to: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
}

// Contador que anima de 0 até `to` quando entra na viewport (anime.js v4 —
// `animate()` sobre um objeto JS puro, não um elemento DOM, é o padrão
// suportado para animar valores numéricos arbitrários). Nunca inicia se o
// visitante pediu `prefers-reduced-motion` — mostra o valor final direto.
export function AnimatedCounter({ to, duration = 1400, prefix = "", suffix = "", decimals = 0 }: AnimatedCounterProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const startedRef = useRef(false);
  const [value, setValue] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setValue(to);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting || startedRef.current) return;
        startedRef.current = true;
        const counter = { val: 0 };
        animate(counter, {
          val: to,
          duration,
          ease: "outExpo",
          onUpdate: () => setValue(counter.val),
        });
        observer.disconnect();
      },
      { threshold: 0.4 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [to, duration]);

  return (
    <span ref={ref}>
      {prefix}
      {decimals > 0 ? value.toFixed(decimals) : Math.round(value)}
      {suffix}
    </span>
  );
}
