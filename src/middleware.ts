import { NextRequest, NextResponse } from 'next/server';

export const config = {
  matcher: [
    /*
     * Match all paths except for:
     * 1. /api routes
     * 2. /_next (Next.js internals)
     * 3. /_static (inside /public)
     * 4. /logos (static images)
     * 5. all root files inside /public (e.g. /favicon.ico)
     */
    '/((?!api/|_next/|_static/|logos/|_vercel|[\\w-]+\\.\\w+).*)',
  ],
};

export default async function middleware(req: NextRequest) {
  const url = req.nextUrl;
  let hostname = req.headers.get('host')!;

  // 1. Definição do Domínio Raiz
  // Se a env não estiver definida, usa cycleapp.shop como fallback seguro
  const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'cycleapp.shop';

  // 2. Normalização do Hostname (para desenvolvimento local)
  // master.localhost:3000 -> master.cycleapp.shop
  // client.localhost:3000 -> client.cycleapp.shop
  if (hostname.includes('localhost')) {
    hostname = hostname.replace('.localhost:3000', `.${rootDomain}`);
  }

  const searchParams = req.nextUrl.searchParams.toString();
  const path = `${url.pathname}${
    searchParams.length > 0 ? `?${searchParams}` : ""
  }`;

  console.log(`[Middleware] Host: ${hostname}, Path: ${path}`);

  // 3. Rotas Públicas (sem reescrita)
  // Permitir acesso à documentação e formulários públicos
  if (url.pathname.startsWith('/docs') || url.pathname.startsWith('/f/')) {
    return NextResponse.next();
  }

  // 4. Lógica de Roteamento por Subdomínio

  // --- Cenário A: Painel Master/Admin (master.cycleapp.shop) ---
  if (hostname === `master.${rootDomain}`) {
    // Se a rota já começa com /master, mantém (evita loop)
    if (url.pathname.startsWith('/master')) {
       return NextResponse.rewrite(new URL(path, req.url));
    }
    // Reescreve para a pasta /app/master
    return NextResponse.rewrite(
      new URL(`/master${path === "/" ? "" : path}`, req.url)
    );
  }

  // --- Cenário B: Landing Page / Home (cycleapp.shop ou www) ---
  if (hostname === rootDomain || hostname === `www.${rootDomain}`) {
    // Reescreve para a pasta /app/home
    return NextResponse.rewrite(new URL(`/home${path}`, req.url));
  }

  // --- Cenário C: App do Cliente (Subdomínio ou Domínio Personalizado) ---
  // Qualquer outro host que não seja master, www ou raiz cai aqui.
  
  // Lógica para extrair o "slug" do cliente para passar no header (opcional, mas útil)
  const currentHost = hostname;
  let clientSlug = '';

  if (currentHost.endsWith(`.${rootDomain}`)) {
      // É um subdomínio (ex: loja1.cycleapp.shop)
      clientSlug = currentHost.replace(`.${rootDomain}`, '');
  } else {
      // É um domínio personalizado (ex: minhaloja.com)
      clientSlug = currentHost; // O slug é o próprio domínio, ou o backend resolve depois
  }

  console.log(`[Middleware] Client Route detected. Slug/Domain: ${clientSlug}`);

  // Se a rota já começa com /client, mantém
  if (url.pathname.startsWith('/client')) {
      const response = NextResponse.rewrite(new URL(path, req.url));
      response.headers.set('x-client-slug', clientSlug);
      return response;
  }

  // Reescreve para a pasta /app/client
  const response = NextResponse.rewrite(
    new URL(`/client${path === "/" ? "" : path}`, req.url)
  );
  response.headers.set('x-client-slug', clientSlug);
  
  return response;
}
