export default function AdminLoading() {
    return (
        <div className="min-h-screen bg-[#0B0B0C] flex flex-col items-center justify-center p-6 text-white">
            <div className="relative flex flex-col items-center max-w-sm w-full p-8 rounded-2xl border border-white/5 bg-white/[0.01]">
                {/* Circular gold spinner */}
                <div className="w-10 h-10 rounded-full border-t-2 border-r-2 border-[#D6B25E] animate-spin mb-4" />
                <h3 className="text-xs uppercase tracking-[0.2em] text-[#D6B25E] font-semibold">
                    Admin Studio
                </h3>
                <p className="text-[10px] text-white/40 tracking-[0.1em] mt-1">
                    Loading Management Dashboard...
                </p>
            </div>
        </div>
    );
}
