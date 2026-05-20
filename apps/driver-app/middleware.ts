import { auth } from "@/auth";
export default auth((req) => {
    const isLoggedIn = !!req.auth;
    const { pathname } = req.nextUrl;

    if (!isLoggedIn && pathname.startsWith("/dashboard")) {
        return Response.redirect(new URL("/login", req.url));
    }
});

export const config = { matcher: ["/dashboard/:path*"] };
