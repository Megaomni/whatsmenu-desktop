import axios from "axios";
import { withAuth } from "next-auth/middleware"
import { getSession, signOut } from "next-auth/react"
import { NextRequest, NextResponse } from "next/server";
import { apiRoute } from "../../../utils/wm-functions";

export default withAuth(
    // `withAuth` augments your `Request` with the user's token.
    //@ts-ignore
    async function middleware(req: NextRequest, res: NextResponse) {
        //@ts-ignore
        const session: Session = req.nextauth.token;
        try {
            switch (session?.user.controls?.type) {
                case "adm":
                case "manager":
                case "support":
                case "seller":
                case "test":
                    return NextResponse.redirect(new URL("/adm/client", req.url))
                default:
                    return NextResponse.redirect(new URL("/dashboard/request", req.url))
            }
        } catch (error) {
            console.error(error);
        }
    }
)