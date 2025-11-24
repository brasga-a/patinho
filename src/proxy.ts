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


	
}

export const config = {
	matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
