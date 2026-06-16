export default function StorefrontLoading() {
    return (
        <div className="fixed inset-0 z-[99] flex flex-col items-center justify-center bg-[#0B0B0C] text-white">
            <div className="relative flex flex-col items-center">
                {/* Pulsating luxury golden rings */}
                <div className="relative w-16 h-16 mb-4">
                    <div className="absolute inset-0 rounded-full border-2 border-[#D6B25E]/20 animate-ping" />
                    <div className="absolute inset-2 rounded-full border-2 border-[#D6B25E]/40" />
                    <div className="absolute inset-4 rounded-full border-2 border-[#D6B25E] animate-pulse" />
                </div>
                {/* Shimmering branding */}
                <h2 className="text-sm font-serif tracking-[0.3em] text-[#D6B25E] uppercase animate-pulse">
                    ZYNORA LUXE
                </h2>
                <p className="text-[10px] uppercase tracking-[0.2em] text-white/40 mt-2">
                    Loading Collection...
                </p>
            </div>
        </div>
    );
}
