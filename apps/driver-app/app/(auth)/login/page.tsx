"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button, Card, CardContent, CardHeader, CardTitle, Input } from "@orderhub/ui";

export default function DriverLoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        setError("");

        const result = await signIn("credentials", { email, password, redirect: false });
        setLoading(false);

        if (result?.error) setError("Invalid credentials or not a driver account");
        else router.push("/dashboard");
    }

    return (
        <Card>
            <CardHeader><CardTitle>Driver Sign In</CardTitle></CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                    {error && <p className="rounded bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
                    <Input type="email" placeholder="Email" value={email}
                        onChange={(e) => setEmail(e.target.value)} required />
                    <Input type="password" placeholder="Password" value={password}
                        onChange={(e) => setPassword(e.target.value)} required />
                    <Button type="submit" className="w-full" isLoading={loading}>Sign In</Button>
                </form>
            </CardContent>
        </Card>
    );
}
