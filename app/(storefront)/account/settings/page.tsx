"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/AuthProvider";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, User, Lock, Eye, EyeOff, Loader2, CheckCircle2, AlertTriangle, ShieldAlert } from "lucide-react";
import { updateProfile, updatePassword, reauthenticateWithCredential, EmailAuthProvider } from "firebase/auth";
import { auth } from "@/lib/firebase";

export default function SettingsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  // Profile fields state
  const [displayName, setDisplayName] = useState("");
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [profileStatus, setProfileStatus] = useState<"idle" | "success" | "error">("idle");
  const [profileError, setProfileError] = useState("");

  // Password fields state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [passwordStatus, setPasswordStatus] = useState<"idle" | "success" | "error" | "requires-reauth">("idle");
  const [passwordError, setPasswordError] = useState("");

  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName || "");
    }
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen pt-24 bg-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 rounded-full border-t-2 border-[#D6B25E] animate-spin text-[#D6B25E]" />
      </div>
    );
  }

  if (!user) {
    router.push("/login");
    return null;
  }

  const isGoogleUser = user.providerData.some(
    (profile) => profile.providerId === "google.com"
  );

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) {
      setProfileError("Display Name cannot be empty.");
      setProfileStatus("error");
      return;
    }

    setIsUpdatingProfile(true);
    setProfileError("");
    setProfileStatus("idle");

    try {
      // 1. Update Firebase display name
      if (auth.currentUser) {
        await updateProfile(auth.currentUser, {
          displayName: displayName.trim(),
        });
      }

      // Update local storage user for local helper functions like isLoggedIn() and getCurrentUser()
      try {
        const rawUser = window.localStorage.getItem("krishna_current_user");
        if (rawUser) {
          const parsed = JSON.parse(rawUser);
          parsed.name = displayName.trim();
          window.localStorage.setItem("krishna_current_user", JSON.stringify(parsed));
        }
      } catch (err) {
        console.error("Failed to update local storage user:", err);
      }

      // 2. Sync name with Prisma DB via API
      const res = await fetch("/api/user/update-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: displayName.trim() }),
      });

      const data = await res.ok ? await res.json() : null;
      if (!res.ok) {
        throw new Error(data?.error || "Failed to update profile on database.");
      }

      setProfileStatus("success");
      // Force user context refresh
      router.refresh();
      setTimeout(() => setProfileStatus("idle"), 4000);
    } catch (err: any) {
      console.error(err);
      setProfileStatus("error");
      setProfileError(err.message || "Failed to update display name.");
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || !confirmPassword) {
      setPasswordError("All password fields are required.");
      setPasswordStatus("error");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords do not match.");
      setPasswordStatus("error");
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError("Password must be at least 6 characters.");
      setPasswordStatus("error");
      return;
    }

    setIsUpdatingPassword(true);
    setPasswordError("");
    setPasswordStatus("idle");

    try {
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error("No user authenticated.");

      // Attempt to update password directly
      await updatePassword(currentUser, newPassword);
      setPasswordStatus("success");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => setPasswordStatus("idle"), 4000);
    } catch (err: any) {
      console.error(err);
      if (err.code === "auth/requires-recent-login") {
        setPasswordStatus("requires-reauth");
        setPasswordError("For security, you must re-authenticate to change your password.");
      } else {
        setPasswordStatus("error");
        setPasswordError(err.message || "Failed to change password. Please verify current credentials.");
      }
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const handleReauthenticateAndSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword) {
      setPasswordError("Current password is required to verify identity.");
      setPasswordStatus("requires-reauth");
      return;
    }

    setIsUpdatingPassword(true);
    setPasswordError("");

    try {
      const currentUser = auth.currentUser;
      if (!currentUser || !currentUser.email) throw new Error("User context unavailable.");

      // Re-authenticate user with current password
      const credential = EmailAuthProvider.credential(currentUser.email, currentPassword);
      await reauthenticateWithCredential(currentUser, credential);

      // Re-authenticate succeeded, now update password
      await updatePassword(currentUser, newPassword);
      setPasswordStatus("success");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => setPasswordStatus("idle"), 4000);
    } catch (err: any) {
      console.error(err);
      setPasswordStatus("requires-reauth");
      setPasswordError(err.message || "Incorrect current password. Re-authentication failed.");
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  return (
    <div className="min-h-screen bg-black pt-24 pb-12 text-zinc-100">
      <div className="container-custom max-w-3xl mx-auto px-4">
        {/* Back navigation */}
        <div className="mb-6">
          <Link href="/account" className="inline-flex items-center gap-2 text-sm text-[#D6B25E] hover:text-[#E8C26E] transition-colors group">
            <ArrowLeft size={16} className="transform transition-transform group-hover:-translate-x-1 duration-300" />
            Back to Account
          </Link>
        </div>

        {/* Title */}
        <div className="mb-10">
          <h1 className="text-3xl md:text-4xl font-heading text-white mb-2">Account Settings</h1>
          <p className="text-zinc-400 text-sm">Manage your profile information and update your security settings.</p>
        </div>

        <div className="space-y-8">
          {/* Card 1: Personal Info */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[#121214] border border-white/5 rounded-3xl p-6 md:p-8"
          >
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/5">
              <div className="p-2 bg-[#D6B25E]/10 rounded-xl text-[#D6B25E]">
                <User size={20} strokeWidth={1.5} />
              </div>
              <h2 className="text-xl font-heading text-white">Profile Details</h2>
            </div>

            <form onSubmit={handleUpdateProfile} className="space-y-6">
              {profileStatus === "success" && (
                <motion.div
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 p-4 rounded-xl flex gap-3 items-center text-sm"
                >
                  <CheckCircle2 size={18} className="flex-shrink-0" />
                  Profile updated successfully.
                </motion.div>
              )}

              {profileStatus === "error" && (
                <motion.div
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-xl flex gap-3 items-center text-sm"
                >
                  <AlertTriangle size={18} className="flex-shrink-0" />
                  {profileError}
                </motion.div>
              )}

              {/* Email (Read-only) */}
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-zinc-500 font-semibold mb-2 flex items-center gap-1.5">
                  <Lock size={12} /> Email Address (Primary ID)
                </label>
                <div className="relative">
                  <input
                    type="email"
                    disabled
                    value={user.email || ""}
                    className="w-full bg-zinc-900/40 border border-zinc-800/80 text-zinc-500 text-sm px-4 py-3 rounded-xl cursor-not-allowed"
                  />
                </div>
                <p className="text-[11px] text-zinc-600 mt-2">
                  Your primary email cannot be modified client-side. Contact support if you need to transfer credentials.
                </p>
              </div>

              {/* Display Name */}
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-[#D6B25E] font-semibold mb-2">
                  Display Name / Username
                </label>
                <input
                  type="text"
                  required
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Enter your name"
                  className="w-full bg-zinc-950 border border-zinc-800 focus:border-[#D6B25E] focus:outline-none text-sm text-white px-4 py-3 rounded-xl transition-colors placeholder-zinc-600"
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isUpdatingProfile}
                  className="px-6 py-3 bg-[#D6B25E] hover:bg-[#C9A24A] text-[#0B0B0C] text-xs font-semibold rounded-xl uppercase tracking-wider transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  {isUpdatingProfile ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : null}
                  Save Changes
                </button>
              </div>
            </form>
          </motion.div>

          {/* Card 2: Security & Password */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-[#121214] border border-white/5 rounded-3xl p-6 md:p-8"
          >
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/5">
              <div className="p-2 bg-[#D6B25E]/10 rounded-xl text-[#D6B25E]">
                <Lock size={20} strokeWidth={1.5} />
              </div>
              <h2 className="text-xl font-heading text-white">Security & Credentials</h2>
            </div>

            {isGoogleUser ? (
              <div className="bg-zinc-900/30 border border-zinc-800/80 rounded-2xl p-6 text-center">
                <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center mx-auto mb-4 text-blue-400">
                  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                </div>
                <h4 className="text-white font-medium text-sm mb-1">Google Single Sign-On Active</h4>
                <p className="text-zinc-400 text-xs max-w-md mx-auto leading-relaxed">
                  Your credentials and security settings are managed completely by Google. Password resets and multi-factor settings should be handled inside your Google Account console.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {passwordStatus === "success" && (
                  <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 p-4 rounded-xl flex gap-3 items-center text-sm"
                  >
                    <CheckCircle2 size={18} className="flex-shrink-0" />
                    Password updated successfully.
                  </motion.div>
                )}

                {passwordStatus === "error" && (
                  <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-xl flex gap-3 items-center text-sm"
                  >
                    <AlertTriangle size={18} className="flex-shrink-0" />
                    {passwordError}
                  </motion.div>
                )}

                {passwordStatus === "requires-reauth" ? (
                  /* Re-authenticate Form */
                  <form onSubmit={handleReauthenticateAndSubmit} className="space-y-4">
                    <div className="bg-amber-500/10 border border-amber-500/30 text-amber-400 p-4 rounded-xl flex gap-3 items-start text-xs leading-normal">
                      <ShieldAlert size={18} className="flex-shrink-0 mt-0.5 text-amber-400" />
                      <div>
                        <p className="font-semibold mb-1">Identity Verification Required</p>
                        <p className="text-zinc-400">
                          Due to security limitations, updating credentials requires confirming your current password. Please verify below to complete the action.
                        </p>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase tracking-widest text-[#D6B25E] font-semibold mb-2">
                        Verify Current Password
                      </label>
                      <div className="relative">
                        <input
                          type={showCurrentPass ? "text" : "password"}
                          required
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          placeholder="Enter current password"
                          className="w-full bg-zinc-950 border border-zinc-800 focus:border-[#D6B25E] focus:outline-none text-sm text-white px-4 py-3 pr-12 rounded-xl transition-colors placeholder-zinc-600"
                        />
                        <button
                          type="button"
                          onClick={() => setShowCurrentPass(!showCurrentPass)}
                          className="absolute inset-y-0 right-0 pr-4 flex items-center text-zinc-500 hover:text-zinc-300"
                        >
                          {showCurrentPass ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>

                    <div className="flex justify-between items-center pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          setPasswordStatus("idle");
                          setPasswordError("");
                        }}
                        className="text-xs text-zinc-500 hover:text-white transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isUpdatingPassword}
                        className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-xl uppercase tracking-wider transition-colors flex items-center gap-2 disabled:opacity-50"
                      >
                        {isUpdatingPassword ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : null}
                        Confirm & Save
                      </button>
                    </div>
                  </form>
                ) : (
                  /* Standard Password Update Form */
                  <form onSubmit={handleUpdatePassword} className="space-y-6">
                    {/* New Password */}
                    <div>
                      <label className="block text-[10px] uppercase tracking-widest text-[#D6B25E] font-semibold mb-2">
                        New Password
                      </label>
                      <div className="relative">
                        <input
                          type={showNewPass ? "text" : "password"}
                          required
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="At least 6 characters"
                          className="w-full bg-zinc-950 border border-zinc-800 focus:border-[#D6B25E] focus:outline-none text-sm text-white px-4 py-3 pr-12 rounded-xl transition-colors placeholder-zinc-600"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPass(!showNewPass)}
                          className="absolute inset-y-0 right-0 pr-4 flex items-center text-zinc-500 hover:text-zinc-300"
                        >
                          {showNewPass ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>

                    {/* Confirm Password */}
                    <div>
                      <label className="block text-[10px] uppercase tracking-widest text-[#D6B25E] font-semibold mb-2">
                        Confirm New Password
                      </label>
                      <div className="relative">
                        <input
                          type={showConfirmPass ? "text" : "password"}
                          required
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Re-enter new password"
                          className="w-full bg-zinc-950 border border-zinc-800 focus:border-[#D6B25E] focus:outline-none text-sm text-white px-4 py-3 pr-12 rounded-xl transition-colors placeholder-zinc-600"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPass(!showConfirmPass)}
                          className="absolute inset-y-0 right-0 pr-4 flex items-center text-zinc-500 hover:text-zinc-300"
                        >
                          {showConfirmPass ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <button
                        type="submit"
                        disabled={isUpdatingPassword}
                        className="px-6 py-3 bg-[#D6B25E] hover:bg-[#C9A24A] text-[#0B0B0C] text-xs font-semibold rounded-xl uppercase tracking-wider transition-colors flex items-center gap-2 disabled:opacity-50"
                      >
                        {isUpdatingPassword ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : null}
                        Update Password
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
