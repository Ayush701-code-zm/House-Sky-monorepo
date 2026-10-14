export interface PropertySpec {
  bedrooms: number
  bathrooms: number
  areaSqFt: number
  parkingSpaces: number
  yearBuilt: number
  floorNumber?: number
  totalFloors?: number
}

export interface LocationInfo {
  city: string
  area: string
  address: string
  coordinates: {
    lat: number
    lng: number
  }
}

export interface Amenity {
  icon: string
  name: string
}

export interface Property {
  id: string
  slug: string
  title: string
  tagline: string
  description: string
  price: number // Numeric price in INR (e.g., 245000000 = 24.5 Cr)
  formattedPrice: string
  pricePerSqFt: number
  formattedPricePerSqFt: string
  propertyType: 'Villa' | 'Penthouse' | 'Apartment' | 'Waterfront' | 'Estate' | 'Commercial'
  listingType: 'Buy' | 'Rent' | 'Lease'
  location: LocationInfo
  specs: PropertySpec
  amenities: Amenity[]
  features: string[]
  images: {
    hero: string
    gallery: string[]
  }
  floorPlanUrl: string
  agentId: string
  isFeatured: boolean
  isSpotlight: boolean
  isNew: boolean
  status: 'Available' | 'Under Negotiation' | 'Sold'
  createdAt: string
  legalInfo?: {
    reraNumber?: string
    titleType?: string
    approvalAuthority?: string
  }
}

export const PROPERTIES: Property[] = [
  {
    id: 'prop-1',
    slug: 'the-solitaire-sky-villa-bandra',
    title: 'The Solitaire Sky Villa',
    tagline: 'Panoramic Arabian Sea Vistas & Private Infinity Pool',
    description: 'Perched on the top floors of Bandra West’s premier architectural tower, The Solitaire Sky Villa offers 5,800 square feet of unmatched double-height living spaces. Features a private glass-walled infinity edge plunge pool, private elevator access directly into a private gallery, custom Italian minimalist cabinetry, and wraparound sunset terraces.',
    price: 285000000,
    formattedPrice: '₹28.50 Cr',
    pricePerSqFt: 49137,
    formattedPricePerSqFt: '₹49,137 / sq ft',
    propertyType: 'Penthouse',
    listingType: 'Buy',
    location: {
      city: 'Mumbai',
      area: 'Bandra West',
      address: 'Carter Road, Bandra West, Mumbai 400050',
      coordinates: { lat: 19.0607, lng: 72.8229 },
    },
    specs: {
      bedrooms: 4,
      bathrooms: 5,
      areaSqFt: 5800,
      parkingSpaces: 4,
      yearBuilt: 2024,
      floorNumber: 34,
      totalFloors: 36,
    },
    amenities: [
      { icon: 'Waves', name: 'Private Plunge Pool' },
      { icon: 'ShieldCheck', name: '24/7 White-Glove Security' },
      { icon: 'Car', name: '4 EV Charging Bays' },
      { icon: 'Zap', name: 'Smart Home Automation' },
      { icon: 'Dumbbell', name: 'Private Wellness Gym' },
      { icon: 'Wine', name: 'Temperature Controlled Cellar' },
      { icon: 'Sparkles', name: 'Private Elevator Landing' },
      { icon: 'Sun', name: 'Sunset Lounge Deck' },
    ],
    features: [
      'Double-height ceiling gallery with motor-operated floor-to-ceiling glass',
      'Unobstructed 270-degree views of the Arabian Sea and Bandra-Worli Sea Link',
      'Designer Poggenpohl kitchen with Miele integrated appliances',
      'Master suite with private spa sauna, freestanding marble tub, and dual walk-in closets',
      'Complete Lutron lighting and motorized curtain automation system',
    ],
    images: {
      hero: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1600&q=85&auto=format&fit=crop',
      gallery: [
        'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1600&q=85&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1600&q=85&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?w=1600&q=85&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1600&q=85&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1600573472550-8090b5e0745e?w=1600&q=85&auto=format&fit=crop',
      ],
    },
    floorPlanUrl: 'https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=1000&q=80&auto=format&fit=crop',
    agentId: 'agent-1',
    isFeatured: true,
    isSpotlight: true,
    isNew: true,
    status: 'Available',
    createdAt: '2026-08-01',
  },
  {
    id: 'prop-2',
    slug: 'casa-de-assagao-goa',
    title: 'Casa de Assagao',
    tagline: 'Brutalist Tropical Modernism in the Valley of Palms',
    description: 'Designed by internationally acclaimed architectural atelier Studio V, Casa de Assagao blends exposed off-shutter concrete with warm teakwood louvers and tropical landscaping. Features a 20-meter obsidian tile lap pool, sunlit courtyard gardens, and serene outdoor rain showers.',
    price: 185000000,
    formattedPrice: '₹18.50 Cr',
    pricePerSqFt: 30833,
    formattedPricePerSqFt: '₹30,833 / sq ft',
    propertyType: 'Villa',
    listingType: 'Buy',
    location: {
      city: 'Goa',
      area: 'Assagao',
      address: 'Badem Road, Assagao, Goa 403507',
      coordinates: { lat: 15.5901, lng: 73.7656 },
    },
    specs: {
      bedrooms: 5,
      bathrooms: 6,
      areaSqFt: 6000,
      parkingSpaces: 3,
      yearBuilt: 2023,
      floorNumber: 1,
      totalFloors: 2,
    },
    amenities: [
      { icon: 'Waves', name: '20m Obsidian Lap Pool' },
      { icon: 'Trees', name: 'Private Botanical Courtyard' },
      { icon: 'ShieldCheck', name: 'Gated Perimeter Security' },
      { icon: 'Zap', name: '100% Solar & Battery Backup' },
      { icon: 'Utensils', name: 'Alfresco Dining Pavilion' },
      { icon: 'Coffee', name: 'Staff Quarters & Kitchen' },
    ],
    features: [
      'Exposed raw concrete facades paired with century-old teak structural columns',
      'Open-air living hall connecting seamlessly to pool terrace',
      'Fully landscaped with indigenous palms, bamboo, and tranquil water lily ponds',
      'Dedicated staff quarter block with independent service entry',
      'Short 7-minute drive to North Goa’s finest culinary dining spots',
    ],
    images: {
      hero: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1600&q=85&auto=format&fit=crop',
      gallery: [
        'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1600&q=85&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1613977257363-707ba9348227?w=1600&q=85&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=1600&q=85&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?w=1600&q=85&auto=format&fit=crop',
      ],
    },
    floorPlanUrl: 'https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=1000&q=80&auto=format&fit=crop',
    agentId: 'agent-3',
    isFeatured: true,
    isSpotlight: false,
    isNew: false,
    status: 'Available',
    createdAt: '2026-07-15',
  },
  {
    id: 'prop-3',
    slug: 'golf-course-credenza-duplex-gurgaon',
    title: 'Golf Course Credenza Duplex',
    tagline: 'Super-Luxury Fairway Living & Private Sky Terrace',
    description: 'Located in Gurgaon’s most sought-after residential enclave on Golf Course Road. This 7,200 sq ft duplex penthouse looks directly across DLF Golf & Country Club fairway. Features private glass elevator, temperature-controlled plunge pool, and sound-insulated private screening room.',
    price: 340000000,
    formattedPrice: '₹34.00 Cr',
    pricePerSqFt: 47222,
    formattedPricePerSqFt: '₹47,222 / sq ft',
    propertyType: 'Penthouse',
    listingType: 'Buy',
    location: {
      city: 'Delhi NCR',
      area: 'Golf Course Road',
      address: 'Sector 54, Golf Course Road, Gurgaon, Haryana 122002',
      coordinates: { lat: 28.4393, lng: 77.1062 },
    },
    specs: {
      bedrooms: 5,
      bathrooms: 6,
      areaSqFt: 7200,
      parkingSpaces: 5,
      yearBuilt: 2024,
      floorNumber: 28,
      totalFloors: 30,
    },
    amenities: [
      { icon: 'Target', name: 'Golf Course Panoramic Views' },
      { icon: 'Tv', name: 'Private Dolby Atmos Theater' },
      { icon: 'ShieldCheck', name: 'Biometric Access & Guarded Tower' },
      { icon: 'Waves', name: 'Heated Rooftop Pool' },
      { icon: 'Wine', name: 'Cigar & Wine Tasting Room' },
      { icon: 'Sparkles', name: 'Concierge Valet Service' },
    ],
    features: [
      'Uninterrupted green canopy views over 18-hole championship golf course',
      'Italian Statuario marble flooring throughout double-height salon',
      'Separate service staircase and dual staff accommodation quarters',
      'Central VRV air purification system maintaining AQI < 15 year-round',
    ],
    images: {
      hero: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1600&q=85&auto=format&fit=crop',
      gallery: [
        'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1600&q=85&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?w=1600&q=85&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1600&q=85&auto=format&fit=crop',
      ],
    },
    floorPlanUrl: 'https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=1000&q=80&auto=format&fit=crop',
    agentId: 'agent-2',
    isFeatured: true,
    isSpotlight: true,
    isNew: true,
    status: 'Available',
    createdAt: '2026-08-10',
  },
  {
    id: 'prop-4',
    slug: 'the-monolith-mansion-jubilee-hills',
    title: 'The Monolith Mansion',
    tagline: 'Palatial Hilltop Architecture & Sculptural Terraces',
    description: 'An architectural marvel situated in Jubilee Hills Road No. 36. Spread across a 1,200 square yard elevated land parcel with 11,000 sq ft of built-up space. Features cantilevered travertine decks, subterranean 6-car gallery, and cascading stone waterfall features.',
    price: 450000000,
    formattedPrice: '₹45.00 Cr',
    pricePerSqFt: 40909,
    formattedPricePerSqFt: '₹40,909 / sq ft',
    propertyType: 'Estate',
    listingType: 'Buy',
    location: {
      city: 'Hyderabad',
      area: 'Jubilee Hills',
      address: 'Road No. 36, Jubilee Hills, Hyderabad, Telangana 500033',
      coordinates: { lat: 17.4319, lng: 78.4073 },
    },
    specs: {
      bedrooms: 6,
      bathrooms: 8,
      areaSqFt: 11000,
      parkingSpaces: 6,
      yearBuilt: 2023,
      floorNumber: 1,
      totalFloors: 3,
    },
    amenities: [
      { icon: 'ShieldCheck', name: 'High-Security Perimeter' },
      { icon: 'Waves', name: '40ft Infinity Pool & Spa' },
      { icon: 'Car', name: 'Subterranean 6-Car Gallery' },
      { icon: 'Flame', name: 'Outdoor Fire Pit Deck' },
      { icon: 'Trees', name: 'Private Zen Garden' },
      { icon: 'Sparkles', name: 'Private Lift Across 3 Floors' },
    ],
    features: [
      'Custom cut Roman Travertine stone exterior envelope',
      'Panoramic sunset views overlooking Durgam Cheruvu cable bridge',
      'Independent security control room and bullet-resistant master suite safe room',
    ],
    images: {
      hero: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1600&q=85&auto=format&fit=crop',
      gallery: [
        'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1600&q=85&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1600573472550-8090b5e0745e?w=1600&q=85&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1600&q=85&auto=format&fit=crop',
      ],
    },
    floorPlanUrl: 'https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=1000&q=80&auto=format&fit=crop',
    agentId: 'agent-4',
    isFeatured: true,
    isSpotlight: false,
    isNew: false,
    status: 'Available',
    createdAt: '2026-06-20',
  },
  {
    id: 'prop-5',
    slug: 'worli-seaface-regal-residence',
    title: 'Worli Sea Face Regal Residence',
    tagline: 'Direct Oceanfront Duplex on Worli Promenade',
    description: 'An expansive 4,200 sq ft luxury residence with floor-to-ceiling glass fronts directly framing the waves of the Arabian Sea. Features teak flooring, custom brass accents, and fully automated acoustic blinds.',
    price: 210000000,
    formattedPrice: '₹21.00 Cr',
    pricePerSqFt: 50000,
    formattedPricePerSqFt: '₹50,000 / sq ft',
    propertyType: 'Apartment',
    listingType: 'Buy',
    location: {
      city: 'Mumbai',
      area: 'Worli Sea Face',
      address: 'Worli Sea Face Promenade, Mumbai 400030',
      coordinates: { lat: 19.0176, lng: 72.8172 },
    },
    specs: {
      bedrooms: 3,
      bathrooms: 4,
      areaSqFt: 4200,
      parkingSpaces: 3,
      yearBuilt: 2022,
      floorNumber: 18,
      totalFloors: 40,
    },
    amenities: [
      { icon: 'Waves', name: 'Direct Promenade Access' },
      { icon: 'ShieldCheck', name: '24/7 Guarded Lobby' },
      { icon: 'Dumbbell', name: 'Resident Health Club & Spa' },
      { icon: 'Zap', name: 'Smart Climate System' },
    ],
    features: [
      'Uninterrupted coastal water views with zero obstructable line of sight',
      'Dual master suites with custom Italian wardrobes',
      'Private storage room and staff suite on service level',
    ],
    images: {
      hero: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=1600&q=85&auto=format&fit=crop',
      gallery: [
        'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=1600&q=85&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?w=1600&q=85&auto=format&fit=crop',
      ],
    },
    floorPlanUrl: 'https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=1000&q=80&auto=format&fit=crop',
    agentId: 'agent-1',
    isFeatured: false,
    isSpotlight: false,
    isNew: true,
    status: 'Available',
    createdAt: '2026-08-05',
  },
  {
    id: 'prop-6',
    slug: 'sadashivnagar-botanical-villa-bangalore',
    title: 'Sadashivnagar Botanical Villa',
    tagline: 'Secluded Heritage Haven with Private Tennis Court',
    description: 'Nestled in Bangalore’s most elite traditional neighborhood. Spread over half an acre of manicured lawns with ancient gulmohar trees, private clay tennis court, and heated indoor swimming pool.',
    price: 380000000,
    formattedPrice: '₹38.00 Cr',
    pricePerSqFt: 44705,
    formattedPricePerSqFt: '₹44,705 / sq ft',
    propertyType: 'Villa',
    listingType: 'Buy',
    location: {
      city: 'Bangalore',
      area: 'Sadashivnagar',
      address: '14th Cross, Sadashivnagar, Bangalore, Karnataka 560080',
      coordinates: { lat: 13.0068, lng: 77.5813 },
    },
    specs: {
      bedrooms: 5,
      bathrooms: 6,
      areaSqFt: 8500,
      parkingSpaces: 4,
      yearBuilt: 2021,
      floorNumber: 1,
      totalFloors: 2,
    },
    amenities: [
      { icon: 'Target', name: 'Private Clay Tennis Court' },
      { icon: 'Waves', name: 'Indoor Heated Swimming Pool' },
      { icon: 'Trees', name: 'Half-Acre Private Botanical Gardens' },
      { icon: 'ShieldCheck', name: 'Perimeter Laser Security' },
    ],
    features: [
      'Private tennis court and pavilion lounge',
      'Solar grid installation offsetting 80% of energy consumption',
      'Wine cellar holding over 1,200 bottles',
    ],
    images: {
      hero: 'https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=1600&q=85&auto=format&fit=crop',
      gallery: [
        'https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=1600&q=85&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1600573472550-8090b5e0745e?w=1600&q=85&auto=format&fit=crop',
      ],
    },
    floorPlanUrl: 'https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=1000&q=80&auto=format&fit=crop',
    agentId: 'agent-3',
    isFeatured: true,
    isSpotlight: false,
    isNew: false,
    status: 'Available',
    createdAt: '2026-05-12',
  },
  {
    id: 'prop-7',
    slug: 'koregaon-park-sanctuary-pune',
    title: 'Koregaon Park Glass House',
    tagline: 'Architectural Zen Residence Surrounded by Banyan Trees',
    description: 'An architectural masterpiece in Lane 6, Koregaon Park. Seamlessly integrates floor-to-ceiling thermal glass with dark timber, Japanese courtyard gardens, and a private plunge pool.',
    price: 145000000,
    formattedPrice: '₹14.50 Cr',
    pricePerSqFt: 29000,
    formattedPricePerSqFt: '₹29,000 / sq ft',
    propertyType: 'Villa',
    listingType: 'Buy',
    location: {
      city: 'Pune',
      area: 'Koregaon Park',
      address: 'Lane 6, Koregaon Park, Pune, Maharashtra 411001',
      coordinates: { lat: 18.5362, lng: 73.894 },
    },
    specs: {
      bedrooms: 4,
      bathrooms: 5,
      areaSqFt: 5000,
      parkingSpaces: 3,
      yearBuilt: 2023,
      floorNumber: 1,
      totalFloors: 2,
    },
    amenities: [
      { icon: 'Trees', name: 'Japanese Courtyard Garden' },
      { icon: 'Waves', name: 'Private Plunge Pool' },
      { icon: 'Zap', name: 'Smart Climate & Shading' },
      { icon: 'ShieldCheck', name: 'Gated Security Enclave' },
    ],
    features: [
      'Minimalist timber and glass pavilion design',
      'Surrounded by 80-year-old heritage Banyan tree cover',
      '10-minute drive to Pune International Airport',
    ],
    images: {
      hero: 'https://images.unsplash.com/photo-1600573472550-8090b5e0745e?w=1600&q=85&auto=format&fit=crop',
      gallery: [
        'https://images.unsplash.com/photo-1600573472550-8090b5e0745e?w=1600&q=85&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1600&q=85&auto=format&fit=crop',
      ],
    },
    floorPlanUrl: 'https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=1000&q=80&auto=format&fit=crop',
    agentId: 'agent-1',
    isFeatured: false,
    isSpotlight: false,
    isNew: true,
    status: 'Available',
    createdAt: '2026-08-02',
  },
  {
    id: 'prop-8',
    slug: 'juhu-beachfront-penthouse-lease',
    title: 'Juhu Beachfront Glass Duplex',
    tagline: 'Ultra-Luxury Rental with Direct Ocean Sundeck',
    description: 'Available for long-term corporate or executive lease. A 4,800 sq ft duplex offering uninterrupted sunset views over Juhu Beach. Fully furnished with curated Italian designer pieces.',
    price: 1200000,
    formattedPrice: '₹12.00 Lakh / mo',
    pricePerSqFt: 250,
    formattedPricePerSqFt: '₹250 / sq ft / mo',
    propertyType: 'Penthouse',
    listingType: 'Rent',
    location: {
      city: 'Mumbai',
      area: 'Juhu',
      address: 'Juhu Tara Road, Juhu, Mumbai 400049',
      coordinates: { lat: 19.1075, lng: 72.8263 },
    },
    specs: {
      bedrooms: 4,
      bathrooms: 4,
      areaSqFt: 4800,
      parkingSpaces: 3,
      yearBuilt: 2024,
      floorNumber: 12,
      totalFloors: 14,
    },
    amenities: [
      { icon: 'Waves', name: 'Direct Beach Vista Deck' },
      { icon: 'Sparkles', name: 'Fully Furnished Interior' },
      { icon: 'ShieldCheck', name: 'Concierge Security' },
      { icon: 'Car', name: '3 Covered Reserved Bays' },
    ],
    features: [
      'Turnkey luxury rental complete with original contemporary artwork',
      'Private chef prep kitchen in addition to open show kitchen',
    ],
    images: {
      hero: 'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?w=1600&q=85&auto=format&fit=crop',
      gallery: [
        'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?w=1600&q=85&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1600&q=85&auto=format&fit=crop',
      ],
    },
    floorPlanUrl: 'https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=1000&q=80&auto=format&fit=crop',
    agentId: 'agent-4',
    isFeatured: true,
    isSpotlight: false,
    isNew: true,
    status: 'Available',
    createdAt: '2026-08-14',
  },
  {
    id: 'prop-9',
    slug: 'bhopal-lakeview-greens-township',
    title: 'Bhopal Lakeview Greens Township',
    tagline: 'Premium NA Approved Residential Plot in VIP Road Corridor',
    description: 'Exclusive NA-demarcated residential land plot located along Bhopal VIP Road overlooking Upper Lake (Bada Talaab). Features 40-ft wide internal tar roads, underground electricity cabling, gated perimeter, and immediate registry readiness.',
    price: 4500000,
    formattedPrice: '₹45.00 Lakh',
    pricePerSqFt: 2500,
    formattedPricePerSqFt: '₹2,500 / sq ft',
    propertyType: 'Estate',
    listingType: 'Buy',
    location: {
      city: 'Bhopal',
      area: 'VIP Road',
      address: 'VIP Road, Bada Talaab Promenade, Bhopal, Madhya Pradesh 462001',
      coordinates: { lat: 23.2599, lng: 77.4126 },
    },
    specs: {
      bedrooms: 0,
      bathrooms: 0,
      areaSqFt: 1800,
      parkingSpaces: 2,
      yearBuilt: 2026,
    },
    amenities: [
      { icon: 'ShieldCheck', name: 'Gated Township Security' },
      { icon: 'Trees', name: 'Lakeview Landscaping & Park' },
      { icon: 'Zap', name: 'Underground Cable & Water Supply' },
    ],
    features: [
      '100% Clear Title & Town Planning (TNCP) Approved',
      'Instant registry & possession handover',
      'Close proximity to Bhopal Airport & Lake Promenade',
    ],
    images: {
      hero: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=1600&q=85&auto=format&fit=crop',
      gallery: [
        'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=1600&q=85&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1600&q=85&auto=format&fit=crop',
      ],
    },
    floorPlanUrl: 'https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=1000&q=80&auto=format&fit=crop',
    agentId: 'agent-1',
    isFeatured: true,
    isSpotlight: true,
    isNew: true,
    status: 'Available',
    createdAt: '2026-09-01',
    legalInfo: { reraNumber: 'P-BPL-24-9988', titleType: 'Freehold NA' }
  },
]
