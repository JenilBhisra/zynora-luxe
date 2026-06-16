export const CHECKOUT_INTENT_KEY = "zynora_checkout_intent";

export type CheckoutIntentSource = "single-product" | "cart" | "custom-ring";

export interface CheckoutIntent {
    source: CheckoutIntentSource;
    item?: {
        id: string;
        name: string;
        price: number;
        image: string;
        quantity: number;
        isCustomRing?: boolean;
        ringConfigurationId?: string;
        metalType?: string;
    };
    items?: Array<{
        id: string;
        name: string;
        price: number;
        image: string;
        quantity: number;
        isCustomRing?: boolean;
        ringConfigurationId?: string;
        metalType?: string;
    }>;
    createdAt: number;
}

export function saveCheckoutIntent(intent: CheckoutIntent) {
    if (typeof window === "undefined") return;
    localStorage.setItem(CHECKOUT_INTENT_KEY, JSON.stringify(intent));
}

export function getCheckoutIntent(): CheckoutIntent | null {
    if (typeof window === "undefined") return null;

    const raw = localStorage.getItem(CHECKOUT_INTENT_KEY);
    if (!raw) return null;

    try {
        return JSON.parse(raw) as CheckoutIntent;
    } catch {
        return null;
    }
}

export function clearCheckoutIntent() {
    if (typeof window === "undefined") return;
    localStorage.removeItem(CHECKOUT_INTENT_KEY);
}
