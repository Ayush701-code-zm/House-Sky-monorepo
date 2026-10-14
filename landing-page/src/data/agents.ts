export interface Agent {
  id: string
  slug: string
  name: string
  title: string
  avatar: string
  phone: string
  email: string
  location: string
  experienceYears: number
  activeListingsCount: number
  totalSalesVolume: string
  rating: number
  reviewCount: number
  bio: string
  specialties: string[]
  socials: {
    linkedin?: string
    instagram?: string
  }
}

export const AGENTS: Agent[] = [
  {
    id: 'agent-1',
    slug: 'vikramaditya-singhania',
    name: 'Vikramaditya Singhania',
    title: 'Senior Partner — Luxury Estates',
    avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=800&q=80&auto=format&fit=crop',
    phone: '+91 98200 11223',
    email: 'v.singhania@auraveloce.com',
    location: 'Mumbai & Goa',
    experienceYears: 16,
    activeListingsCount: 14,
    totalSalesVolume: '₹1,450 Cr+',
    rating: 4.9,
    reviewCount: 38,
    bio: 'Specializing in ultra-prime residential real estate across South Mumbai, Bandra Seafront, and heritage Goa estates. Vikramaditya has represented tech founders, industrialists, and private equity heads for over a decade.',
    specialties: ['Sea-facing Penthouses', 'Heritage Goan Villas', 'Off-Market Assets', 'Private Estate Sales'],
    socials: {
      linkedin: 'https://linkedin.com',
      instagram: 'https://instagram.com',
    },
  },
  {
    id: 'agent-2',
    slug: 'ananya-deshmukh',
    name: 'Ananya Deshmukh',
    title: 'Director — Architectural Residences',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=800&q=80&auto=format&fit=crop',
    phone: '+91 98112 33445',
    email: 'a.deshmukh@auraveloce.com',
    location: 'Delhi NCR & Gurgaon',
    experienceYears: 12,
    activeListingsCount: 11,
    totalSalesVolume: '₹980 Cr+',
    rating: 4.9,
    reviewCount: 29,
    bio: 'Architectural historian turned luxury real estate strategist. Ananya focuses on bespoke modern villas, Lutyens Zone estates, and trophy duplexes along Golf Course Road.',
    specialties: ['Golf Course Road Penthouses', 'Lutyens Bungalow Zone', 'Sustainable Architecture', 'Commercial Portfolios'],
    socials: {
      linkedin: 'https://linkedin.com',
    },
  },
  {
    id: 'agent-3',
    slug: 'kabir-merchant',
    name: 'Kabir Merchant',
    title: 'Principal Advisor — Waterfront & Island Properties',
    avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=800&q=80&auto=format&fit=crop',
    phone: '+91 98450 66778',
    email: 'k.merchant@auraveloce.com',
    location: 'Bangalore & Goa',
    experienceYears: 14,
    activeListingsCount: 9,
    totalSalesVolume: '₹820 Cr+',
    rating: 4.8,
    reviewCount: 24,
    bio: 'Known for securing rare waterfront holdings and expansive gated estates in Bangalore’s Sadashivnagar and Goa’s North Coast. Kabir brings unmatched discretion to every transaction.',
    specialties: ['Gated Golf Communities', 'Coastal Villas', 'Private Helipads', 'High-Yield Advisory'],
    socials: {
      linkedin: 'https://linkedin.com',
      instagram: 'https://instagram.com',
    },
  },
  {
    id: 'agent-4',
    slug: 'natasha-roy',
    name: 'Natasha Roy',
    title: 'Lead Associate — Commercial & Penthouse Portfolios',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=800&q=80&auto=format&fit=crop',
    phone: '+91 98211 88990',
    email: 'n.roy@auraveloce.com',
    location: 'Mumbai & Hyderabad',
    experienceYears: 9,
    activeListingsCount: 12,
    totalSalesVolume: '₹640 Cr+',
    rating: 4.9,
    reviewCount: 31,
    bio: 'Natasha curates high-design luxury apartments and boutique corporate headquarters. She advises high-net-worth individuals on asset diversification and luxury rentals.',
    specialties: ['Worli & Lower Parel High-Rises', 'Jubilee Hills Estates', 'Corporate Headquarters', 'Luxury Rentals'],
    socials: {
      linkedin: 'https://linkedin.com',
    },
  },
]
