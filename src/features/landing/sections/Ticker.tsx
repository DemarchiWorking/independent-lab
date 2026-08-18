import { Marquee } from "@/components/ui/Marquee";
import { TICKER_ITEMS } from "../content";

export function Ticker() {
  return (
    <section className="border-y border-line/60 bg-white/[0.02] py-5">
      <Marquee speedSeconds={30}>
        {TICKER_ITEMS.map((item) => (
          <span key={item} className="flex items-center gap-2.5 whitespace-nowrap text-sm font-bold text-muted">
            <span className="text-teal">✦</span> {item}
          </span>
        ))}
      </Marquee>
    </section>
  );
}
