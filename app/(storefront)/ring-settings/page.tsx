"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/Button";
import Link from "next/link";
import type { Diamond } from "@prisma/client";

// Formatter for ₹ Currency
const formatPrice = (value: number) => {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0
    }).format(value);
};

export default function RingSettingsPlaceholder() {
    const [selectedDiamond, setSelectedDiamond] = useState<Diamond | null>(null);

    useEffect(() => {
        const stored = sessionStorage.getItem('selectedDiamond');
        if (stored) {
            setTimeout(() => setSelectedDiamond(JSON.parse(stored)), 0);
        }
    }, []);

    return (
        <main className="min-h-screen bg-[#f8f7f4] py-24 px-6 text-center">
            <h1 className="text-4xl font-heading text-gray-900 mb-4">Continue Ring Design</h1>
            <p className="text-gray-600 max-w-2xl mx-auto mb-10">Start customization to pair your selected diamond with the ideal ring setting and metal.</p>
            {selectedDiamond ? (
                <div className="bg-white max-w-xl mx-auto p-8 border border-gray-100 shadow-sm rounded-md mb-8">
                    <h2 className="text-sm uppercase tracking-widest text-[#111111] font-bold mb-4">Your Selected Diamond</h2>
                    <ul className="text-left space-y-2 text-gray-700 mb-6">
                        <li><strong>Shape:</strong> {selectedDiamond.shape}</li>
                        <li><strong>Carat:</strong> {selectedDiamond.caratWeight}</li>
                        <li><strong>Color/Clarity:</strong> {selectedDiamond.color} / {selectedDiamond.clarity}</li>
                        <li><strong>Price:</strong> {formatPrice(selectedDiamond.price)}</li>
                    </ul>
                    <div className="flex flex-col sm:flex-row gap-3">
                        <Link href="/customizer/step-2-setting" passHref className="w-full">
                            <Button className="w-full">Choose Ring Setting</Button>
                        </Link>
                        <Link href="/diamonds" passHref className="w-full">
                            <Button variant="outline" className="w-full">Change Diamond</Button>
                        </Link>
                    </div>
                </div>
            ) : (
                <div className="bg-white max-w-xl mx-auto p-8 border border-gray-100 shadow-sm rounded-md">
                    <p className="text-gray-600 mb-6">Select a diamond first to proceed with ring customization.</p>
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                        <Link href="/diamonds" passHref>
                            <Button>Browse Diamonds</Button>
                        </Link>
                        <Link href="/customizer/step-1-diamond" passHref>
                            <Button variant="outline">Go to Customizer</Button>
                        </Link>
                    </div>
                </div>
            )}
        </main>
    );
}
