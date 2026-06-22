import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Diamond, Setting } from '@prisma/client';

export type MetalType = 
    | "10K Yellow Gold" | "10K White Gold" | "10K Rose Gold"
    | "14K Yellow Gold" | "14K White Gold" | "14K Rose Gold"
    | "18K Yellow Gold" | "18K White Gold" | "18K Rose Gold"
    | "22K Yellow Gold" | "22K White Gold" | "22K Rose Gold"
    | "Silver" | "Platinum"
    | string;

export interface RingConfiguration {
    setting: Setting | null;
    diamond: Diamond | null;
    metalType: MetalType;
    metalPriceAdjustment: number;
    ringKarat: string;   // e.g. "18K" (empty for Silver/Platinum)
    ringSize: string;    // e.g. "6"
    ringKaratPrice: number;  // base price for selected karat/metal
    ringSizePrice: number;   // size add-on for selected karat/metal+size
}

interface CustomizerStore {
    config: RingConfiguration;
    setSetting: (setting: Setting) => void;
    setDiamond: (diamond: Diamond) => void;
    setMetalType: (metalType: MetalType, priceAdjustment: number) => void;
    setRingKaratSize: (karat: string, size: string, karatPrice: number, sizePrice: number) => void;
    getTotalPrice: () => number;
    resetConfig: () => void;
    isSubmitting: boolean;
    setIsSubmitting: (val: boolean) => void;
    isSaved: boolean;
    setIsSaved: (val: boolean) => void;
}

const initialConfig: RingConfiguration = {
    setting: null,
    diamond: null,
    metalType: "18K White Gold",
    metalPriceAdjustment: 0,
    ringKarat: "",
    ringSize: "",
    ringKaratPrice: 0,
    ringSizePrice: 0,
};

export const useCustomizerStore = create<CustomizerStore>()(
    persist(
        (set, get) => ({
            config: initialConfig,
            setSetting: (setting) => set((state) => ({ config: { ...state.config, setting } })),
            setDiamond: (diamond) => set((state) => ({ config: { ...state.config, diamond } })),
            setMetalType: (metalType, metalPriceAdjustment) => set((state) => ({ config: { ...state.config, metalType, metalPriceAdjustment } })),
            setRingKaratSize: (ringKarat, ringSize, ringKaratPrice, ringSizePrice) =>
                set((state) => ({ config: { ...state.config, ringKarat, ringSize, ringKaratPrice, ringSizePrice } })),
            getTotalPrice: () => {
                const { setting, diamond, metalPriceAdjustment, ringKarat, ringKaratPrice, ringSizePrice } = get().config;
                // If karat+size pricing or metal size pricing is set, use that instead of base setting price
                const settingPrice = (ringKarat || ringKaratPrice > 0)
                    ? ringKaratPrice + ringSizePrice
                    : (setting?.price || 0);
                const diamondPrice = diamond?.price || 0;
                return settingPrice + diamondPrice + metalPriceAdjustment;
            },
            resetConfig: () => set({ config: initialConfig, isSubmitting: false, isSaved: false }),
            isSubmitting: false,
            setIsSubmitting: (val) => set({ isSubmitting: val }),
            isSaved: false,
            setIsSaved: (val) => set({ isSaved: val }),
        }),
        {
            name: 'ring-customizer-storage',
        }
    )
);
