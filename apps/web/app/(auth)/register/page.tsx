"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { Button, Card, CardContent, CardHeader, CardTitle, Input } from "@orderhub/ui";
import { apiClient } from "@/lib/api-client";

export default function RegisterPage() {
    const router = useRouter();
    const [form, setForm] = useState({ email: "", password: "", fullName: "", phone: "" });
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            await apiClient.post("/v1/auth/register", { ...form, role: "CUSTOMER" });

            await signIn("credentials", {
                email: form.email,
                password: form.password,
                redirect: false,
            });

            router.push("/dashboard");
        } catch (err: any) {
            setError(err?.response?.data?.message ?? "Registration failed");
        } finally {
            setLoading(false);
        }
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Create an account</CardTitle>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                    {error && (
                        <p className="rounded-md bg-red-50 px-4 py-2 text-sm text-red-600">{error}</p>
                    )}
                    <Input
                        placeholder="Full name"
                        value={form.fullName}
                        onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                        required
                    />
                    <Input
                        type="email"
                        placeholder="Email address"
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                        required
                    />
                    <Input
                        type="password"
                        placeholder="Password (min 8 chars)"
                        value={form.password}
                        onChange={(e) => setForm({ ...form, password: e.target.value })}
                        required
                    />
                    <Input
                        type="tel"
                        placeholder="Phone number (optional)"
                        value={form.phone}
                        onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    />
                    <Button type="submit" className="w-full" isLoading={loading}>
                        Create Account
                    </Button>
                    <p className="text-center text-sm text-gray-500">
                        Already have an account?{" "}
                        <Link href="/login" className="font-medium text-orange-500 hover:underline">
                            Sign in
                        </Link>
                    </p>
                </form>
            </CardContent>
        </Card>
    );
}
