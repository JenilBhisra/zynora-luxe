export default function AdminLoading() {
    return (
        <div className="min-h-screen bg-[#FAF8F4] flex flex-col items-center justify-center p-6 text-zinc-900">
            <div className="relative flex flex-col items-center max-w-sm w-full p-8 rounded-2xl border border-gray-200 bg-white shadow-sm">
                {/* Circular gold spinner */}
                <div className="w-10 h-10 rounded-full border-t-2 border-r-2 border-[#C9A14A] animate-spin mb-4" />
                <h3 className="text-xs uppercase tracking-[0.2em] text-[#C9A14A] font-semibold">
                    Admin Studio
                </h3>
                <p className="text-[10px] text-zinc-400 tracking-[0.1em] mt-1">
                    Loading Management Dashboard...
                </p>
            </div>
        </div>
    );
}
