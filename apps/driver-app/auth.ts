import NextAuth, { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";

const config: NextAuthConfig = {
    providers: [
        Credentials({
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                try {
                    const res = await fetch(
                        `${process.env.GATEWAY_URL}/api/v1/auth/login`,
                        {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ email: credentials?.email, password: credentials?.password }),
                        },
                    );
                    if (!res.ok) return null;
                    const data = await res.json();
                    const user = data?.data;
                    if (!user?.accessToken) return null;
                    if (!["DRIVER"].includes(user.role)) return null;
                    return { id: user.id, email: user.email, name: user.fullName, role: user.role, accessToken: user.accessToken };
                } catch {
                    return null;
                }
            },
        }),
    ],
    callbacks: {
        jwt({ token, user }) {
            if (user) {
                token.accessToken = (user as any).accessToken;
                token.role = (user as any).role;
            }
            return token;
        },
        session({ session, token }) {
            (session as any).accessToken = token.accessToken;
            (session.user as any).role = token.role;
            return session;
        },
    },
    pages: { signIn: "/login" },
    session: { strategy: "jwt" },
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const { handlers, auth, signIn, signOut } = NextAuth(config) as any;
