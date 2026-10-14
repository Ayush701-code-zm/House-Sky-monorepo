import React, { useState } from 'react';
import { Bot, Save, Sparkles, Database, FileText, CheckCircle2 } from 'lucide-react';

export const AIKnowledgePage: React.FC = () => {
  const [systemPrompt, setSystemPrompt] = useState<string>(
    `You are the House & Sky AI Real Estate Concierge. You represent curated trophy penthouses, modern villas, and architectural estates across Mumbai, Goa, Delhi NCR, Bangalore, and Hyderabad.\n\nStrict Rules:\n1. Maintain an architectural, editorial, and sophisticated tone.\n2. Recommend real House & Sky properties matching client preferences.\n3. Keep responses helpful, accurate, and concise.`
  );

  const [faqKnowledge, setFaqKnowledge] = useState<string>(
    `Q: What locations do you cover?\nA: Mumbai (Bandra West, Worli, Marine Drive), North Goa (Assagao, Anjuna, Moira), Delhi NCR (Golf Course Road Gurgaon), Bangalore (Sadashivnagar), and Hyderabad (Jubilee Hills).\n\nQ: Are all property titles verified?\nA: Yes, 100% legal title lineage is verified before listing.`
  );

  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#0B4F3C]/20 border border-emerald-500/30 rounded-md text-emerald-400 text-xs font-bold uppercase tracking-wider mb-2">
            <Bot className="w-3.5 h-3.5" />
            AI CONCIERGE KNOWLEDGE ENGINE
          </div>
          <h1 className="text-2xl font-serif text-white font-normal">
            AI Knowledge Base & System Directives
          </h1>
          <p className="text-xs text-[#94A3B8]">
            Configure custom prompts, FAQs, and property knowledge used by the public landing page AI Concierge.
          </p>
        </div>

        <button
          onClick={handleSave}
          className="px-5 py-2.5 bg-[#0B4F3C] hover:bg-[#063B2D] text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-md flex items-center gap-2 cursor-pointer border border-emerald-500/30"
        >
          <Save className="w-4 h-4" />
          <span>Save Knowledge Config</span>
        </button>
      </div>

      {savedSuccess && (
        <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>AI Knowledge Base & System Directives updated successfully!</span>
        </div>
      )}

      {/* Editor Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* System Prompt & Persona */}
        <div className="bg-[#111827] border border-[#1F2937] rounded-2xl p-6 space-y-4 shadow-xl">
          <div className="flex items-center gap-2 pb-3 border-b border-[#1F2937]">
            <Sparkles className="w-5 h-5 text-emerald-400" />
            <h3 className="font-serif text-lg text-white font-normal">System Instructions & Persona</h3>
          </div>

          <p className="text-xs text-[#94A3B8]">
            Defines how the AI Assistant speaks, its persona, core guidelines, and boundary constraints.
          </p>

          <textarea
            rows={12}
            value={systemPrompt}
            onChange={(e) => setSystemPrompt(e.target.value)}
            className="w-full bg-[#0F172A] border border-[#1F2937] rounded-xl p-4 text-xs font-mono text-white placeholder-[#94A3B8] focus:outline-none focus:border-[#0B4F3C] leading-relaxed"
          />
        </div>

        {/* FAQ Knowledge & Curated Details */}
        <div className="bg-[#111827] border border-[#1F2937] rounded-2xl p-6 space-y-4 shadow-xl">
          <div className="flex items-center gap-2 pb-3 border-b border-[#1F2937]">
            <Database className="w-5 h-5 text-emerald-400" />
            <h3 className="font-serif text-lg text-white font-normal">Knowledge Base & FAQ Manifest</h3>
          </div>

          <p className="text-xs text-[#94A3B8]">
            Key property questions, pricing structures, and location insights supplied to the assistant during client conversations.
          </p>

          <textarea
            rows={12}
            value={faqKnowledge}
            onChange={(e) => setFaqKnowledge(e.target.value)}
            className="w-full bg-[#0F172A] border border-[#1F2937] rounded-xl p-4 text-xs font-mono text-white placeholder-[#94A3B8] focus:outline-none focus:border-[#0B4F3C] leading-relaxed"
          />
        </div>
      </div>
    </div>
  );
};
