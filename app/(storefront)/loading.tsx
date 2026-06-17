export default function StorefrontLoading() {
    return (
        <div className="w-full bg-white text-[#1A1A1A]">
            {/* Hero Section Skeleton */}
            <section 
                className="relative w-full overflow-hidden bg-[#FAF8F4] flex items-center"
                style={{ height: "calc(100vh - var(--header-height, 120px))" }}
            >
                {/* Content Overlay Skeleton */}
                <div className="absolute inset-y-0 left-0 w-full z-10 flex items-center">
                    <div className="w-full px-6 md:px-12 lg:pl-[12%] lg:pr-6 flex justify-center lg:justify-start">
                        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center w-full sm:w-auto">
                            <div className="w-[180px] h-[48px] bg-black/5 animate-pulse" />
                            <div className="w-[180px] h-[48px] bg-black/5 animate-pulse" />
                        </div>
                    </div>
                </div>
            </section>

            {/* Category Gallery Skeleton */}
            <section className="py-20 bg-white">
                <div className="container-custom">
                    <div className="flex flex-col items-center mb-12">
                        <div className="h-3 w-32 bg-black/5 mb-4 animate-pulse" />
                        <div className="h-8 w-64 bg-black/5 animate-pulse" />
                    </div>
                    {/* Grid of category cards */}
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
                        {Array.from({ length: 6 }).map((_, index) => (
                            <div key={index} className="flex flex-col gap-3 animate-pulse">
                                <div className="aspect-square w-full bg-[#FAF8F4]" />
                                <div className="h-4 w-2/3 bg-black/5 mx-auto mt-1" />
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Featured Products Skeleton */}
            <section className="py-20 bg-[#FAF8F4]/50">
                <div className="container-custom">
                    <div className="flex flex-col items-center mb-12">
                        <div className="h-3 w-24 bg-black/5 mb-4 animate-pulse" />
                        <div className="h-8 w-80 bg-black/5 animate-pulse" />
                    </div>
                    {/* Grid of product cards */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
                        {Array.from({ length: 4 }).map((_, index) => (
                            <div key={index} className="flex flex-col gap-4 bg-white p-4 border border-[#EAEAEA] animate-pulse">
                                <div className="aspect-square w-full bg-[#FAF8F4]" />
                                <div className="h-4 w-3/4 bg-black/5 mt-2" />
                                <div className="h-3 w-1/2 bg-black/5" />
                                <div className="h-5 w-1/3 bg-black/5 mt-2" />
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        </div>
    );
}
