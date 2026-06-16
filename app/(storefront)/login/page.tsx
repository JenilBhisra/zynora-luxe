"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { Loader2 } from "lucide-react";
import { logInWithEmail, logInWithGoogle } from "@/lib/auth.client";
import { consumeRedirectAfterLogin } from "@/lib/auth-flow";

function LoginContent() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const urlError = searchParams.get("error");
    const redirectTo = searchParams.get("redirect");
    const message = searchParams.get("message");

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState(urlError === "unauthorized" ? "Access Denied." : "");
    const [isLoading, setIsLoading] = useState(false);

    const finalizeLogin = (userEmail?: string | null) => {
        const isAdmin = userEmail?.toLowerCase() === "krishnadiamond404@gmail.com";
        const defaultDest = isAdmin ? "/admin" : "/account";
        const destination = consumeRedirectAfterLogin(redirectTo || defaultDest);
        router.replace(destination);
        router.refresh();
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError("");

        try {
            const user = await logInWithEmail(email, password);
            finalizeLogin(user?.email);
        } catch (err: any) {
            console.error("Login error:", err);
            setError(err.message || "Invalid email or password.");
            setIsLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        setIsLoading(true);
        setError("");
        try {
            const user = await logInWithGoogle();
            finalizeLogin(user?.email);
        } catch (err: any) {
            console.error("Google Login error:", err);
            setError(err.message || "Failed to sign in with Google.");
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-white flex flex-col justify-center items-center py-12 sm:px-6 lg:px-8">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="sm:mx-auto sm:w-full sm:max-w-md px-4"
            >
                <div className="text-center mb-10">
                    <Link href="/" className="inline-block flex flex-col items-center">
                        <Image src="/assets/logo.png" alt="ZYNORA LUXE" width={160} height={50} className="object-contain" />
                    </Link>
                </div>

                <div className="bg-white py-8 px-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] sm:rounded-2xl border border-gray-100/50 sm:px-10">
                    <div className="text-2xl font-heading !text-gray-900 text-center font-bold tracking-wide mb-8">
                        Welcome Back
                    </div>

                    {message === "checkout_required" && (
                        <div className="mb-5 bg-amber-50 text-amber-700 text-sm p-3 rounded-lg text-center border border-amber-200">
                            Please login to continue checkout
                        </div>
                    )}

                    <form className="space-y-6" onSubmit={handleLogin}>
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="bg-red-50 text-red-600 text-sm p-3 rounded-lg text-center border border-red-100"
                            >
                                {error}
                            </motion.div>
                        )}

                        <div>
                            <label className="block text-xs font-semibold tracking-wider text-gray-500 uppercase mb-2">
                                Email Address
                            </label>
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="appearance-none block w-full px-4 py-3 border border-gray-200 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-black focus:border-[#111111] sm:text-sm transition-colors text-black"
                                placeholder="Enter your email"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold tracking-wider text-gray-500 uppercase mb-2">
                                Password
                            </label>
                            <input
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="appearance-none block w-full px-4 py-3 border border-gray-200 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-black focus:border-[#111111] sm:text-sm transition-colors text-black"
                                placeholder="Enter your password"
                            />
                        </div>

                        <div>
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm font-semibold text-white bg-[#111111] hover:bg-black focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black transition-colors disabled:opacity-70 disabled:cursor-not-allowed uppercase tracking-wider text-sm"
                            >
                                {isLoading ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                    "Sign In"
                                )}
                            </button>
                        </div>
                    </form>

                    <div className="mt-6">
                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-gray-200" />
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="px-2 bg-white text-gray-500">Or continue with</span>
                            </div>
                        </div>

                        <div className="mt-6">
                            <button
                                onClick={handleGoogleLogin}
                                disabled={isLoading}
                                className="w-full flex justify-center items-center py-3 px-4 border border-gray-300 rounded-lg shadow-sm bg-white text-sm font-semibold text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black transition-colors disabled:opacity-70"
                            >
                                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                                </svg>
                                Google
                            </button>
                        </div>
                    </div>

                    <div className="mt-8 text-center text-sm text-gray-500">
                        Don't have an account?{" "}
                        <Link href={`/signup${redirectTo ? `?redirect=${redirectTo}` : ""}`} className="font-semibold text-[#111111] hover:underline transition-colors">
                            Create one
                        </Link>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}

export default function LoginPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-white flex justify-center items-center">
                <Loader2 className="w-10 h-10 animate-spin text-[#111111]" />
            </div>
        }>
            <LoginContent />
        </Suspense>
    );
}
