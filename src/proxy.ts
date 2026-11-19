import { NextResponse, type NextRequest } from "next/server";

/**
 * Checagem otimista: sem cookie de sessão, nem tenta abrir áreas privadas.
 * A autorização de verdade (sessão válida + papel + dono do dado) acontece no
 * servidor, em src/lib/dal.ts, em toda página e Server Action.
 */
export function proxy(request: NextRequest) {
  if (!request.cookies.has("vunimo_session")) {
    const url = request.nextUrl.clone();
    url.pathname = "/entrar";
    url.search = `?next=${encodeURIComponent(request.nextUrl.pathname)}`;
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/app/:path*", "/pro/:path*", "/admin/:path*"],
};
