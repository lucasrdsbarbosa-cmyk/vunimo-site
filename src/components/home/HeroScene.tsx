"use client";

import Link from "next/link";
import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { NUCLEI } from "@/lib/content";
import { Icon, type IconName } from "@/components/Icons";
import { SYMBOL_PATH_A, SYMBOL_PATH_B, SYMBOL_STROKE, SYMBOL_VIEWBOX, VunimoSymbol } from "@/components/Logo";

gsap.registerPlugin(ScrollTrigger, useGSAP);

const ICONS: Record<string, IconName> = { pausa: "pause", desabafar: "chat", orientar: "compass", conectar: "people" };

// Onde ficam as bordas externas dos traços dentro da caixa do símbolo (0–1), medidas no SVG original.
const A_OUTER = { x: (355.4 - SYMBOL_STROKE / 2 - 272) / 480, y: (323 - SYMBOL_STROKE / 2 - 272) / 480 };
const B_OUTER = { x: (668.6 + SYMBOL_STROKE / 2 - 272) / 480, y: (701 + SYMBOL_STROKE / 2 - 272) / 480 };
const IRIS = "#5548d9";

/** Posição de um elemento dentro de um ancestral, ignorando transforms (só layout). */
function offsetWithin(el: HTMLElement, ancestor: HTMLElement) {
  let x = 0;
  let y = 0;
  let node: HTMLElement | null = el;
  while (node && node !== ancestor) {
    x += node.offsetLeft;
    y += node.offsetTop;
    node = node.offsetParent as HTMLElement | null;
  }
  return { x, y };
}

type Account = { href: string; label: string } | null;

/**
 * Abertura "Duas formas abrem espaço" (roteiro em docs/plano-v2.md).
 * Sem JS ou com movimento reduzido, o mesmo conteúdo aparece em fluxo normal.
 */
export function HeroScene({ account }: { account: Account }) {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(
        {
          desktop: "(min-width: 768px) and (prefers-reduced-motion: no-preference)",
          mobile: "(max-width: 767px) and (prefers-reduced-motion: no-preference)",
        },
        (ctx) => {
          const el = root.current!;
          const { desktop } = ctx.conditions as { desktop: boolean; mobile: boolean };
          const q = gsap.utils.selector(el);
          const stage = q(".vn-stage")[0] as HTMLElement;
          const strokeA = q(".vn-stroke-a")[0] as HTMLElement;
          const strokeB = q(".vn-stroke-b")[0] as HTMLElement;
          const frame = q(".vn-frame")[0] as HTMLElement;
          const wordmark = q(".vn-wordmark")[0] as HTMLElement;
          const headerLogo = document.querySelector<HTMLElement>("[data-header-logo]");
          const headerWord = headerLogo?.querySelector<HTMLElement>("span") ?? null;
          const header = document.querySelector<HTMLElement>("header");

          el.dataset.motion = "";
          if (headerLogo) gsap.set(headerLogo, { autoAlpha: 0 });

          const size = () => strokeA.offsetWidth; // tamanho inicial da caixa do símbolo
          const endSize = () => (desktop ? Math.min(150, window.innerWidth * 0.12) : 84);
          const k = () => endSize() / size();
          const pad = desktop ? 14 : 10;
          const spread = () => size() * (desktop ? 0.2 : 0.16);

          const frameBox = () => {
            const o = offsetWithin(frame, stage);
            return { x: o.x, y: o.y, w: frame.offsetWidth, h: frame.offsetHeight };
          };
          const homeA = () => offsetWithin(strokeA, stage);
          const homeB = () => offsetWithin(strokeB, stage);

          // Entrada: os traços se desenham (só no carregamento, não depende da rolagem).
          const paths = el.querySelectorAll<SVGPathElement>(".vn-stroke path");
          gsap.fromTo(
            paths,
            { strokeDasharray: 1, strokeDashoffset: 1 },
            { strokeDashoffset: 0, duration: 1.1, ease: "power3.out", stagger: 0.18, delay: 0.1 },
          );

          const tl = gsap.timeline({
            defaults: { ease: "power2.inOut" },
            scrollTrigger: {
              trigger: el,
              start: () => `top top+=${header?.offsetHeight ?? 0}`,
              end: () => `+=${window.innerHeight * (desktop ? 2.3 : 1.6)}`,
              scrub: desktop ? 0.8 : 0.5,
              pin: stage,
              anticipatePin: 1,
              invalidateOnRefresh: true,
            },
          });

          tl.addLabel("abrir", 0.6)
            // 1. Abrir espaço: as formas se afastam, o texto do pôster sai
            .to(strokeA, { x: () => -spread() * 0.5, y: () => -spread(), duration: 2.6 }, "abrir")
            .to(strokeB, { x: () => spread() * 0.5, y: () => spread() * 0.8, duration: 2.6 }, "abrir")
            .to(q(".vn-copy-fade"), { autoAlpha: 0, y: -40, stagger: 0.12, duration: 1.2, ease: "power2.in" }, "abrir+=0.2")
            .fromTo(q(".vn-mid-1"), { autoAlpha: 0, scale: 0.94 }, { autoAlpha: 1, scale: 1, duration: 1.4, ease: "power2.out" }, "abrir+=1.2")
            .to(q(".vn-deco-1"), { yPercent: -60, duration: 9.4, ease: "none" }, 0)
            .to(q(".vn-deco-2"), { yPercent: -25, xPercent: -10, duration: 9.4, ease: "none" }, 0)

            // 2. A palavra "vunimo" sobe e vira o logo do topo
            .addLabel("dock", 3.4)
            .to(
              wordmark,
              {
                x: () => {
                  if (!headerWord) return 0;
                  const r = headerWord.getBoundingClientRect();
                  return r.left - stage.getBoundingClientRect().left - offsetWithin(wordmark, stage).x;
                },
                y: () => {
                  if (!headerWord) return -200;
                  const r = headerWord.getBoundingClientRect();
                  return r.top - (header?.offsetHeight ?? 0) - offsetWithin(wordmark, stage).y;
                },
                scale: () => (headerWord ? headerWord.offsetWidth / wordmark.offsetWidth : 0.3),
                duration: 1.5,
              },
              "dock",
            )
            .to(wordmark, { autoAlpha: 0, duration: 0.3 }, "dock+=1.3")
            .to(headerLogo ?? {}, { autoAlpha: 1, duration: 0.3 }, "dock+=1.3")

            // 3. Atravessar: o pôster se recolhe por trás das formas, que mudam de cor
            .addLabel("atravessar", 5)
            .to(q(".vn-mid-1"), { autoAlpha: 0, y: -30, duration: 0.6 }, "atravessar")
            .to(
              q(".vn-poster"),
              {
                clipPath: () => {
                  const W = stage.offsetWidth;
                  const H = stage.offsetHeight;
                  const cx = homeA().x + size() / 2;
                  const cy = homeA().y + size() / 2;
                  const t = (cy / H) * 100;
                  const l = (cx / W) * 100;
                  return `inset(${t}% ${100 - l}% ${100 - t}% ${l}% round 32px)`;
                },
                duration: 2,
                ease: "power3.inOut",
              },
              "atravessar+=0.2",
            )
            .to(q(".vn-poster"), { autoAlpha: 0, duration: 0.5, ease: "power1.in" }, "atravessar+=1.7")
            .to(q(".vn-stroke-a path"), { attr: { stroke: IRIS }, duration: 1 }, "atravessar+=0.6")
            .to(q(".vn-stroke-b path"), { attr: { stroke: IRIS }, duration: 1 }, "atravessar+=0.9")
            .fromTo(q(".vn-mid-2"), { autoAlpha: 0, y: 20 }, { autoAlpha: 1, y: 0, duration: 0.8 }, "atravessar+=1.3")
            .to(q(".vn-mid-2"), { autoAlpha: 0, y: -20, duration: 0.6 }, "atravessar+=2.6")

            // 4. Encaixe: as formas viram os cantos da moldura dos quatro caminhos
            .addLabel("encaixe", 7.3)
            .to(
              strokeA,
              {
                x: () => frameBox().x - pad - A_OUTER.x * endSize() - homeA().x,
                y: () => frameBox().y - pad - A_OUTER.y * endSize() - homeA().y,
                scale: () => k(),
                duration: 2,
                ease: "power3.inOut",
              },
              "encaixe",
            )
            .to(
              strokeB,
              {
                x: () => frameBox().x + frameBox().w + pad - B_OUTER.x * endSize() - homeB().x,
                y: () => frameBox().y + frameBox().h + pad - B_OUTER.y * endSize() - homeB().y,
                scale: () => k(),
                duration: 2,
                ease: "power3.inOut",
              },
              "encaixe",
            )
            .fromTo(q(".vn-frame-head"), { autoAlpha: 0, y: 24 }, { autoAlpha: 1, y: 0, duration: 0.9, ease: "power2.out" }, "encaixe+=0.9")
            .fromTo(
              q(".vn-tile"),
              { autoAlpha: 0, y: 28, scale: 0.96 },
              { autoAlpha: 1, y: 0, scale: 1, duration: 0.8, stagger: 0.22, ease: "back.out(1.6)" },
              "encaixe+=1.3",
            )
            .to({}, { duration: 0.8 }); // respiro antes de soltar a cena

          return () => {
            delete el.dataset.motion;
            if (headerLogo) gsap.set(headerLogo, { clearProps: "opacity,visibility" });
          };
        },
      );
    },
    { scope: root },
  );

  return (
    <section ref={root} className="vn-hero" aria-labelledby="hero-title">
      <div className="vn-stage">
        {/* camada de fundo: formas lima que andam mais devagar (profundidade) */}
        <div aria-hidden="true" className="vn-deco vn-deco-1" />
        <div aria-hidden="true" className="vn-deco vn-deco-2" />

        {/* camada 1: pôster Íris — enquadramento forte da marca */}
        <div className="vn-poster on-iris">
          <div className="vn-poster-inner">
            <div className="vn-copy">
              <p className="vn-wordmark" aria-hidden="true">
                vunimo
              </p>
              <p className="vn-copy-fade vn-eyebrow">Apoio para a vida online</p>
              <h1 id="hero-title" className="vn-copy-fade vn-title">
                Presença que abre caminhos.
              </h1>
              <p className="vn-copy-fade vn-lede">
                Para adolescentes que passam por ciberbullying nas redes e nos jogos: uma pausa, um lugar para
                desabafar, orientação clara e gente para apoiar.
              </p>
              <div className="vn-copy-fade vn-ctas">
                <Link href="/comecar" className="btn btn-lima vn-press px-7 text-lg">
                  Começar agora
                </Link>
                {account ? (
                  <Link href={account.href} className="btn vn-press bg-white px-7 text-lg text-iris hover:bg-nevoa">
                    {account.label}
                  </Link>
                ) : (
                  <>
                    <Link href="/cadastro" className="btn vn-press bg-white px-7 text-lg text-iris hover:bg-nevoa">
                      Criar conta
                    </Link>
                    <Link href="/entrar" className="vn-press inline-flex min-h-12 items-center px-3 font-semibold text-white underline underline-offset-4">
                      Já tenho conta
                    </Link>
                  </>
                )}
              </div>
              <p className="vn-copy-fade vn-note">Pausa, Orientação e Apoio funcionam sem cadastro.</p>
            </div>
            {/* símbolo estático: usado sem JS ou com movimento reduzido */}
            <VunimoSymbol variant="negative" className="vn-static-symbol" />
          </div>
        </div>

        {/* frases que aparecem no espaço aberto pelas formas */}
        <div className="vn-mid" aria-hidden="true">
          <p className="vn-mid-1">
            Aconteceu algo ruim
            <br />
            nas redes ou num jogo?
          </p>
          <p className="vn-mid-2">
            Você não precisa ter
            <br />
            todas as respostas agora.
          </p>
        </div>

        {/* camada 3: a moldura onde as formas se encaixam */}
        <div className="vn-frame-wrap">
          <div className="vn-frame">
            <span aria-hidden="true" className="vn-bracket vn-bracket-a">
              <svg viewBox={SYMBOL_VIEWBOX}>
                <path d={SYMBOL_PATH_A} />
              </svg>
            </span>
            <span aria-hidden="true" className="vn-bracket vn-bracket-b">
              <svg viewBox={SYMBOL_VIEWBOX}>
                <path d={SYMBOL_PATH_B} />
              </svg>
            </span>
            <div className="vn-frame-head">
              <h2 className="vn-frame-title">Quatro caminhos. Você escolhe por onde começar.</h2>
              <p className="vn-frame-lede">Não existe ordem certa. Comece pelo que fizer sentido agora.</p>
            </div>
            <ul className="vn-tiles">
              {NUCLEI.map((n) => (
                <li key={n.key} className="vn-tile">
                  <Link href={n.href} className="vn-tile-link vn-card">
                    <span className="vn-tile-icon">
                      <Icon name={ICONS[n.key]} className="h-6 w-6" />
                    </span>
                    <span className="vn-tile-step">{n.step}</span>
                    <span className="vn-tile-name">{n.name}</span>
                    <span className="vn-tile-desc">{n.short}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* camada da frente: os dois traços originais do símbolo, animados separadamente */}
        <div aria-hidden="true" className="vn-stroke vn-stroke-a">
          <svg viewBox={SYMBOL_VIEWBOX}>
            <path d={SYMBOL_PATH_A} stroke="#ffffff" pathLength={1} />
          </svg>
        </div>
        <div aria-hidden="true" className="vn-stroke vn-stroke-b">
          <svg viewBox={SYMBOL_VIEWBOX}>
            <path d={SYMBOL_PATH_B} stroke="#d9f075" pathLength={1} />
          </svg>
        </div>
      </div>
    </section>
  );
}
