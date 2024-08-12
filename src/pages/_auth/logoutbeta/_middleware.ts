// import { NextResponse } from 'next/server'
// import type { NextRequest } from 'next/server'

// export async function middleware(request: NextRequest, response: NextResponse) {
//   const session = request.cookies["next-auth.session-token"];
//   if (session) {
//     return NextResponse.redirect(new URL("logoutbeta", request.url)).clearCookie(process.env.NODE_ENV === "development" ? "next-auth.session-token" : "__Secure-next-auth.session-token");
//   } else {
//     return NextResponse.redirect(new URL("/dashboard/request", process.env.NODE_ENV === "development" ? "http://0.0.0.0:3333" : "https://adm.whatsmenu.com.br"));
//   }
// }
export default function middleware() {}
