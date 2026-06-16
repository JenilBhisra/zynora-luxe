"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Phone, Mail, MessageSquare, ShieldCheck, Clock, CheckCircle2, ChevronDown, Award, Send } from "lucide-react";
import Image from "next/image";

const FAQ_ITEMS = [
  {
    question: "How does the custom design process work?",
    answer: "Our bespoke process begins with your vision. You can submit a request detailing your ideas or reference images. A Zynora Luxe consultant will connect with you to refine the concept, create high-fidelity 3D CAD renders, select the perfect certified diamond, and handcraft your dream ring to perfection in our Surat studio."
  },
  {
    question: "Can I customize an existing setting from your catalog?",
    answer: "Absolutely! Any setting from our shop can be customized. Whether you want to change the metal type (e.g. 18K Yellow Gold instead of White Gold), modify the band thickness, adjust prong designs, or add custom micro-pave diamonds, we can build it according to your exact preferences."
  },
  {
    question: "How long does a customized order take to ship?",
    answer: "Standard orders ship within 5-7 business days. Completely custom or bespoke designs typically take 10-15 business days, which includes the CAD design phase, 3D printing, casting, manual diamond setting, hand-polishing, and strict quality control verification."
  },
  {
    question: "Do you offer ring resizing and engraving services?",
    answer: "Yes, we offer one complimentary resizing within the first year of purchase for all Zynora Luxe rings. We also offer laser engraving of names, dates, or custom symbols inside the ring band at no additional cost."
  },
  {
    question: "Are all your diamonds certified?",
    answer: "Every single diamond we supply comes with an official certificate from world-renowned grading laboratories such as the Gemological Institute of America (GIA) or International Gemological Institute (IGI). All certificates can be verified online, ensuring absolute transparency."
  }
];

export default function CustomerCarePage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "Bespoke Ring Customization",
    message: ""
  });
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg("");
    setSubmitStatus("idle");

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong.");

      setSubmitStatus("success");
      setFormData({
        name: "",
        email: "",
        phone: "",
        subject: "Bespoke Ring Customization",
        message: ""
      });
    } catch (err: any) {
      console.error(err);
      setSubmitStatus("error");
      setErrorMsg(err.message || "Failed to submit request. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleFaq = (index: number) => {
    setActiveFaq(activeFaq === index ? null : index);
  };

  return (
    <div className="min-h-screen bg-[#0B0B0C] text-zinc-100 py-16 md:py-24 relative overflow-hidden">
      {/* Background blobs for luxury gradient atmosphere */}
      <div className="absolute top-0 right-0 w-[40vw] h-[40vw] bg-gradient-to-b from-[#D6B25E]/5 to-transparent rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-10 left-0 w-[35vw] h-[35vw] bg-gradient-to-t from-[#D6B25E]/4 to-transparent rounded-full blur-[100px] pointer-events-none" />

      <div className="container-custom relative z-10 px-4">
        {/* Header Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center max-w-3xl mx-auto mb-16 md:mb-24 mt-4"
        >
          <span className="text-[11px] uppercase tracking-[0.3em] text-[#D6B25E] font-semibold">Zynora Care</span>
          <h1 className="text-4xl md:text-5xl font-heading font-light tracking-wide mt-3 mb-6 text-white leading-tight">
            Customer Care & <span className="font-serif italic text-[#D6B25E]">Bespoke Requests</span>
          </h1>
          <p className="text-zinc-400 text-sm md:text-base leading-relaxed">
            If you desire any type of custom work, modifying an existing design, selecting a unique layout, or general assistance, our experts are here to turn your vision into reality. We handcraft your dreams in our luxury Surat studio.
          </p>
        </motion.div>

        {/* 3 Pillars (Trust/Warranty markers) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16 md:mb-24">
          {[
            { icon: ShieldCheck, title: "Lifetime Warranty", desc: "Every Zynora piece is crafted with the highest standards and backed by a lifetime manufacture warranty." },
            { icon: Award, title: "Certified Diamonds", desc: "We source only premium ethical diamonds certified by leading grading institutes like GIA and IGI." },
            { icon: Clock, title: "24/7 Dedicated Care", desc: "Reach our concierges anytime. We respond to messages, design iterations, and calls instantly." }
          ].map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 * index }}
              className="bg-zinc-900/40 border border-zinc-800/60 rounded-2xl p-6 md:p-8 hover:border-[#D6B25E]/30 transition-all duration-500 group flex gap-5 items-start"
            >
              <div className="bg-[#D6B25E]/10 p-3 rounded-xl text-[#D6B25E] group-hover:scale-110 transition-transform duration-500">
                <item.icon size={22} strokeWidth={1.5} />
              </div>
              <div>
                <h3 className="text-base font-semibold text-white mb-2">{item.title}</h3>
                <p className="text-zinc-400 text-xs md:text-sm leading-relaxed">{item.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Content Columns: Form & Info */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start mb-20 md:mb-28">
          {/* Left Column: Contact info & Address */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="lg:col-span-5 space-y-8"
          >
            <div className="bg-zinc-900/30 border border-zinc-800/60 rounded-3xl p-8 backdrop-blur-md relative overflow-hidden">
              <h2 className="text-2xl font-heading text-white tracking-wide mb-6">Contact Channels</h2>
              
              <div className="space-y-6">
                {/* Phone */}
                <div className="flex gap-4 items-start">
                  <div className="bg-[#D6B25E]/10 p-3 rounded-xl text-[#D6B25E] mt-1">
                    <Phone size={18} strokeWidth={1.5} />
                  </div>
                  <div>
                    <h4 className="text-xs uppercase tracking-widest text-[#D6B25E] font-semibold mb-1">Call / WhatsApp</h4>
                    <p className="text-zinc-400 text-xs mb-2">Speak directly with our designers:</p>
                    <div className="flex flex-col gap-1.5">
                      <a href="tel:+919724627122" className="text-white text-base font-medium hover:text-[#D6B25E] transition-colors flex items-center gap-2">
                        +91 97246 27122
                      </a>
                      <a href="tel:+919427143105" className="text-white text-base font-medium hover:text-[#D6B25E] transition-colors flex items-center gap-2">
                        +91 94271 43105
                      </a>
                    </div>
                  </div>
                </div>

                {/* Email */}
                <div className="flex gap-4 items-start border-t border-zinc-800/60 pt-6">
                  <div className="bg-[#D6B25E]/10 p-3 rounded-xl text-[#D6B25E] mt-1">
                    <Mail size={18} strokeWidth={1.5} />
                  </div>
                  <div>
                    <h4 className="text-xs uppercase tracking-widest text-[#D6B25E] font-semibold mb-1">Official Support Email</h4>
                    <p className="text-zinc-400 text-xs mb-2">For design portfolios & high-res assets:</p>
                    <a href="mailto:luxezynora@gmail.com" className="text-white text-base font-medium hover:text-[#D6B25E] transition-colors">
                      luxezynora@gmail.com
                    </a>
                  </div>
                </div>

                {/* WhatsApp Action button */}
                <div className="pt-4 border-t border-zinc-800/60">
                  <a
                    href="https://wa.me/919724627122?text=Hello%20Zynora%20Luxe,%20I%20am%20interested%20in%20a%20customization%20request."
                    target="_blank"
                    rel="noreferrer"
                    className="w-full flex justify-center items-center gap-3 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl transition-all duration-300 shadow-lg text-sm"
                  >
                    <MessageSquare size={18} />
                    Chat on WhatsApp
                  </a>
                </div>
              </div>
            </div>

            {/* Premium Note */}
            <div className="bg-gradient-to-r from-[#D6B25E]/10 to-transparent border-l-2 border-[#D6B25E] p-6 rounded-r-2xl">
              <h4 className="text-white font-semibold text-sm mb-1.5">No Customization is Too Small</h4>
              <p className="text-zinc-400 text-xs md:text-sm leading-relaxed">
                Whether you want to source a specific oval diamond size, customize the color of accents, or engrave a unique story inside a ring, we handle every detail with premium precision.
              </p>
            </div>
          </motion.div>

          {/* Right Column: Customization Request Form */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="lg:col-span-7 bg-zinc-900/20 border border-zinc-800/60 rounded-3xl p-8 backdrop-blur-md relative"
          >
            <h2 className="text-2xl font-heading text-white tracking-wide mb-2">Send Customization Request</h2>
            <p className="text-zinc-400 text-xs mb-8">Fill out the details below and we will contact you within 24 hours.</p>

            <form onSubmit={handleSubmit} className="space-y-6">
              {submitStatus === "success" && (
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 p-4 rounded-xl flex gap-3 items-center"
                >
                  <CheckCircle2 className="flex-shrink-0 text-emerald-400" size={20} />
                  <div>
                    <p className="text-sm font-semibold">Request Submitted Successfully!</p>
                    <p className="text-xs text-zinc-400">Our Zynora Luxe designers will review your specs and email you soon.</p>
                  </div>
                </motion.div>
              )}

              {submitStatus === "error" && (
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-xl flex gap-3 items-center"
                >
                  <div className="text-sm">
                    <p className="font-semibold">Submission Failed</p>
                    <p className="text-xs text-zinc-400">{errorMsg}</p>
                  </div>
                </motion.div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-[#D6B25E] font-semibold mb-2">Your Name *</label>
                  <input
                    type="text"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Enter your name"
                    className="w-full bg-zinc-950 border border-zinc-800 focus:border-[#D6B25E] focus:outline-none text-sm text-white px-4 py-3 rounded-xl transition-colors placeholder-zinc-600"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-[#D6B25E] font-semibold mb-2">Email Address *</label>
                  <input
                    type="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="Enter your email"
                    className="w-full bg-zinc-950 border border-zinc-800 focus:border-[#D6B25E] focus:outline-none text-sm text-white px-4 py-3 rounded-xl transition-colors placeholder-zinc-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-[#D6B25E] font-semibold mb-2">Phone Number</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="e.g. +91 98765 43210"
                    className="w-full bg-zinc-950 border border-zinc-800 focus:border-[#D6B25E] focus:outline-none text-sm text-white px-4 py-3 rounded-xl transition-colors placeholder-zinc-600"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-[#D6B25E] font-semibold mb-2">Customization Type</label>
                  <select
                    name="subject"
                    value={formData.subject}
                    onChange={handleInputChange}
                    className="w-full bg-zinc-950 border border-zinc-800 focus:border-[#D6B25E] focus:outline-none text-sm text-white px-4 py-3 rounded-xl transition-colors"
                  >
                    <option value="Bespoke Ring Customization">Bespoke Ring Design (CAD Request)</option>
                    <option value="Diamond Sourcing/Layout">Custom Diamond Sourcing</option>
                    <option value="Sizing or Metal Upgrade">Setting Modification (Metal, Width)</option>
                    <option value="Custom Laser Engraving">Laser Engraving Request</option>
                    <option value="General Support Inquiry">General Help / Support</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-widest text-[#D6B25E] font-semibold mb-2">Your Vision & Details *</label>
                <textarea
                  name="message"
                  required
                  rows={4}
                  value={formData.message}
                  onChange={handleInputChange}
                  placeholder="Describe your design vision, sizing preference, diamond shape interest, or anything else you'd like to customize..."
                  className="w-full bg-zinc-950 border border-zinc-800 focus:border-[#D6B25E] focus:outline-none text-sm text-white px-4 py-3 rounded-xl transition-colors placeholder-zinc-600 resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex justify-center items-center gap-2 py-4 bg-gradient-to-r from-[#D6B25E] to-[#C9A24A] hover:from-[#E8C26E] hover:to-[#D6B25E] text-[#0B0B0C] font-semibold rounded-xl transition-all duration-500 tracking-wider text-xs uppercase disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <span className="w-5 h-5 border-2 border-[#0B0B0C] border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Send size={14} />
                    Submit Custom Request
                  </>
                )}
              </button>
            </form>
          </motion.div>
        </div>

        {/* FAQs Accordion Section */}
        <div className="max-w-4xl mx-auto border-t border-zinc-800/80 pt-16 md:pt-24">
          <h2 className="text-3xl font-heading text-center text-white tracking-wide mb-12">
            Frequently Asked <span className="font-serif italic text-[#D6B25E]">Questions</span>
          </h2>
          
          <div className="space-y-4">
            {FAQ_ITEMS.map((faq, index) => {
              const isOpen = activeFaq === index;
              return (
                <div
                  key={index}
                  className="bg-zinc-900/30 border border-zinc-800/60 rounded-2xl overflow-hidden transition-all duration-300"
                >
                  <button
                    onClick={() => toggleFaq(index)}
                    className="w-full flex justify-between items-center p-6 text-left focus:outline-none group"
                  >
                    <span className="text-sm md:text-base font-medium text-white group-hover:text-[#D6B25E] transition-colors duration-300 pr-4">
                      {faq.question}
                    </span>
                    <motion.div
                      animate={{ rotate: isOpen ? 180 : 0 }}
                      transition={{ duration: 0.3 }}
                      className="text-[#D6B25E] flex-shrink-0"
                    >
                      <ChevronDown size={18} />
                    </motion.div>
                  </button>

                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <div className="p-6 pt-0 text-zinc-400 text-xs md:text-sm leading-relaxed border-t border-zinc-800/40">
                          {faq.answer}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
