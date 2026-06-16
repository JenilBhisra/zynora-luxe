export type LocalUser = {
    id: string;
    name: string;
    email: string;
    role?: string;
};

const CURRENT_USER_KEY = "krishna_current_user";
const REDIRECT_AFTER_LOGIN_KEY = "redirectAfterLogin";

function canUseStorage() {
    return typeof window !== "undefined";
}

export function getCurrentUser(): LocalUser | null {
    if (!canUseStorage()) return null;

    const rawUser = window.localStorage.getItem(CURRENT_USER_KEY);
    if (!rawUser) return null;

    try {
        return JSON.parse(rawUser) as LocalUser;
    } catch {
        return null;
    }
}

export function saveCurrentUser(user: LocalUser) {
    if (!canUseStorage()) return;
    window.localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
}

export function clearCurrentUser() {
    if (!canUseStorage()) return;
    window.localStorage.removeItem(CURRENT_USER_KEY);
}

export function isLoggedIn() {
    return Boolean(getCurrentUser());
}

export function setRedirectAfterLogin(path: string) {
    if (!canUseStorage()) return;
    window.localStorage.setItem(REDIRECT_AFTER_LOGIN_KEY, path);
}

export function getRedirectAfterLogin() {
    if (!canUseStorage()) return null;
    return window.localStorage.getItem(REDIRECT_AFTER_LOGIN_KEY);
}

export function consumeRedirectAfterLogin(fallbackPath = "/") {
    if (!canUseStorage()) return fallbackPath;

    const redirectPath = window.localStorage.getItem(REDIRECT_AFTER_LOGIN_KEY);
    window.localStorage.removeItem(REDIRECT_AFTER_LOGIN_KEY);
    return redirectPath || fallbackPath;
}
