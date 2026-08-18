import { FOOTER } from "../content";

export function Footer() {
  return (
    <footer className="border-t border-line/60 px-6 py-8 text-center text-sm text-muted/60">
      {FOOTER.texto}
    </footer>
  );
}
