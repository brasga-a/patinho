/** biome-ignore-all lint/suspicious/noExplicitAny: <explanation> */

import { type NextRequest, NextResponse } from "next/server";
import { auth } from "./lib/auth";

const PUBLIC_ROUTES = ["/entrar", "/support"];


export default async function middleware(request: NextRequest) {
	const { pathname } = request.nextUrl;

	// Busca session do Better Auth
	const session = await auth.api.getSession({
    headers: request.headers
  })

	if (!session) {
		if (!PUBLIC_ROUTES.includes(pathname)) {
			const url = request.nextUrl.clone();
			url.pathname = `/entrar`;
			return NextResponse.redirect(url);
		}
	}

  if (session){
    if (PUBLIC_ROUTES.includes(pathname)){
      const url = request.nextUrl.clone();
      url.pathname = `/`;
      return NextResponse.redirect(url)
    }
  }


	// Remove locale da pathname para verificação
	// const pathnameWithoutLocale = pathname.replace(/^\/(en|pt)/, "");
	// const isPublic = isPublicRoute(pathname);

	// // Se o usuário NÃO está autenticado
	// if (!session?.user) {
	//   // Se tentar acessar rota privada, redireciona para sign-in
	//   if (!isPublic) {
	//     const url = request.nextUrl.clone();
	//     url.pathname = `/${locale}/sign-in`;
	//     return NextResponse.redirect(url);
	//   }
	// }

	// // Se o usuário ESTÁ autenticado
	// if (session?.user) {
	//   if (pathname.includes("/sign-in")) console.log("debug");

	//   // Está autenticado e tentando acessar sign-in, redireciona para home
	//   if (
	//     pathnameWithoutLocale.includes("/sign-in") ||
	//     pathnameWithoutLocale.includes("/sign-up")
	//   ) {
	//     const url = request.nextUrl.clone();
	//     url.pathname = `/${locale}`;
	//     return NextResponse.redirect(url);
	//   }

	//   // Não completou first step e não está na página de first-step
	//   if (
	//     session.user.firstStepCompleted === false &&
	//     !pathnameWithoutLocale.includes("/first-step")
	//   ) {
	//     const url = request.nextUrl.clone();
	//     url.pathname = `/${locale}/first-step`;
	//     return NextResponse.redirect(url);
	//   }

	//   // Já completou first step e está tentando acessar first-step
	//   if (
	//     session.user.firstStepCompleted === true &&
	//     pathnameWithoutLocale.includes("/first-step")
	//   ) {
	//     const url = request.nextUrl.clone();
	//     url.pathname = `/${locale}`;
	//     return NextResponse.redirect(url);
	//   }
	// }

	// ==========================================
	// PROCESSAMENTO DO NEXT-INTL
	// ==========================================

	// ==========================================
	// HEADERS CUSTOMIZADOS
	// ==========================================
	// Adiciona headers de segurança
}

export const config = {
	matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
	runtime: "nodejs",
};
