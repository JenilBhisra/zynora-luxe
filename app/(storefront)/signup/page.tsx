"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { Loader2, ArrowLeft, Mail, Shield } from "lucide-react";
import { signUpWithEmail, logInWithGoogle } from "@/lib/auth.client";
import { consumeRedirectAfterLogin } from "@/lib/auth-flow";

function SignupContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const redirectTo = searchParams.get("redirect");

    // Step: "form" | "otp" | "success"
    const [step, setStep] = useState<"form" | "otp" | "success">("form");

    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [otp, setOtp] = useState("");
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const finalizeLogin = () => {
        const destination = consumeRedirectAfterLogin(redirectTo || "/");
        window.location.href = destination;
    };

    // Step 1: Validate form and send OTP
    const handleSendOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (password !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        }
        if (password.length < 6) {
            setError("Password must be at least 6 characters.");
            return;
        }

        setIsLoading(true);

        try {
            const res = await fetch("/api/auth/send-otp", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
            });

            const data = await res.json();
            if (!res.ok) {
                setError(data.error || "Failed to send OTP.");
                setIsLoading(false);
                return;
            }

            setStep("otp");
            setIsLoading(false);
        } catch (err: any) {
            setError(err.message || "Something went wrong.");
            setIsLoading(false);
        }
    };

    // Step 2: Verify OTP, then create Firebase account
    const handleVerifyOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setIsLoading(true);

        try {
            // Verify OTP with backend
            const res = await fetch("/api/auth/verify-otp", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, otp }),
            });

            const data = await res.json();
            if (!res.ok) {
                setError(data.error || "Invalid OTP.");
                setIsLoading(false);
                return;
            }

            // OTP verified! Now create the Firebase account
            const user = await signUpWithEmail(email, password);

            // Update display name via Firebase
            const { updateProfile } = await import("firebase/auth");
            await updateProfile(user, { displayName: name });

            // AuthProvider's onAuthStateChange will sync the session cookie
            setStep("success");
            setTimeout(() => {
                finalizeLogin();
            }, 1500);
        } catch (err: any) {
            console.error("Signup error:", err);
            const code = err?.code || "";
            if (code === "auth/email-already-in-use") {
                setError("An account with this email already exists. Please sign in instead.");
            } else if (code === "auth/weak-password") {
                setError("Password must be at least 6 characters.");
            } else {
                setError(err.message || "Failed to create account.");
            }
            setIsLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        setIsLoading(true);
        setError("");
        try {
            await logInWithGoogle();
            finalizeLogin();
        } catch (err: any) {
            setError(err.message || "Failed to sign in with Google.");
            setIsLoading(false);
        }
    };

    const handleResendOtp = async () => {
        setError("");
        setIsLoading(true);
        try {
            const res = await fetch("/api/auth/send-otp", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
            });
            const data = await res.json();
            if (!res.ok) {
                setError(data.error || "Failed to resend OTP.");
            }
        } catch {
            setError("Failed to resend OTP.");
        }
        setIsLoading(false);
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
                    <AnimatePresence mode="wait">
                        {/* ── STEP 1: Registration Form ── */}
                        {step === "form" && (
                            <motion.div
                                key="form"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ duration: 0.3 }}
                            >
                                <div className="text-2xl font-heading !text-gray-900 text-center font-bold tracking-wide mb-8">
                                    Create Account
                                </div>

                                <form className="space-y-5" onSubmit={handleSendOtp}>
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
                                            Your Name
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            className="appearance-none block w-full px-4 py-3 border border-gray-200 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-black focus:border-[#111111] sm:text-sm transition-colors text-black"
                                            placeholder="Enter your name"
                                        />
                                    </div>

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
                                            placeholder="Create a password"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold tracking-wider text-gray-500 uppercase mb-2">
                                            Confirm Password
                                        </label>
                                        <input
                                            type="password"
                                            required
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            className="appearance-none block w-full px-4 py-3 border border-gray-200 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-black focus:border-[#111111] sm:text-sm transition-colors text-black"
                                            placeholder="Confirm your password"
                                        />
                                    </div>

                                    <div>
                                        <button
                                            type="submit"
                                            disabled={isLoading}
                                            className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-lg shadow-sm font-semibold text-white bg-[#111111] hover:bg-black focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black transition-colors disabled:opacity-70 disabled:cursor-not-allowed uppercase tracking-wider text-sm"
                                        >
                                            {isLoading ? (
                                                <Loader2 className="w-5 h-5 animate-spin" />
                                            ) : (
                                                <>
                                                    <Mail size={16} />
                                                    Send Verification Code
                                                </>
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
                                            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="none">
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
                                    Already have an account?{" "}
                                    <Link href={`/login${redirectTo ? `?redirect=${redirectTo}` : ""}`} className="font-semibold text-[#111111] hover:underline transition-colors">
                                        Sign in
                                    </Link>
                                </div>
                            </motion.div>
                        )}

                        {/* ── STEP 2: OTP Verification ── */}
                        {step === "otp" && (
                            <motion.div
                                key="otp"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                transition={{ duration: 0.3 }}
                            >
                                <button
                                    onClick={() => { setStep("form"); setError(""); setOtp(""); }}
                                    className="flex items-center gap-1 text-sm text-gray-500 hover:text-black transition-colors mb-6"
                                >
                                    <ArrowLeft size={14} />
                                    Back
                                </button>

                                <div className="text-center mb-6">
                                    <div className="w-16 h-16 bg-[#111]/5 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <Shield size={28} className="text-[#111111]" />
                                    </div>
                                    <h2 className="text-2xl font-heading !text-gray-900 font-bold tracking-wide">
                                        Enter Verification Code
                                    </h2>
                                    <p className="text-sm text-gray-500 mt-2">
                                        We&apos;ve sent a 6-digit code to<br />
                                        <span className="font-semibold text-gray-700">{email}</span>
                                    </p>
                                </div>

                                <form className="space-y-6" onSubmit={handleVerifyOtp}>
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
                                        <input
                                            type="text"
                                            required
                                            maxLength={6}
                                            value={otp}
                                            onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                                            className="appearance-none block w-full px-4 py-4 border border-gray-200 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-black focus:border-[#111111] text-2xl text-center tracking-[0.5em] font-mono text-black"
                                            placeholder="000000"
                                            autoFocus
                                        />
                                    </div>

                                    <div>
                                        <button
                                            type="submit"
                                            disabled={isLoading || otp.length !== 6}
                                            className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-lg shadow-sm font-semibold text-white bg-[#111111] hover:bg-black focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black transition-colors disabled:opacity-70 disabled:cursor-not-allowed uppercase tracking-wider text-sm"
                                        >
                                            {isLoading ? (
                                                <Loader2 className="w-5 h-5 animate-spin" />
                                            ) : (
                                                "Verify & Create Account"
                                            )}
                                        </button>
                                    </div>
                                </form>

                                <div className="mt-6 text-center text-sm text-gray-500">
                                    Didn&apos;t receive the code?{" "}
                                    <button
                                        onClick={handleResendOtp}
                                        disabled={isLoading}
                                        className="font-semibold text-[#111111] hover:underline transition-colors disabled:opacity-50"
                                    >
                                        Resend
                                    </button>
                                </div>
                            </motion.div>
                        )}

                        {/* ── STEP 3: Success ── */}
                        {step === "success" && (
                            <motion.div
                                key="success"
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.4 }}
                                className="text-center py-8"
                            >
                                <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6 border border-green-200">
                                    <motion.svg
                                        initial={{ pathLength: 0 }}
                                        animate={{ pathLength: 1 }}
                                        transition={{ duration: 0.5, delay: 0.2 }}
                                        className="w-10 h-10 text-green-500"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                        strokeWidth={2.5}
                                    >
                                        <motion.path
                                            initial={{ pathLength: 0 }}
                                            animate={{ pathLength: 1 }}
                                            transition={{ duration: 0.5, delay: 0.2 }}
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            d="M5 13l4 4L19 7"
                                        />
                                    </motion.svg>
                                </div>
                                <h2 className="text-2xl font-heading !text-gray-900 font-bold mb-2">Welcome, {name}!</h2>
                                <p className="text-gray-500 text-sm">Your account has been created successfully. Redirecting...</p>
                                <Loader2 className="w-5 h-5 animate-spin text-gray-400 mx-auto mt-4" />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </motion.div>
        </div>
    );
}

export default function SignupPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-white flex justify-center items-center">
                <Loader2 className="w-10 h-10 animate-spin text-[#111111]" />
            </div>
        }>
            <SignupContent />
        </Suspense>
    );
}
