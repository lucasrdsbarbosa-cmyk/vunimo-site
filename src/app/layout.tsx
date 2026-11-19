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
        {/*
          Antes da pintura: marca que o JS está ativo e decide se a abertura animada roda.
          Padrão = respeita "reduzir movimento" do sistema; a pessoa pode escolher outra coisa na página (fica salvo só no navegador).
        */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              "(function(){var d=document.documentElement;d.classList.add('js');var p=null;try{p=localStorage.getItem('vn-motion')}catch(e){}var r=window.matchMedia('(prefers-reduced-motion: reduce)').matches;if(p==='on'||(p!=='off'&&!r))d.classList.add('vn-motion')})()",
          }}
        />
      </head>
      <body className="min-h-full bg-papel">{children}</body>
    </html>
  );
}
