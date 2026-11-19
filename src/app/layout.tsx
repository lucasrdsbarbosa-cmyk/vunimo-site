import type { Metadata, Viewport } from "next";
import "./globals.css";
import { PressFeedback } from "@/components/PressFeedback";
import { MotionRoot } from "@/components/motion/MotionRoot";

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
          Antes da pintura: marca que o JS está ativo e liga a abertura animada (sempre; sem JS fica a versão estática).
        */}
        <script
          dangerouslySetInnerHTML={{
            __html: "document.documentElement.classList.add('js','vn-motion')",
          }}
        />
      </head>
      <body className="min-h-full bg-papel">
        <MotionRoot>{children}</MotionRoot>
        <PressFeedback />
      </body>
    </html>
  );
}
