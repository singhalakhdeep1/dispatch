"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button, Card, CardContent, CardHeader, CardTitle, Input } from "@orderhub/ui";

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        setError("");

        const result = await signIn("credentials", {
            email,
            password,
            redirect: false,
        });

        setLoading(false);

        if (result?.error) {
            setError("Invalid email or password");
        } else {
            router.push("/dashboard");
        }
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Sign in to your account</CardTitle>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                    {error && (
                        <p className="rounded-md bg-red-50 px-4 py-2 text-sm text-red-600">{error}</p>
                    )}
                    <div className="space-y-1">
                        <label className="text-sm font-medium text-gray-700">Email</label>
                        <Input
                            type="email"
                            placeholder="you@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-sm font-medium text-gray-700">Password</label>
                        <Input
                            type="password"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    <Button type="submit" className="w-full" isLoading={loading}>
                        Sign In
                    </Button>
                    <p className="text-center text-sm text-gray-500">
                        No account?{" "}
                        <Link href="/register" className="font-medium text-orange-500 hover:underline">
                            Create one free
                        </Link>
                    </p>
                </form>
            </CardContent>
        </Card>
    );
}
