import { auth } from "./auth";
import { NextResponse } from "next/server";

export default auth((req) => {
    const isLoggedIn = !!req.auth;
    const isProtected = req.nextUrl.pathname.startsWith("/dashboard") ||
        req.nextUrl.pathname.startsWith("/order") ||
        req.nextUrl.pathname.startsWith("/orders");

    if (isProtected && !isLoggedIn) {
        return NextResponse.redirect(new URL("/login", req.nextUrl));
    }
    return NextResponse.next();
});

export const config = {
    matcher: ["/((?!api|_next/static|_next/image|favicon.ico|manifest.json).*)"],
};
