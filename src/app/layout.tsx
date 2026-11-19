import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Vunimo — Apoio para a vida online",
    template: "%s · Vunimo",
  },
  description:
    "Apoio para adolescentes que passam por ciberbullying nas redes e nos jogos: pausa, desabafo, orientação e caminhos de apoio, no seu tempo.",
};

export const viewport: Viewport = {
  themeColor: "#5548d9",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" className="h-full antialiased" suppressHydrationWarning>
      <head>
        {/* Marca que o JS está ativo antes da pintura, para a abertura não "pular" de layout. */}
        <script dangerouslySetInnerHTML={{ __html: "document.documentElement.classList.add('js')" }} />
      </head>
      <body className="min-h-full bg-papel">{children}</body>
    </html>
  );
}
