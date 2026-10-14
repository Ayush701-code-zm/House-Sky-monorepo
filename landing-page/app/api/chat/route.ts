import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { PROPERTIES } from '@/data/properties';
import { getApiBaseUrl } from '@/utils/api';

// Lead-Generation Focused Knowledge Base System Prompt
const REAL_ESTATE_KB = `
You are the Lead-Generation AI Real Estate & Investment Advisory Concierge for House & Sky / Hippo Infra.
Your primary goal is to provide helpful property insights AND elegantly capture lead contact details (Phone / WhatsApp) from luxury buyers and investors.

### KNOWLEDGE BASE:

1. PROPERTIES & TOWNSHIPS:
- Bandra West, Mumbai: The Solitaire Sky Villa & Penthouses (₹24.5 Cr - ₹45 Cr). 5,400 sq ft, 360° Arabian Sea views.
- Assagao, North Goa: Casa De Assagao Luxury Villas (₹8.5 Cr - ₹16 Cr). Private plunge pools, Portuguese-modern architecture.
- Golf Course Road, Gurgaon / Delhi NCR: Credenza Duplex & Golf View Suites (₹14.2 Cr - ₹22 Cr). Private sky decks.
- Dholera SIR & Noida Smart City Townships: NA Approved Gated Plot developments with complete layout maps (Plot sizes 180 - 500 sq yrd).

2. PLOT PRICING & BREAKDOWN FORMULA:
- Base Rate per sq yard on sellable area.
- PLC (Preferential Location Charges) + OTMC (₹250/sq yrd) + 18% GST on non-land charges.

3. MLM AGENT NETWORK:
- Ranks from Business Executive (5%) to Director Sales (20%). Direct differential payouts.

4. LEAD GENERATION CONVERSATION RULES:
- Be warm, executive, and helpful.
- ALWAYS conclude your answer with an encouraging lead-capture invitation (e.g. "Would you like our senior desk to WhatsApp you the complete price brochure or schedule a free site visit cab? Please share your phone number or tap 'Request Callback' below!").
`;

const FALLBACK_MODELS = [
  'gemini-3.6-flash',
  'gemini-3.1-pro-preview',
  'gemini-2.5-flash',
  'gemini-1.5-pro',
  'gemini-1.5-flash'
];

export async function POST(req: Request) {
  try {
    const { message, chatHistory } = await req.json();

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    const lower = message.toLowerCase();
    let suggestedProperties: Array<{ title: string; price: string; location: string; slug: string }> = [];

    // Filter relevant property cards based on message context
    if (lower.includes('bandra') || lower.includes('mumbai') || lower.includes('penthouse') || lower.includes('sea')) {
      const p = PROPERTIES.find((prop) => prop.slug.includes('bandra')) || PROPERTIES[0];
      suggestedProperties.push({
        title: p.title,
        price: p.formattedPrice,
        location: `${p.location.area}, ${p.location.city}`,
        slug: p.slug,
      });
    } else if (lower.includes('goa') || lower.includes('villa') || lower.includes('assagao')) {
      const p = PROPERTIES.find((prop) => prop.slug.includes('goa')) || PROPERTIES[1];
      suggestedProperties.push({
        title: p.title,
        price: p.formattedPrice,
        location: `${p.location.area}, ${p.location.city}`,
        slug: p.slug,
      });
    } else if (lower.includes('gurgaon') || lower.includes('delhi') || lower.includes('golf') || lower.includes('ncr')) {
      const p = PROPERTIES.find((prop) => prop.slug.includes('gurgaon')) || PROPERTIES[2];
      suggestedProperties.push({
        title: p.title,
        price: p.formattedPrice,
        location: `${p.location.area}, ${p.location.city}`,
        slug: p.slug,
      });
    } else {
      PROPERTIES.slice(0, 2).forEach((p) => {
        suggestedProperties.push({
          title: p.title,
          price: p.formattedPrice,
          location: `${p.location.area}, ${p.location.city}`,
          slug: p.slug,
        });
      });
    }

    // 1. AUTO PHONE NUMBER EXTRACTION FOR SEAMLESS LEAD LOGGING
    let leadCaptured = false;
    const phoneRegex = /(?:\+91[\-\s]?)?[6789]\d{9}/g;
    const phoneMatch = message.match(phoneRegex);

    if (phoneMatch && phoneMatch.length > 0) {
      const extractedPhone = phoneMatch[0].replace(/[^\d+]/g, '');
      try {
        const backendUrl = getApiBaseUrl();
        await fetch(`${backendUrl}/public/chatbot-lead`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: 'Chatbot Visitor',
            phone: extractedPhone,
            interest: lower.includes('visit') ? 'Site Visit' : lower.includes('brochure') ? 'Brochure Request' : 'Property Discovery',
            message: message
          })
        }).catch(() => null);
        leadCaptured = true;
      } catch (e) {
        console.error('Failed to log lead automatically:', e);
      }
    }

    let aiReply = '';
    const apiKey = process.env.GEMINI_API_KEY;

    // 2. Attempt AI Generation with Model Fallbacks
    if (apiKey) {
      const genAI = new GoogleGenerativeAI(apiKey);

      for (const modelName of FALLBACK_MODELS) {
        try {
          const model = genAI.getGenerativeModel({ model: modelName });
          const prompt = `${REAL_ESTATE_KB}\n\nUSER QUESTION: "${message}"\n\nProvide a concise, helpful answer (2-4 sentences) and invite them to request a callback or brochure via WhatsApp:`;
          const result = await model.generateContent(prompt);
          const responseText = result.response.text();
          if (responseText && responseText.trim().length > 0) {
            aiReply = responseText.trim();
            break;
          }
        } catch (modelErr: any) {
          console.warn(`[Gemini Chat AI] Model ${modelName} attempted note:`, modelErr?.message || modelErr);
        }
      }
    }

    // 3. Lead-Optimized Fallbacks
    if (!aiReply) {
      if (leadCaptured) {
        aiReply = `🎉 Thank you! We have received your contact number (${phoneMatch ? phoneMatch[0] : ''}). Our senior real estate advisor will WhatsApp you the complete brochure & price breakdown within 10 minutes.`;
      } else if (lower.includes('callback') || lower.includes('call') || lower.includes('contact') || lower.includes('phone') || lower.includes('number')) {
        aiReply = `I would be happy to arrange an instant call back from our property director. Please share your phone number or fill out the quick form below!`;
      } else if (lower.includes('site visit') || lower.includes('visit') || lower.includes('cab')) {
        aiReply = `We offer free AC cab site visits for Dholera SIR, Noida Smart City, and Gurgaon estates. Share your mobile number below to book your private tour slot!`;
      } else if (lower.includes('brochure') || lower.includes('pdf') || lower.includes('whatsapp')) {
        aiReply = `We can send the high-res layout map & price brochure straight to your WhatsApp. Please leave your mobile number below!`;
      } else if (lower.includes('bandra') || lower.includes('mumbai')) {
        const p = PROPERTIES.find((prop) => prop.slug.includes('bandra')) || PROPERTIES[0];
        aiReply = `We feature luxury penthouses in Bandra West including **${p.title}** (${p.formattedPrice}). Would you like us to WhatsApp you the full floorplan & viewing availability?`;
      } else if (lower.includes('goa') || lower.includes('villa')) {
        const p = PROPERTIES.find((prop) => prop.slug.includes('goa')) || PROPERTIES[1];
        aiReply = `In Goa, we represent private architectural villas such as **${p.title}** (${p.formattedPrice}). Leave your mobile number to get the legal title verification report & villa video!`;
      } else {
        aiReply = `Welcome to House & Sky Real Estate Advisory. We represent premium penthouses, villas, and township plots across India. How may I assist you today? You can also request an instant price brochure or site visit below.`;
      }
    }

    const showLeadForm = !leadCaptured && (
      lower.includes('call') ||
      lower.includes('visit') ||
      lower.includes('price') ||
      lower.includes('brochure') ||
      lower.includes('quote') ||
      lower.includes('contact') ||
      lower.includes('bulk') ||
      lower.includes('book')
    );

    return NextResponse.json({
      reply: aiReply,
      properties: suggestedProperties,
      leadCaptured,
      showLeadForm,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Chat API Error:', error);
    return NextResponse.json(
      {
        reply: 'Welcome to House & Sky Real Estate Advisory. Leave your phone number to receive our latest luxury property price sheet directly on WhatsApp!',
        properties: [],
        leadCaptured: false,
        showLeadForm: true,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
