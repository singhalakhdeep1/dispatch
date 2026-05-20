import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { LoginSchema } from "@orderhub/shared";

export const { handlers, signIn, signOut, auth } = NextAuth({
    providers: [
        Credentials({
            name: "credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                const parsed = LoginSchema.safeParse(credentials);
                if (!parsed.success) return null;

                const res = await fetch(
                    `${process.env.NEXT_PUBLIC_GATEWAY_URL}/api/v1/auth/login`,
                    {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(parsed.data),
                    },
                );

                if (!res.ok) return null;

                const data = await res.json();
                return {
                    id: data.user.id,
                    email: data.user.email,
                    name: data.user.fullName,
                    role: data.user.role,
                    accessToken: data.token,
                };
            },
        }),
    ],
    callbacks: {
        jwt({ token, user }) {
            if (user) {
                token.accessToken = (user as any).accessToken;
                token.role = (user as any).role;
                token.id = user.id;
            }
            return token;
        },
        session({ session, token }) {
            session.user.id = token.id as string;
            (session as any).accessToken = token.accessToken;
            (session.user as any).role = token.role;
            return session;
        },
    },
    pages: {
        signIn: "/login",
        error: "/login",
    },
    session: { strategy: "jwt", maxAge: 7 * 24 * 60 * 60 },
});
