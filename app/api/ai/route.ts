import { NextResponse } from "next/server";

const SYSTEM_INSTRUCTION = `
You are Zynora Luxe AI, a premium virtual diamond concierge and wholesale advisor. 
You assist buyers with certified diamonds, custom ring designs from our Surat studio, and B2B wholesale pricing.
Key details you must know:
- Zynora Luxe is based in Surat, Gujarat, India (the global diamond cutting hub).
- B2B / Wholesale orders do not have fixed rates. They are dynamic, floating prices negotiated individually based on weight brackets, clarity parcels, and Rapaport indexes.
- Contact numbers: +91 97246 27122 and +91 94271 43105.
- Email: luxezynora@gmail.com.
- Zynora offers a Lifetime Manufacture Warranty, Certified Diamonds (GIA/IGI), free custom CAD designs, and one complimentary ring resizing within the first year.
- Keep your tone extremely polite, luxury-oriented, and professional.
- You can converse fluently in both English and Gujarati (ગુજરાતી). If asked a question in Gujarati, reply in Gujarati.
- Be concise (2-4 sentences max per response) to fit nicely in a mobile chat bubble.
`;

// Context-aware fallback responses in case GEMINI_API_KEY is not configured
const FALLBACK_RESPONSES = [
  {
    keywords: ["b2b", "wholesale", "bulk", "quantity", "businessman", "parcels", "જથ્થાબંધ", "વેપાર", "જથ્થો"],
    en: "At Zynora Luxe, we offer bespoke B2B rates for bulk diamond purchases (5+ carats). Since there is no fixed rate for large volumes, pricing is floating and depends on daily Rapaport indexes and package sizes. Please fill out our B2B form at /b2b or call +91 97246 27122 to speak with our wholesale desk.",
    gu: "ઝાયનોરા લક્સ ખાતે, અમે જથ્થાબંધ હીરાની ખરીદી (૫+ કેરેટ) માટે બી2બી (B2B) ભાવો ઓફર કરીએ છીએ. જથ્થાબંધ ખરીદી માટે કોઈ નિશ્ચિત ભાવ નથી, તેથી ભાવ બજાર ઇન્ડેક્સ અને વજન પર આધાર રાખે છે. કૃપા કરીને /b2b પર અમારું ફોર્મ ભરો અથવા સીધા સંપર્ક માટે +91 97246 27122 પર ફોન કરો."
  },
  {
    keywords: ["custom", "bespoke", "design", "make", "create", "cad", "કસ્ટમ", "ડિઝાઇન", "બનાવવું"],
    en: "Our design studio in Surat offers complimentary 3D CAD renders for bespoke ring configurations. Once you submit a design or reference image, we select certified diamonds (GIA/IGI), cast the gold setting, and hand-polish it. Contact our customization experts on WhatsApp or via our Customer Care page (/customer-care).",
    gu: "સુરત સ્થિત અમારો સ્ટુડિયો કસ્ટમ રિંગ્સ માટે મફત 3D CAD નકશા બનાવી આપે છે. તમે તમારી ડિઝાઈનની વિગતો આપો એટલે અમે પ્રમાણિત હીરા (GIA/IGI) પસંદ કરી, સોનાનું ફ્રેમ કાસ્ટિંગ કરીને તેને આખરી ઓપ આપીએ છીએ. /customer-care પેજ પર વધુ વિગતો મેળવી શકો છો."
  },
  {
    keywords: ["phone", "mobile", "contact", "number", "call", "whatsapp", "નંબર", "મોબાઈલ", "ફોન", "સંપર્ક"],
    en: "You can reach Zynora Luxe via call or WhatsApp at +91 97246 27122 or +91 94271 43105. For official B2B proposals, email us at luxezynora@gmail.com.",
    gu: "તમે અમારા ડિઝાઇનર્સ સાથે સીધા ફોન અથવા વોટ્સએપ પર +91 97246 27122 અથવા +91 94271 43105 પર સંપર્ક કરી શકો છો. ઈમેઈલ આઈડી luxezynora@gmail.com છે."
  },
  {
    keywords: ["diamond", "quality", "4c", "gia", "igi", "certified", "હીરા", "સર્ટિફાઇડ"],
    en: "All Zynora Luxe diamonds are 100% certified by premier laboratories such as GIA and IGI, ensuring verified color, clarity, cut, and carat weight. Every diamond order is shipped with its original physical grading certificate.",
    gu: "ઝાયનોરા લક્સના દરેક હીરા GIA અથવા IGI લેબોરેટરી દ્વારા પ્રમાણિત છે. રંગ, ક્લેરિટી અને કટ સંપૂર્ણ પ્રમાણિત હોય છે અને દરેક ખરીદી સાથે મૂળ સર્ટિફિકેટ મોકલવામાં આવે છે."
  },
  {
    keywords: ["resizing", "resize", "size", "warranty", "રીસાઈઝ", "વોરંટી"],
    en: "We provide a Lifetime Manufacture Warranty on all jewelry. Additionally, we offer one complimentary ring resizing within the first year of purchase, as well as free laser engraving inside the band.",
    gu: "અમે તમામ જ્વેલરી પર લાઇફટાઇમ મેન્યુફેક્ચરિંગ વોરંટી આપીએ છીએ. વધુમાં, ખરીદીના પ્રથમ વર્ષમાં એક વાર મફત રિંગ રીસાઇઝિંગ અને મફત લેસર કોતરણી કરી આપીએ છીએ."
  }
];

const DEFAULT_EN = "Welcome to Zynora Luxe! I can assist you with custom ring configurations, Surat factory direct sourcing, and B2B wholesale diamond parcel rates. How may I serve you today?";
const DEFAULT_GU = "ઝાયનોરા લક્સમાં આપનું સ્વાગત છે! હું તમને કસ્ટમ રિંગ્સ, સુરત ફેક્ટરી સોર્સિંગ અને જથ્થાબંધ હીરાના ખરીદ ભાવો વિશે માહિતી આપી શકું છું. હું તમારી શું સેવા કરી શકું?";

export async function POST(request: Request) {
  try {
    const { prompt, history, language } = await request.json();

    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required." }, { status: 400 });
    }

    const isGujarati = language === "gu" || /[\u0A80-\u0AFF]/.test(prompt);
    const targetLang = isGujarati ? "gu" : "en";

    const apiKey = process.env.GEMINI_API_KEY;

    if (apiKey) {
      // Call official Gemini API
      try {
        const formattedHistory = (history || []).map((msg: any) => ({
          role: msg.sender === "user" ? "user" : "model",
          parts: [{ text: msg.text }]
        }));

        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [
                {
                  role: "user",
                  parts: [{ text: SYSTEM_INSTRUCTION }]
                },
                ...formattedHistory,
                {
                  role: "user",
                  parts: [{ text: prompt }]
                }
              ],
              generationConfig: {
                maxOutputTokens: 250,
                temperature: 0.7
              }
            })
          }
        );

        if (response.ok) {
          const data = await response.json();
          const replyText = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (replyText) {
            return NextResponse.json({ text: replyText.trim() });
          }
        } else {
          console.warn("Gemini API returned error status:", response.status);
        }
      } catch (geminiError) {
        console.error("Gemini API call failed, falling back to local engine:", geminiError);
      }
    }

    // Local rule-based context matching fallback
    const lowerPrompt = prompt.toLowerCase();
    let reply = targetLang === "gu" ? DEFAULT_GU : DEFAULT_EN;

    for (const item of FALLBACK_RESPONSES) {
      const matches = item.keywords.some(keyword => lowerPrompt.includes(keyword));
      if (matches) {
        reply = targetLang === "gu" ? item.gu : item.en;
        break;
      }
    }

    return NextResponse.json({ text: reply });
  } catch (error: any) {
    console.error("Error in AI Route:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
