"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Phone, Mail, MessageSquare, ShieldCheck, HelpCircle, CheckCircle2, ChevronDown, Landmark, Send, TrendingUp, Sparkles, Languages } from "lucide-react";

// Translation dictionary for English and Gujarati
const TRANSLATIONS = {
  en: {
    heroTag: "Enterprise & Wholesale",
    heroTitle: "Volume Diamonds & ",
    heroTitleItalic: "B2B Solutions",
    heroSub: "Zynora Luxe is a premier global diamond manufacturer and exporter based in Surat, Gujarat. For jewelers, dealers, and corporate partners purchasing diamonds in large quantities, there is no fixed rate—instead, we offer dynamic, custom volume pricing based on market indexes and weight brackets.",
    
    noticeTitle: "Why is there no fixed B2B rate?",
    noticeDesc: "Diamond market values fluctuate daily. For bulk parcels or layout configurations exceeding 5 carats, pricing is calculated in real-time based on clarity parcels, cutting batches, and global Rapaport valuations. We negotiate rates individually to pass direct-from-studio discounts to your business.",
    
    conciergeTitle: "Direct B2B Concierge",
    conciergeHotline: "Corporate Hotline",
    conciergeHotlineDesc: "Call our wholesale coordinators directly:",
    conciergeEmail: "B2B Account Services",
    conciergeEmailDesc: "Send your official RFQ sheet or specifications file:",
    conciergeWhatsAppBtn: "WhatsApp Business Channel",
    conciergeNotice: "Notice: To schedule a physically secured inspection of diamond parcels at our Surat offices, please complete the wholesale inquiry form first to obtain an appointment token.",
    
    formTitle: "Submit RFQ / Bulk Quote",
    formSub: "Supply your business specifications to receive a floating volume quote.",
    formSuccessTitle: "B2B RFQ Submitted Successfully",
    formSuccessDesc: "Our commercial desk will verify credentials and contact you shortly.",
    formErrorTitle: "RFQ Submission Failed",
    
    labelContactName: "Contact Name *",
    phContactName: "Representative Name",
    labelCompanyName: "Company / Business Name *",
    phCompanyName: "Registered Company Name",
    labelGst: "GST / Business Registration ID *",
    phGst: "e.g. 24AAAAB1111C1Z1",
    labelVolume: "Target Volume *",
    labelEmail: "Corporate Email *",
    phEmail: "business@company.com",
    labelPhone: "Phone Number *",
    phPhone: "e.g. +91 97246 27122",
    labelSpecs: "Diamond Specifications & Target Budget *",
    phSpecs: "Outline your target diamond shapes (Round, Oval, etc.), clarities (VS1, VVS2, FL), colors (D, E, F), average weight per stone, and total quantity needed...",
    btnSubmit: "Request Wholesale Quotation",
    
    feature1Title: "Surat Studio Sourcing",
    feature1Desc: "Sourced directly from our state-of-the-art cutting and polishing studios in Surat.",
    feature2Title: "Certified Parcels",
    feature2Desc: "Every stone in your lot is individually graded and sealed by GIA or IGI.",
    feature3Title: "Custom Prototyping",
    feature3Desc: "Complimentary CAD blueprints, custom alloy casting, and master setting.",
    feature4Title: "Floating Agreements",
    feature4Desc: "Bespoke contracts allowing you to call off volumes as per your manufacturing cycle.",
    
    volOpt1: "5 to 15 Carats (Standard Parcel)",
    volOpt2: "15 to 50 Carats (Volume Lot)",
    volOpt3: "50+ Carats (Bespoke Manufacturing Lot)",
    volOpt4: "Ongoing Supply Contract (Monthly call-offs)",
    
    errPhoneRequired: "Please enter your phone number.",
    errGstRequired: "Please enter your GST number.",
    errGstInvalid: "Please enter a valid GST number.",
    errGstFailed: "GST verification failed. Please check your GST number and try again.",
    errRateLimit: "Too many requests. Please try again after some time.",
  },
  gu: {
    heroTag: "એન્ટરપ્રાઇઝ અને જથ્થાબંધ",
    heroTitle: "જથ્થાબંધ હીરા અને ",
    heroTitleItalic: "B2B સોલ્યુશન્સ",
    heroSub: "ઝાયનોરા લક્સ (Zynora Luxe) એ સુરત, ગુજરાતમાં સ્થિત એક અગ્રણી ગ્લોબલ ડાયમંડ ઉત્પાદક અને નિકાસકાર છે. ઝવેરીઓ, ડીલરો અને કોર્પોરેટ ભાગીદારો માટે જેઓ મોટી માત્રામાં હીરા ખરીદે છે, તેમના માટે કોઈ નિશ્ચિત ભાવ નથી—તેના બદલે, અમે માર્કેટ ઇન્ડેક્સ અને વજનના આધારે કસ્ટમ જથ્થાબંધ ભાવો ઓફર કરીએ છીએ.",
    
    noticeTitle: "બી2બી (B2B) માટે કોઈ નિશ્ચિત ભાવ કેમ નથી?",
    noticeDesc: "હીરાના બજાર ભાવ દરરોજ બદલાય છે. ૫ કેરેટથી વધુના જથ્થાબંધ પાર્સલ માટે, ક્લેરિટી પાર્સલ, કટીંગ બેચ અને ગ્લોબલ રેપાપોર્ટ મૂલ્યાંકનના આધારે રીઅલ-ટાઇમમાં કિંમત ગણવામાં આવે છે. અમે તમારા વ્યવસાયને સીધો સુરત કારખાનાનો ડિસ્કાઉન્ટ ભાવ આપવા માટે વ્યક્તિગત રીતે દરો નક્કી કરીએ છીએ.",
    
    conciergeTitle: "સીધો B2B સંપર્ક",
    conciergeHotline: "કંપની હોટલાઇન",
    conciergeHotlineDesc: "અમારા જથ્થાબંધ સંયોજકો સાથે સીધી વાત કરો:",
    conciergeEmail: "B2B ખાતાની સેવાઓ",
    conciergeEmailDesc: "તમારી સત્તાવાર RFQ શીટ અથવા વિગતોની ફાઇલ મોકલો:",
    conciergeWhatsAppBtn: "વોટ્સએપ બિઝનેસ ચેનલ",
    conciergeNotice: "નોંધ: સુરત સ્થિત અમારી ઓફિસ પર હીરાના પાર્સલની રૂબરૂ ચકાસણી માટે સમય નક્કી કરવા કૃપા કરીને પહેલા આ ફોર્મ ભરો જેથી એપોઇન્ટમેન્ટ ટોકન મેળવી શકાય.",
    
    formTitle: "ઇન્ક્વાયરી / જથ્થાબંધ ભાવ માટે ફોર્મ",
    formSub: "ચાલુ બજાર ભાવનું જથ્થાબંધ ક્વોટેશન મેળવવા માટે તમારા વ્યવસાયની વિગતો આપો.",
    formSuccessTitle: "B2B ઇન્ક્વાયરી સફળતાપૂર્વક મોકલવામાં આવી છે",
    formSuccessDesc: "અમારો વ્યવસાયિક ડેસ્ક તમારી વિગતો ચકાસીને ટૂંક સમયમાં તમારો સંપર્ક કરશે.",
    formErrorTitle: "સબમિશન નિષ્ફળ ગયું",
    
    labelContactName: "સંપર્ક વ્યક્તિનું નામ *",
    phContactName: "પ્રતિનિધિનું નામ",
    labelCompanyName: "કંપની / વ્યવસાયનું નામ *",
    phCompanyName: "રજિસ્ટર્ડ કંપનીનું નામ",
    labelGst: "GST નંબર / વ્યવસાય આઈડી *",
    phGst: "ઉદા. 24AAAAB1111C1Z1",
    labelVolume: "અંદાજિત જથ્થો *",
    labelEmail: "વ્યવસાયિક ઇમેઇલ *",
    phEmail: "business@company.com",
    labelPhone: "ફોન નંબર *",
    phPhone: "ઉદા. +91 97246 27122",
    labelSpecs: "હીરાની વિગતો અને અંદાજિત બજેટ *",
    phSpecs: "તમારી પસંદગીના હીરાના આકાર (ગોળ, ઓવલ વગેરે), ક્લેરિટી (VS1, VVS2, FL), રંગ (D, E, F), સરેરાશ વજન અને કુલ જરૂરી નંગની વિગતો લખો...",
    btnSubmit: "જથ્થાબંધ ક્વોટેશન માટે વિનંતી કરો",
    
    feature1Title: "સુરત સ્ટુડિયો સોર્સિંગ",
    feature1Desc: "સીધા સુરત સ્થિત અમારા કટીંગ અને પોલીશીંગ એકમોમાંથી હીરા મેળવવામાં આવે છે.",
    feature2Title: "પ્રમાણિત પાર્સલ",
    feature2Desc: "તમારા લોટના દરેક હીરાનું GIA અથવા IGI દ્વારા વ્યક્તિગત રીતે મૂલ્યાંકન અને પ્રમાણપત્ર મળે છે.",
    feature3Title: "કસ્ટમ ડિઝાઇનિંગ",
    feature3Desc: "મફત CAD બ્લુપ્રિન્ટ્સ, કસ્ટમ એલોય કાસ્ટિંગ અને માસ્ટર સેટીંગ સુવિધા.",
    feature4Title: "લવચીક કરાર",
    feature4Desc: "તમારા ઉત્પાદન ચક્ર અનુસાર તમને અનુકૂળ જથ્થો મંગાવવાની સુવિધા આપતા વિશેષ કરારો.",
    
    volOpt1: "૫ થી ૧૫ કેરેટ (સ્ટાન્ડર્ડ પાર્સલ)",
    volOpt2: "૧૫ થી ૫૦ કેરેટ (મોટો લોટ)",
    volOpt3: "૫૦+ કેરેટ (સ્પેશિયલ મેન્યુફેક્ચરિંગ લોટ)",
    volOpt4: "ચાલુ સપ્લાય કોન્ટ્રાક્ટ (માસિક ધોરણે)",
    
    errPhoneRequired: "કૃપા કરીને તમારો ફોન નંબર દાખલ કરો.",
    errGstRequired: "કૃપા કરીને તમારો GST નંબર દાખલ કરો.",
    errGstInvalid: "કૃપા કરીને સાચો GST નંબર દાખલ કરો.",
    errGstFailed: "GST ચકાસણી નિષ્ફળ ગઈ. કૃપા કરીને GST નંબર તપાસો અને ફરી પ્રયાસ કરો.",
    errRateLimit: "ઘણી બધી વિનંતીઓ થઈ ગઈ છે. કૃપા કરીને થોડી વાર પછી ફરી પ્રયાસ કરો.",
  }
};

export default function B2BPage() {
  const [lang, setLang] = useState<"en" | "gu">("en");
  
  const [formData, setFormData] = useState({
    name: "",
    companyName: "",
    registrationNumber: "",
    email: "",
    phone: "",
    volume: "5 to 15 Carats (Standard Parcel)",
    details: ""
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const t = TRANSLATIONS[lang];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const validateGSTINFormatAndChecksum = (gstin: string): boolean => {
    if (!gstin) return false;
    const normalized = gstin.trim().toUpperCase();
    const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
    if (!gstinRegex.test(normalized)) return false;

    const characters = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    let sum = 0;
    for (let i = 0; i < 14; i++) {
      const charValue = characters.indexOf(normalized[i]);
      if (charValue === -1) return false;
      const multiplier = i % 2 === 0 ? 1 : 2;
      const product = charValue * multiplier;
      sum += Math.floor(product / 36) + (product % 36);
    }
    const remainder = sum % 36;
    const checkCode = (36 - remainder) % 36;
    return normalized[14] === characters[checkCode];
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg("");
    setSubmitStatus("idle");

    // Client-side validations
    if (!formData.phone.trim()) {
      setErrorMsg(t.errPhoneRequired);
      setSubmitStatus("error");
      setIsSubmitting(false);
      return;
    }

    if (!formData.registrationNumber.trim()) {
      setErrorMsg(t.errGstRequired);
      setSubmitStatus("error");
      setIsSubmitting(false);
      return;
    }

    if (!validateGSTINFormatAndChecksum(formData.registrationNumber)) {
      setErrorMsg(t.errGstInvalid);
      setSubmitStatus("error");
      setIsSubmitting(false);
      return;
    }

    try {
      const res = await fetch("/api/b2b", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          details: `[Submitted in ${lang.toUpperCase()}]\n${formData.details}`
        })
      });

      const data = await res.json();
      if (!res.ok) {
        let finalError = data.error || "Something went wrong.";
        if (typeof finalError === "string") {
          const lower = finalError.toLowerCase();
          if (lower.includes("phone number")) {
            finalError = t.errPhoneRequired;
          } else if (lower.includes("gst number is required")) {
            finalError = t.errGstRequired;
          } else if (lower.includes("invalid format") || lower.includes("checksum")) {
            finalError = t.errGstInvalid;
          } else if (lower.includes("verification failed") || lower.includes("active") || lower.includes("not found")) {
            finalError = t.errGstFailed;
          } else if (lower.includes("too many requests") || lower.includes("rate limit")) {
            finalError = t.errRateLimit;
          }
        }
        throw new Error(finalError);
      }

      setSubmitStatus("success");
      setFormData({
        name: "",
        companyName: "",
        registrationNumber: "",
        email: "",
        phone: "",
        volume: lang === "en" ? "5 to 15 Carats (Standard Parcel)" : "૫ થી ૧૫ કેરેટ (સ્ટાન્ડર્ડ પાર્સલ)",
        details: ""
      });
    } catch (err: any) {
      console.error(err);
      setSubmitStatus("error");
      setErrorMsg(err.message || "Failed to submit inquiry.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF8F4] text-[#1A1A1A] py-16 md:py-24 relative overflow-hidden">
      {/* Background design elements */}
      <div className="absolute top-0 left-0 w-[45vw] h-[45vw] bg-gradient-to-tr from-[#C9A14A]/3 to-transparent rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-10 right-0 w-[40vw] h-[40vw] bg-gradient-to-bl from-[#C9A14A]/3 to-transparent rounded-full blur-[120px] pointer-events-none" />

      {/* Language Selector Sticky/Top Floating Tab */}
      <div className="absolute top-6 right-6 md:right-12 z-[50]">
        <div className="bg-white border border-[#EAEAEA] backdrop-blur-md rounded-full p-1.5 flex items-center gap-1 shadow-lg">
          <div className="text-[#C9A14A] pl-2 pr-1.5">
            <Languages size={14} />
          </div>
          <button
            onClick={() => setLang("en")}
            className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider transition-all ${
              lang === "en"
                ? "bg-[#C9A14A] text-white shadow-md"
                : "text-[#666666] hover:text-[#1A1A1A]"
            }`}
          >
            English
          </button>
          <button
            onClick={() => setLang("gu")}
            className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
              lang === "gu"
                ? "bg-[#C9A14A] text-white shadow-md"
                : "text-[#666666] hover:text-[#1A1A1A]"
            }`}
          >
            ગુજરાતી (Gujarati)
          </button>
        </div>
      </div>

      <div className="container-custom relative z-10 px-4 mt-6 md:mt-0">
        
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center max-w-4xl mx-auto mb-16 md:mb-24"
        >
          <span className="text-[10px] uppercase tracking-[0.35em] text-[#C9A14A] font-bold bg-[#C9A14A]/10 px-3 py-1 rounded-full">
            {t.heroTag}
          </span>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-heading font-light tracking-wide mt-6 mb-6 text-[#1A1A1A] leading-tight">
            {t.heroTitle}<span className="font-serif italic text-[#C9A14A]">{t.heroTitleItalic}</span>
          </h1>
          <p className="text-[#666666] text-sm md:text-base leading-relaxed max-w-3xl mx-auto">
            {t.heroSub}
          </p>
        </motion.div>

        {/* Dynamic Pricing Note */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
          className="bg-gradient-to-r from-[#C9A14A]/5 to-transparent border border-[#C9A14A]/20 rounded-3xl p-6 md:p-8 max-w-4xl mx-auto mb-16 flex flex-col md:flex-row gap-6 items-center"
        >
          <div className="bg-[#C9A14A]/10 p-4 rounded-full text-[#C9A14A] flex-shrink-0">
            <TrendingUp size={28} strokeWidth={1.5} />
          </div>
          <div className="text-center md:text-left">
            <h3 className="text-[#1A1A1A] font-heading text-lg font-semibold mb-2">{t.noticeTitle}</h3>
            <p className="text-[#666666] text-xs md:text-sm leading-relaxed">
              {t.noticeDesc}
            </p>
          </div>
        </motion.div>

        {/* Wholesale Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-16 md:mb-24">
          {[
            { icon: Landmark, title: t.feature1Title, desc: t.feature1Desc },
            { icon: ShieldCheck, title: t.feature2Title, desc: t.feature2Desc },
            { icon: Sparkles, title: t.feature3Title, desc: t.feature3Desc },
            { icon: MessageSquare, title: t.feature4Title, desc: t.feature4Desc }
          ].map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 * index }}
              className="bg-white border border-[#EAEAEA] rounded-2xl p-6 text-center hover:border-[#C9A14A]/30 transition-all duration-500 group shadow-[0_4px_20px_rgba(0,0,0,0.02)]"
            >
              <div className="bg-[#C9A14A]/10 p-3.5 rounded-full text-[#C9A14A] w-fit mx-auto mb-4 group-hover:scale-110 transition-transform duration-500">
                <item.icon size={22} strokeWidth={1.5} />
              </div>
              <h3 className="text-[#1A1A1A] font-semibold text-sm mb-2">{item.title}</h3>
              <p className="text-[#666666] text-xs leading-relaxed">{item.desc}</p>
            </motion.div>
          ))}
        </div>

        {/* Form and Contact Channels */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          
          {/* Left Column: B2B Support */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="lg:col-span-5 space-y-6"
          >
            <div className="bg-white border border-[#EAEAEA] rounded-3xl p-8 shadow-[0_4px_24px_rgba(0,0,0,0.02)]">
              <h2 className="text-2xl font-heading text-[#1A1A1A] tracking-wide mb-6">{t.conciergeTitle}</h2>
              
              <div className="space-y-6">
                {/* Phone */}
                <div className="flex gap-4 items-start">
                  <div className="bg-[#C9A14A]/10 p-3 rounded-xl text-[#C9A14A] mt-1">
                    <Phone size={18} strokeWidth={1.5} />
                  </div>
                  <div>
                    <h4 className="text-[10px] uppercase tracking-widest text-[#C9A14A] font-semibold mb-1">{t.conciergeHotline}</h4>
                    <p className="text-[#666666] text-xs mb-2">{t.conciergeHotlineDesc}</p>
                    <div className="flex flex-col gap-1">
                      <a href="tel:+919724627122" className="text-[#1A1A1A] text-base font-semibold hover:text-[#C9A14A] transition-colors">
                        +91 97246 27122
                      </a>
                      <a href="tel:+919427143105" className="text-[#1A1A1A] text-base font-semibold hover:text-[#C9A14A] transition-colors">
                        +91 94271 43105
                      </a>
                    </div>
                  </div>
                </div>

                {/* Email */}
                <div className="flex gap-4 items-start border-t border-[#EAEAEA] pt-6">
                  <div className="bg-[#C9A14A]/10 p-3 rounded-xl text-[#C9A14A] mt-1">
                    <Mail size={18} strokeWidth={1.5} />
                  </div>
                  <div>
                    <h4 className="text-[10px] uppercase tracking-widest text-[#C9A14A] font-semibold mb-1">{t.conciergeEmail}</h4>
                    <p className="text-[#666666] text-xs mb-2">{t.conciergeEmailDesc}</p>
                    <a href="mailto:luxezynora@gmail.com" className="text-[#1A1A1A] text-base font-semibold hover:text-[#C9A14A] transition-colors">
                      luxezynora@gmail.com
                    </a>
                  </div>
                </div>

                {/* WhatsApp */}
                <div className="pt-4 border-t border-[#EAEAEA]">
                  <a
                    href="https://wa.me/919724627122?text=Hello%20Zynora%20Wholesale,%20we%20want%20to%20inquire%20about%20bulk%20diamond%20pricing."
                    target="_blank"
                    rel="noreferrer"
                    className="w-full flex justify-center items-center gap-3 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl transition-all duration-300 shadow-md text-sm"
                  >
                    <MessageSquare size={18} />
                    {t.conciergeWhatsAppBtn}
                  </a>
                </div>
              </div>
            </div>

            <div className="bg-white border border-[#EAEAEA] p-6 rounded-2xl text-xs text-[#666666] leading-relaxed shadow-[0_4px_12px_rgba(0,0,0,0.01)]">
              {t.conciergeNotice}
            </div>
          </motion.div>

          {/* Right Column: B2B Request Form */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="lg:col-span-7 bg-white border border-[#EAEAEA] rounded-3xl p-8 shadow-[0_4px_24px_rgba(0,0,0,0.02)]"
          >
            <h2 className="text-2xl font-heading text-[#1A1A1A] tracking-wide mb-2">{t.formTitle}</h2>
            <p className="text-[#666666] text-xs mb-8">{t.formSub}</p>

            <form onSubmit={handleSubmit} className="space-y-6">
              {submitStatus === "success" && (
                <motion.div
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 p-4 rounded-xl flex gap-3 items-center text-sm"
                >
                  <CheckCircle2 className="flex-shrink-0 text-emerald-600" size={18} />
                  <div>
                    <p className="font-semibold">Inquiry Submitted Successfully!</p>
                    <p className="text-xs text-zinc-500">{t.formSuccessDesc}</p>
                  </div>
                </motion.div>
              )}

              {submitStatus === "error" && (
                <motion.div
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="bg-red-500/10 border border-red-500/30 text-red-500 p-4 rounded-xl text-sm"
                >
                  <p className="font-semibold">Submission Failed</p>
                  <p className="text-xs text-red-700">{errorMsg}</p>
                </motion.div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-[#C9A14A] font-semibold mb-2">{t.labelContactName}</label>
                  <input
                    type="text"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder={t.phContactName}
                    className="w-full bg-white border border-[#EAEAEA] focus:border-[#C9A14A] focus:outline-none text-sm text-[#1A1A1A] px-4 py-3 rounded-xl transition-colors placeholder-zinc-400"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-[#C9A14A] font-semibold mb-2">{t.labelCompanyName}</label>
                  <input
                    type="text"
                    name="companyName"
                    required
                    value={formData.companyName}
                    onChange={handleInputChange}
                    placeholder={t.phCompanyName}
                    className="w-full bg-white border border-[#EAEAEA] focus:border-[#C9A14A] focus:outline-none text-sm text-[#1A1A1A] px-4 py-3 rounded-xl transition-colors placeholder-zinc-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-[#C9A14A] font-semibold mb-2">{t.labelGst}</label>
                  <input
                    type="text"
                    name="registrationNumber"
                    required
                    value={formData.registrationNumber}
                    onChange={handleInputChange}
                    placeholder={t.phGst}
                    className="w-full bg-white border border-[#EAEAEA] focus:border-[#C9A14A] focus:outline-none text-sm text-[#1A1A1A] px-4 py-3 rounded-xl transition-colors placeholder-zinc-400"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-[#C9A14A] font-semibold mb-2">{t.labelVolume}</label>
                  <select
                    name="volume"
                    value={formData.volume}
                    onChange={handleInputChange}
                    className="w-full bg-white border border-[#EAEAEA] focus:border-[#C9A14A] focus:outline-none text-sm text-[#1A1A1A] px-4 py-3 rounded-xl transition-colors"
                  >
                    <option value={t.volOpt1}>{t.volOpt1}</option>
                    <option value={t.volOpt2}>{t.volOpt2}</option>
                    <option value={t.volOpt3}>{t.volOpt3}</option>
                    <option value={t.volOpt4}>{t.volOpt4}</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-[#C9A14A] font-semibold mb-2">{t.labelEmail}</label>
                  <input
                    type="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder={t.phEmail}
                    className="w-full bg-white border border-[#EAEAEA] focus:border-[#C9A14A] focus:outline-none text-sm text-[#1A1A1A] px-4 py-3 rounded-xl transition-colors placeholder-zinc-400"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-[#C9A14A] font-semibold mb-2">{t.labelPhone}</label>
                  <input
                    type="tel"
                    name="phone"
                    required
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder={t.phPhone}
                    className="w-full bg-white border border-[#EAEAEA] focus:border-[#C9A14A] focus:outline-none text-sm text-[#1A1A1A] px-4 py-3 rounded-xl transition-colors placeholder-zinc-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-widest text-[#C9A14A] font-semibold mb-2">{t.labelSpecs}</label>
                <textarea
                  name="details"
                  required
                  rows={4}
                  value={formData.details}
                  onChange={handleInputChange}
                  placeholder={t.phSpecs}
                  className="w-full bg-white border border-[#EAEAEA] focus:border-[#C9A14A] focus:outline-none text-[#1A1A1A] text-sm px-4 py-3 rounded-xl transition-colors placeholder-zinc-400 resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex justify-center items-center gap-2 py-4 bg-gradient-to-r from-[#C9A14A] to-[#B58F3B] hover:from-[#B58F3B] hover:to-[#C9A14A] text-white font-semibold rounded-xl transition-all duration-500 tracking-wider text-xs uppercase disabled:opacity-50"
              >
                {isSubmitting ? (
                  <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Send size={14} />
                    {t.btnSubmit}
                  </>
                )}
              </button>
            </form>
          </motion.div>
        </div>

      </div>
    </div>
  );
}
