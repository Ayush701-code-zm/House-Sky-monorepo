import * as React from 'react'
import { InquiryForm } from '@/components/real-estate/InquiryForm'
import { SectionHeading } from '@/components/real-estate/SectionHeading'
import { PageSection } from '@/components/layout/PageSection'
import { Mail, Phone, MapPin, ShieldCheck, MessageCircle, ExternalLink } from 'lucide-react'
import { SITE } from '@/utils/siteConfig'

export const metadata = {
  title: 'Contact Us & Office Location — House & Sky Real Estate',
  description: 'Connect with House & Sky real estate advisors for private viewings, plot bookings, property listings, and site visit consultations.',
}

export default function ContactPage() {
  return (
    <div>
      <PageSection tone="white">
      <SectionHeading
        eyebrow="ADVISORY & INQUIRIES"
        title="Schedule a Private Consultation"
        subtitle="Speak directly with our team for property listings, private viewings, and site visit arrangements."
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        {/* Contact Info (5 cols) */}
        <div className="lg:col-span-5 bg-white border border-brand-green/15 rounded-3xl p-8 space-y-6 shadow-sm">
          <div className="space-y-1">
            <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-brand-green">
              HEADQUARTERS & DESKS
            </span>
            <h3 className="font-serif text-2xl text-brand-charcoal font-semibold">Contact Information</h3>
          </div>

          <div className="space-y-5 text-xs text-brand-charcoal/80 font-light">
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-brand-green shrink-0 mt-0.5" />
              <div>
                <strong className="text-brand-charcoal block font-bold text-sm">Corporate Office</strong>
                <p className="text-brand-charcoal/80 mt-0.5 leading-relaxed font-semibold">
                  TOWER-C, UNIT-2124<br />
                  Plot No.1, Alphathum, Sector-90,<br />
                  Noida, Uttar Pradesh 201301
                </p>
                <a
                  href={SITE.googleMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-brand-green font-bold text-xs mt-2 hover:underline"
                >
                  <ExternalLink className="w-3.5 h-3.5" /> Open in Google Maps
                </a>
              </div>
            </div>

            <div className="flex items-start gap-3 border-t border-brand-green/10 pt-4">
              <Phone className="w-5 h-5 text-brand-green shrink-0 mt-0.5" />
              <div>
                <strong className="text-brand-charcoal block font-bold text-sm">Direct Phone Hotline</strong>
                <a href={`tel:${SITE.phoneTel}`} className="text-brand-green font-extrabold text-sm hover:underline block mt-0.5">
                  {SITE.phoneDisplay}
                </a>
              </div>
            </div>

            <div className="flex items-start gap-3 border-t border-brand-green/10 pt-4">
              <MessageCircle className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
              <div>
                <strong className="text-brand-charcoal block font-bold text-sm">Official WhatsApp Desk</strong>
                <a
                  href={`https://wa.me/${SITE.whatsapp}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-emerald-600 font-extrabold text-sm hover:underline block mt-0.5"
                >
                  {SITE.whatsappDisplay}
                </a>
              </div>
            </div>

            <div className="flex items-start gap-3 border-t border-brand-green/10 pt-4">
              <Mail className="w-5 h-5 text-brand-green shrink-0 mt-0.5" />
              <div>
                <strong className="text-brand-charcoal block font-bold text-sm">Email Inquiry</strong>
                <a href={`mailto:${SITE.email}`} className="text-brand-charcoal/80 font-medium hover:text-brand-green">
                  {SITE.email}
                </a>
              </div>
            </div>

            <div className="flex items-start gap-3 border-t border-brand-green/10 pt-4">
              <ShieldCheck className="w-5 h-5 text-brand-green shrink-0 mt-0.5" />
              <div>
                <strong className="text-brand-charcoal block font-bold">Confidential Representation</strong>
                <span>All client communications and viewings are handled with utmost discretion.</span>
              </div>
            </div>
          </div>
        </div>

        {/* Form Module (7 cols) */}
        <div className="lg:col-span-7">
          <InquiryForm />
        </div>
      </div>
      </PageSection>

      <PageSection tone="muted">
        <div className="flex items-center justify-between mb-4 gap-4 flex-wrap">
          <div>
            <h3 className="font-serif text-2xl font-semibold text-brand-charcoal">Location Map</h3>
            <p className="text-sm text-brand-charcoal/60">TOWER-C, UNIT-2124, Alphathum, Sector-90, Noida</p>
          </div>
          <a
            href={SITE.googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 bg-brand-green text-white text-xs font-bold rounded-xl hover:bg-brand-dark transition-all inline-flex items-center gap-1.5"
          >
            <MapPin className="w-3.5 h-3.5" /> Open in Google Maps App
          </a>
        </div>
        <div className="w-full h-80 rounded-2xl overflow-hidden border border-brand-green/10 bg-[#F5F5F0]">
          <iframe
            title="House and Sky Office Location Map"
            src={SITE.mapEmbedUrl}
            width="100%"
            height="100%"
            style={{ border: 0 }}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
      </PageSection>
    </div>
  )
}
