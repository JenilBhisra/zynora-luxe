export interface FAQItem {
    question: string;
    answer: string;
}

export interface EducationGuide {
    title: string;
    description: string;
    link: string;
    readTime: string;
}

export const ZYNORA_FAQ: FAQItem[] = [
    {
        question: "How do I determine the perfect ring size?",
        answer: "We offer a complimentary ring sizer kit that we can ship directly to you. Alternatively, you can download our printable size guide or visit any local jeweler to get sized. We also provide one free resizing within 60 days of purchase."
    },
    {
        question: "Are your diamonds certified and conflict-free?",
        answer: "Yes, every loose diamond we sell is accompanied by an independent grading report from the GIA or IGI. We strictly source conflict-free diamonds through trusted suppliers who adhere to the Kimberley Process."
    },
    {
        question: "How long does it take to handcraft my custom ring?",
        answer: "Since each custom ring is individually designed and handcrafted by our master artisans to fit your specific diamond and size, production takes approximately 10 to 14 business days, followed by insured overnight shipping."
    },
    {
        question: "What is your return policy for custom engagement rings?",
        answer: "We want you to love your ring. We offer a 30-day money-back guarantee with free return shipping. The ring must be in its original, unworn condition with all certificates and packaging intact."
    }
];

export const ZYNORA_WARRANTY = {
    title: "Lifetime Craftsmanship Warranty",
    description: "Every Zynora Luxe piece is crafted to the highest standards of luxury and durability. We stand behind our jewelry with a lifetime warranty against manufacturing defects. If any issue arises due to craftsmanship, we will repair or replace your ring free of charge.",
    highlights: [
        "Complimentary prong tightening & safety checks",
        "Free professional cleaning and steam-polishing",
        "Lifetime coverage for manufacturing defects",
        "Insured shipping both ways for warranty work"
    ]
};

export const ZYNORA_SHIPPING = {
    title: "Fully Insured Express Shipping",
    description: "We provide complimentary, fully insured express delivery on all orders worldwide. For safety, your package will arrive in a discreetly marked box with signature-required delivery to ensure it reaches you safely.",
    returns: "Hassle-free 30-day returns with pre-paid shipping labels provided upon request."
};

export const ZYNORA_CERTIFICATION = {
    title: "GIA & IGI Gemological Reports",
    description: "Every diamond certified by the GIA (Gemological Institute of America) or IGI (International Gemological Institute) is laser-inscribed with a unique serial number matching its digital report. You can verify your diamond's authenticity instantly via their global registry.",
    guarantee: "100% authentic gemological verification guaranteed."
};

export const ZYNORA_SUSTAINABILITY = {
    title: "Ethically Sourced & Recycled Metals",
    description: "Zynora Luxe is committed to minimizing our environmental footprint. We use 100% recycled 18K yellow, white, rose gold, and platinum for our bands. Our diamonds are mined under strict labor and environmental standards or grown in carbon-neutral laboratories.",
    carbonNeutral: "Our packaging is 100% recyclable, made with FSC-certified sustainable forest wood and cotton."
};

export const ZYNORA_SIZE_GUIDE = {
    carats: [
        { size: "0.50 ct", mm: "approx. 5.1mm", popularFor: "Minimalist, daily elegance" },
        { size: "1.00 ct", mm: "approx. 6.5mm", popularFor: "Classic choice, perfect proportions" },
        { size: "1.50 ct", mm: "approx. 7.4mm", popularFor: "Sophisticated presence, high brilliance" },
        { size: "2.00 ct", mm: "approx. 8.2mm", popularFor: "Premium statement, dramatic look" },
        { size: "3.00 ct", mm: "approx. 9.3mm", popularFor: "Ultimate luxury, breathtaking size" }
    ],
    tips: [
        "Carat weight refers to the diamond's weight, not its physical size.",
        "Elongated shapes (like Oval, Pear, Marquise) tend to look larger on the hand than round or square cuts of the same carat weight.",
        "Setting choices like Halo can make a center stone appear up to 0.5 carats larger."
    ]
};

export const ZYNORA_EDUCATION: EducationGuide[] = [
    {
        title: "Understanding the 4Cs of Diamonds",
        description: "Learn how Cut, Color, Clarity, and Carat weight combine to determine a diamond's beauty, brilliance, and overall value.",
        link: "/blog/understanding-the-4cs",
        readTime: "5 min read"
    },
    {
        title: "Choosing the Right Ring Metal",
        description: "Platinum, White Gold, Yellow Gold, or Rose Gold? Compare durability, maintenance, and style to find the perfect metal.",
        link: "/blog/choosing-the-right-ring-metal",
        readTime: "4 min read"
    },
    {
        title: "The Ultimate Engagement Ring Guide",
        description: "From selecting the shape to setting styles, our comprehensive guide covers everything you need to know before buying.",
        link: "/blog/ultimate-engagement-ring-guide",
        readTime: "8 min read"
    }
];
