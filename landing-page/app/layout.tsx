import type { Metadata } from 'next'
import { Playfair_Display, DM_Sans } from 'next/font/google'
import '@/styles/globals.css'
import { QueryProvider } from '@/components/providers/QueryProvider'
import { FormValidationScroll } from '@/components/providers/FormValidationScroll'
import { ToastProvider } from '@/components/ui/Toast'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { HouseAndSkyChatbot } from '@/components/real-estate/HouseAndSkyChatbot'
import { WhatsAppButton } from '@/components/real-estate/WhatsAppButton'
import { WelcomeModal } from '@/components/real-estate/WelcomeModal'

const playfair = Playfair_Display({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-playfair',
  display: 'swap',
})

const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-dm-sans',
  display: 'swap',
})

export const metadata: Metadata = {
  metadataBase: new URL('https://houseandsky.com'),
  title: {
    default: 'House & Sky — Exceptional Homes. Under Open Skies.',
    template: '%s | House & Sky',
  },
  description:
    'Discover exceptional architectural homes, luxury penthouses, modern villas, and prime real estate across Mumbai, Goa, Delhi NCR, Bangalore, and Hyderabad.',
  keywords: [
    'House & Sky',
    'House and Sky real estate',
    'architectural homes India',
    'sea facing penthouses Mumbai',
    'luxury villas Goa',
    'golf course road duplex Gurgaon',
    'jubilee hills mansions Hyderabad',
    'luxury homes India',
  ],
  icons: {
    icon: [
      { url: '/favicon.png', type: 'image/png' },
    ],
    shortcut: '/favicon.png',
    apple: '/favicon.png',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`scroll-smooth scroll-pt-32 sm:scroll-pt-36 overflow-x-hidden max-w-full ${playfair.variable} ${dmSans.variable}`}>
      <body className={`${dmSans.className} bg-white text-brand-charcoal font-sans antialiased selection:bg-brand-soft selection:text-brand-green overflow-x-hidden max-w-full w-full`}>
        <QueryProvider>
          <ToastProvider>
            <FormValidationScroll />
            <Navbar />
            <div className="min-h-screen pt-32 sm:pt-36 max-w-full overflow-x-hidden">
              {children}
            </div>
            <Footer />
            <WhatsAppButton />
            <HouseAndSkyChatbot />
            <WelcomeModal />
          </ToastProvider>
        </QueryProvider>
      </body>
    </html>
  )
}

