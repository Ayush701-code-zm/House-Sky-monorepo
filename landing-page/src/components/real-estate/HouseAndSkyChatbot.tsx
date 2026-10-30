'use client'

import * as React from 'react'
import Link from 'next/link'
import { getApiBaseUrl } from '@/utils/api'
import { DraftNotice } from '@/components/ui/DraftNotice'
import { useClientDraft } from '@/utils/useFormDraft'

const CHAT_DEFAULTS = {
  input: '',
  leadForm: { name: '', phone: '', city: 'Dholera SIR', interest: 'Request Callback' },
}
import {
  MessageSquare,
  X,
  Send,
  Sparkles,
  ShieldCheck,
  ArrowUpRight,
  PhoneCall,
  Calendar,
  FileText,
  Percent,
  CheckCircle2,
  MapPin,
  Loader2,
  User,
  Phone,
  Flame,
  Check
} from 'lucide-react'

interface ChatMessage {
  id: string
  sender: 'user' | 'bot'
  text: string
  properties?: Array<{ title: string; price: string; location: string; slug: string }>
  showLeadForm?: boolean
  leadCaptured?: boolean
  timestamp: string
}

export function HouseAndSkyChatbot() {
  const chatDraft = useClientDraft('hs-public-chat', CHAT_DEFAULTS)
  const input = chatDraft.value.input
  const setInput = (next: string) => chatDraft.setValue((prev) => ({ ...prev, input: next }))
  const leadForm = chatDraft.value.leadForm
  const setLeadForm = (next: typeof CHAT_DEFAULTS.leadForm | ((prev: typeof CHAT_DEFAULTS.leadForm) => typeof CHAT_DEFAULTS.leadForm)) => {
    chatDraft.setValue((prev) => ({
      ...prev,
      leadForm: typeof next === 'function' ? next(prev.leadForm) : next,
    }))
  }
  const chatDraftRestored = chatDraft.restored
  const setChatDraftRestored = chatDraft.setRestored
  const clearChatDraft = chatDraft.clear
  const [isOpen, setIsOpen] = React.useState(false)
  const [isLoading, setIsLoading] = React.useState(false)
  const [unreadBadge, setUnreadBadge] = React.useState(true)
  const [isSubmittingLead, setIsSubmittingLead] = React.useState(false)
  const [leadSuccessMsg, setLeadSuccessMsg] = React.useState<string | null>(null)

  const [messages, setMessages] = React.useState<ChatMessage[]>([
    {
      id: 'welcome-1',
      sender: 'bot',
      text: 'Welcome to House & Sky Real Estate Advisory 👋\n\nAsk me about township plots, luxury villas, or wholesale bulk deals. Share your mobile number anytime to receive detailed price brochures & book free site visit cabs!',
      showLeadForm: true,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ])

  const chatContainerRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight
    }
  }, [messages, isLoading, isSubmittingLead, leadSuccessMsg])

  const lastSendAt = React.useRef(0)

  const handleSend = async (textToSend?: string) => {
    const query = (textToSend || input).trim().slice(0, 500)
    if (!query || isLoading) return

    // Client-side cooldown — real enforcement is on /api/chat.
    const now = Date.now()
    if (now - lastSendAt.current < 1200) return
    lastSendAt.current = now

    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }

    setMessages((prev) => [...prev, userMsg])
    if (!textToSend) setInput('')
    setIsLoading(true)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: query }),
      })

      const data = await res.json()

      const botMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        sender: 'bot',
        text:
          data.reply ||
          (res.status === 429
            ? 'You have reached the chat limit for now. Please try again shortly.'
            : 'Thank you for reaching out. Our real estate advisory desk is at your service.'),
        properties: data.properties,
        showLeadForm: data.showLeadForm,
        leadCaptured: data.leadCaptured,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }

      setMessages((prev) => [...prev, botMsg])

      if (data.leadCaptured) {
        setLeadSuccessMsg('🎉 Phone number registered! Our team will WhatsApp you details shortly.')
      }
    } catch (err) {
      console.error(err)
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          sender: 'bot',
          text: 'Thank you! You can also reach our senior advisory desk directly at +91 93112 27789 or +91 92899 27527.',
          showLeadForm: true,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  const handleDirectLeadSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!leadForm.phone || leadForm.phone.trim().length < 5) {
      alert('Please enter a valid phone number')
      return
    }

    try {
      setIsSubmittingLead(true)
      const baseUrl = getApiBaseUrl()
      const res = await fetch(`${baseUrl}/public/chatbot-lead`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: leadForm.name || 'AI Chatbot Visitor',
          phone: leadForm.phone.trim(),
          city: leadForm.city,
          interest: leadForm.interest,
          message: `Direct lead submission via AI Chatbot form`
        })
      })

      if (res.ok) {
        setLeadSuccessMsg(`🎉 Thank you ${leadForm.name || ''}! We have received your request. Our advisory team will call/WhatsApp you at ${leadForm.phone} shortly.`)
        
        // Push bot confirmation message
        setMessages((prev) => [
          ...prev,
          {
            id: `lead-success-${Date.now()}`,
            sender: 'bot',
            text: `✅ Request Confirmed for ${leadForm.phone}!\n\nInterest: ${leadForm.interest} (${leadForm.city})\nOur senior real estate desk will dispatch your price brochure and call you shortly.`,
            leadCaptured: true,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          }
        ])

        setLeadForm(CHAT_DEFAULTS.leadForm)
        if (!input.trim()) {
          clearChatDraft()
          setChatDraftRestored(false)
        }
      } else {
        alert('Failed to submit. Please try again or call +91 93112 27789 directly.')
      }
    } catch (err) {
      console.error(err)
      alert('Network error. Please try again.')
    } finally {
      setIsSubmittingLead(false)
    }
  }

  const quickActionChips = [
    { label: '📞 Call Me Back', interest: 'Request Callback' },
    { label: '🚗 Book Site Visit', interest: 'Book Site Visit Cab' },
    { label: '📄 WhatsApp Brochure', interest: 'WhatsApp Price Brochure' },
    { label: '💰 Get Price Quote', interest: 'Best Price Quote' },
    { label: '🔥 Investor Bulk Deals', interest: 'Wholesale Bulk Deal' },
  ]

  return (
    <>
      <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 flex items-center gap-3">
        {!isOpen && unreadBadge && (
          <div
            onClick={() => { setIsOpen(true); setUnreadBadge(false) }}
            className="hidden sm:flex items-center gap-2 bg-slate-900/95 backdrop-blur-md text-white border border-emerald-500/40 px-3.5 py-2 rounded-2xl shadow-2xl cursor-pointer hover:border-emerald-400 transition-all group animate-bounce duration-1000"
          >
            <div className="w-2.5 h-2.5 bg-emerald-400 rounded-full animate-ping" />
            <span className="text-xs font-bold text-emerald-300">
              💬 Get Instant Price Quote & Callback
            </span>
            <X
              onClick={(e) => { e.stopPropagation(); setUnreadBadge(false) }}
              className="w-3.5 h-3.5 text-white/50 hover:text-white ml-1 cursor-pointer"
            />
          </div>
        )}

        <button
          type="button"
          onClick={() => { setIsOpen(!isOpen); setUnreadBadge(false) }}
          className="p-3 sm:p-4 bg-gradient-to-r from-emerald-600 via-emerald-700 to-slate-900 text-white rounded-full shadow-2xl hover:scale-105 transition-all duration-300 flex items-center justify-center cursor-pointer group border-2 border-emerald-400/30"
          aria-label="Toggle House & Sky AI Concierge"
        >
          {isOpen ? (
            <X className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
          ) : (
            <div className="flex items-center gap-2 px-1">
              <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-amber-300 animate-pulse" />
              <span className="text-xs font-bold uppercase tracking-wider hidden group-hover:inline text-white">
                AI Advisor
              </span>
            </div>
          )}
        </button>
      </div>

      {/* Floating Chat Drawer */}
      {isOpen && (
        <div className="fixed bottom-24 right-4 sm:right-6 z-50 w-[calc(100vw-2rem)] sm:w-96 bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[75vh] sm:max-h-none sm:h-[560px] animate-in fade-in slide-in-from-bottom-4 duration-200">
          {/* Header Bar */}
          <div className="bg-gradient-to-r from-[#061913] via-[#0A2E23] to-[#0B4F3C] text-white p-3 sm:p-4 flex items-center justify-between border-b border-[#C9A96E]/30 gap-2">
            <div className="flex items-center gap-3 min-w-0">
              <div className="shrink-0 bg-[#FDFCF0] rounded-xl px-2 py-1 border border-[#C9A96E]/40">
                <img
                  src="/images/logo.png"
                  alt="House & Sky"
                  className="h-8 w-auto object-contain"
                />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h4 className="font-serif text-sm font-bold text-white tracking-tight truncate">
                    AI Advisor
                  </h4>
                  <span className="px-1.5 py-0.5 bg-[#C9A96E]/20 text-[#F3E5AB] text-[9px] font-extrabold rounded uppercase border border-[#C9A96E]/40">
                    24/7
                  </span>
                </div>
                <p className="text-[10px] text-[#C9A96E]/90 font-mono flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-[#C9A96E] rounded-full animate-pulse" />
                  Property Assistant
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="p-1.5 text-white/70 hover:text-white rounded-full hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages Scroll Area */}
          <div ref={chatContainerRef} className="flex-1 p-4 overflow-y-auto space-y-4 bg-slate-50/50">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[88%] p-3.5 rounded-2xl text-xs leading-relaxed shadow-sm ${
                    msg.sender === 'user'
                      ? 'bg-emerald-700 text-white rounded-br-xs font-medium'
                      : 'bg-white border border-slate-200 text-slate-800 rounded-bl-xs'
                  }`}
                >
                  <p className="whitespace-pre-line">{msg.text}</p>

                  {/* Property Cards in Bot Replies */}
                  {msg.properties && msg.properties.length > 0 && (
                    <div className="mt-3 space-y-2 pt-2 border-t border-slate-100">
                      {msg.properties.map((prop) => (
                        <div
                          key={prop.slug}
                          className="bg-slate-50 border border-slate-200 p-2.5 rounded-xl space-y-1"
                        >
                          <span className="text-[9px] uppercase tracking-wider font-extrabold text-emerald-700 block">
                            RECOMMENDED PROPERTY
                          </span>
                          <h5 className="font-serif text-xs font-bold text-slate-900">{prop.title}</h5>
                          <div className="flex items-center justify-between text-[10px] text-slate-500 font-medium">
                            <span>{prop.location}</span>
                            <span className="font-bold text-emerald-700">{prop.price}</span>
                          </div>
                          <Link
                            href={`/properties/${prop.slug}`}
                            className="text-[10px] text-emerald-700 font-bold uppercase tracking-wider flex items-center gap-1 pt-1 hover:underline"
                            onClick={() => setIsOpen(false)}
                          >
                            <span>View Details</span>
                            <ArrowUpRight className="w-3 h-3 text-emerald-600" />
                          </Link>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Embedded Lead Capture Form (Bot Msg) */}
                  {msg.sender === 'bot' && msg.showLeadForm && !leadSuccessMsg && (
                    <div className="mt-3 pt-3 border-t border-slate-100 space-y-2 bg-emerald-50/60 -mx-1 p-2.5 rounded-xl border border-emerald-200/60">
                      <div className="flex items-center gap-1.5 text-emerald-900 font-bold text-[11px]">
                        <PhoneCall className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Get Instant Quote & Callback</span>
                      </div>
                      <p className="text-[10px] text-slate-600">
                        Leave your mobile number to get the price breakdown & site visit cab details on WhatsApp.
                      </p>

                      <form onSubmit={handleDirectLeadSubmit} className="space-y-2 pt-1">
                        <div className="grid grid-cols-1 gap-2.5">
                          <div className="space-y-1">
                            <label htmlFor="bot-lead-name" className="hs-label sr-only">Your Name (Optional)</label>
                            <input
                              id="bot-lead-name"
                              type="text"
                              placeholder="Your Name (Optional)"
                              value={leadForm.name}
                              onChange={(e) => setLeadForm((prev) => ({ ...prev, name: e.target.value }))}
                              className="input-base"
                            />
                          </div>
                          <div className="space-y-1">
                            <label htmlFor="bot-lead-phone" className="hs-label sr-only">Phone Number <span className="hs-required">*</span></label>
                            <input
                              id="bot-lead-phone"
                              type="tel"
                              required
                              placeholder="Phone Number *"
                              value={leadForm.phone}
                              onChange={(e) => setLeadForm((prev) => ({ ...prev, phone: e.target.value }))}
                              className="input-base"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 gap-2.5">
                          <div className="space-y-1">
                            <label htmlFor="bot-lead-interest" className="hs-label sr-only">Interest</label>
                            <select
                              id="bot-lead-interest"
                              value={leadForm.interest}
                              onChange={(e) => setLeadForm((prev) => ({ ...prev, interest: e.target.value }))}
                              className="input-base appearance-none pr-8 cursor-pointer"
                            >
                              <option value="Request Callback">📞 Call Me Back</option>
                              <option value="Book Site Visit Cab">🚗 Book Site Visit</option>
                              <option value="WhatsApp Price Brochure">📄 WhatsApp Brochure</option>
                              <option value="Best Price Quote">💰 Best Price Quote</option>
                              <option value="Wholesale Bulk Deal">🔥 Bulk Deal Inquiry</option>
                            </select>
                          </div>

                          <div className="space-y-1">
                            <label htmlFor="bot-lead-city" className="hs-label sr-only">City</label>
                            <select
                              id="bot-lead-city"
                              value={leadForm.city}
                              onChange={(e) => setLeadForm((prev) => ({ ...prev, city: e.target.value }))}
                              className="input-base appearance-none pr-8 cursor-pointer"
                            >
                              <option value="Dholera SIR">Dholera SIR</option>
                              <option value="Noida Smart City">Noida / NCR</option>
                              <option value="Mumbai">Mumbai</option>
                              <option value="Goa">Goa</option>
                              <option value="Gurgaon">Gurgaon</option>
                            </select>
                          </div>
                        </div>

                        <button
                          type="submit"
                          disabled={isSubmittingLead}
                          className="hs-btn-primary w-full text-[11px] py-2"
                        >
                          {isSubmittingLead ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin" /> Submitting...
                            </>
                          ) : (
                            <>
                              <Send className="w-3.5 h-3.5" /> Submit & Get Quote
                            </>
                          )}
                        </button>
                      </form>
                    </div>
                  )}
                </div>

                <span className="text-[9px] text-slate-400 font-mono mt-1 px-1">
                  {msg.timestamp}
                </span>
              </div>
            ))}

            {/* Success Toast Banner inside chat */}
            {leadSuccessMsg && (
              <div className="bg-emerald-500 text-white p-3 rounded-2xl shadow-md flex items-start gap-2.5 animate-in fade-in slide-in-from-bottom-2">
                <CheckCircle2 className="w-5 h-5 text-white shrink-0 mt-0.5" />
                <p className="text-xs font-bold leading-snug">{leadSuccessMsg}</p>
              </div>
            )}

            {isLoading && (
              <div className="flex items-start">
                <div className="bg-white border border-slate-200 p-3 rounded-2xl text-xs text-slate-500 flex items-center gap-2 shadow-sm">
                  <span className="w-2 h-2 bg-emerald-600 rounded-full animate-bounce" />
                  <span className="w-2 h-2 bg-emerald-600 rounded-full animate-bounce [animation-delay:0.2s]" />
                  <span className="w-2 h-2 bg-emerald-600 rounded-full animate-bounce [animation-delay:0.4s]" />
                </div>
              </div>
            )}
          </div>

          {/* Quick Lead Action Chips */}
          <div className="px-3 py-2 bg-white border-t border-slate-100 flex items-center gap-1.5 overflow-x-auto">
            {quickActionChips.map((chip) => (
              <button
                key={chip.label}
                type="button"
                onClick={() => {
                  setLeadForm((prev) => ({ ...prev, interest: chip.interest }))
                  handleSend(chip.label)
                }}
                className="shrink-0 px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-600 hover:text-white border border-emerald-200/80 text-[10px] font-bold text-emerald-800 rounded-xl transition-all cursor-pointer shadow-2xs flex items-center gap-1"
              >
                {chip.label}
              </button>
            ))}
          </div>

          {chatDraftRestored && (
            <div className="px-3 pt-2">
              <DraftNotice onDiscard={() => {
                clearChatDraft()
                setInput('')
                setLeadForm(CHAT_DEFAULTS.leadForm)
                setChatDraftRestored(false)
              }} />
            </div>
          )}
          {/* Input Bar */}
          <form
            onSubmit={(e) => {
              e.preventDefault()
              handleSend()
            }}
            className="p-3 bg-white border-t border-slate-200 flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about properties or type mobile number..."
              className="flex-1 input-base"
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="p-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-500 transition-all disabled:opacity-50 cursor-pointer shadow-md"
            >
              <Send className="w-4 h-4 text-white" />
            </button>
          </form>
        </div>
      )}
    </>
  )
}

export default HouseAndSkyChatbot
