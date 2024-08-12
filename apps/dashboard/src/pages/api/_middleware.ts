import { NextRequest, NextResponse } from "next/server";

export async function OPTIONS(req: NextRequest) {
  try {
    if (req.method === "OPTIONS") {
      return NextResponse.json({})
    }
  } catch (error) {
    console.error(error)
    throw error
  }
}

// the list of all allowed origins
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:4200',
  'https://whatsmenu.com.br', 
  'https://www.whatsmenu.com.br', 
  'https://homosite.whatsmenu.com.br', 
];

export function middleware(req: NextRequest) {
    // retrieve the current response
    const res = NextResponse.next()
    // retrieve the HTTP "Origin" header 
    // from the incoming request
    const origin = req.headers.get("origin")

    // if the origin is an allowed one,
    // add it to the 'Access-Control-Allow-Origin' header
    if (origin && allowedOrigins.includes(origin)) {
      console.log(`include origin method: ${origin}`);
      res.headers.append('Access-Control-Allow-Origin', origin);
    } else {
      console.error(`origem ${origin} não encontrada`); 
    }

    // add the remaining CORS headers to the response
    res.headers.append('Access-Control-Allow-Credentials', "true")
    res.headers.append('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT')
    res.headers.append(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Versionß'
    )

    return res
}

// specify the path regex to apply the middleware to
export const config = {
    matcher: ['/api/:path*'],
}