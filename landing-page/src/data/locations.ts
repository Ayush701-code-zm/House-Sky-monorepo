export interface Location {
  id: string
  slug: string
  name: string
  state: string
  heroImage: string
  cardImage: string
  tagline: string
  description: string
  avgPriceSqFt: string
  yoyGrowth: string
  activeListingsCount: number
  topNeighborhoods: string[]
  highlights: string[]
}

export const LOCATIONS: Location[] = [
  {
    id: 'loc-mumbai',
    slug: 'mumbai',
    name: 'Mumbai',
    state: 'Maharashtra',
    heroImage: 'https://images.unsplash.com/photo-1570168007204-dfb528c6958f?w=1600&q=85&auto=format&fit=crop',
    cardImage: 'https://images.unsplash.com/photo-1567157577867-05ccb1388e66?w=800&q=80&auto=format&fit=crop',
    tagline: 'India’s Pinnacle of Ultra-Prime Sea-Facing Real Estate',
    description: 'From iconic heritage mansions in Malabar Hill to glass-fronted sky villas overlooking the Arabian Sea in Worli and Bandra, Mumbai represents the peak of architectural prestige.',
    avgPriceSqFt: '₹68,500 / sq ft',
    yoyGrowth: '+12.4%',
    activeListingsCount: 42,
    topNeighborhoods: ['Bandra West', 'Worli Sea Face', 'Juhu Beachfront', 'Malabar Hill', 'Lower Parel'],
    highlights: ['Arabian Sea Coastline', 'Bandra-Worli Sea Link Access', 'Michelin-Starred Dining', 'Private Marina Access'],
  },
  {
    id: 'loc-goa',
    slug: 'goa',
    name: 'Goa',
    state: 'Goa',
    heroImage: 'https://images.unsplash.com/photo-1614082242765-7c98ca0f3df3?w=1600&q=85&auto=format&fit=crop',
    cardImage: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&q=80&auto=format&fit=crop',
    tagline: 'Tropical Modernist Sanctuaries & Heritage Portuguese Estates',
    description: 'Goa has redefined contemporary luxury living. Explore brutalist minimalist villas nestled in lush palm groves, cliffside infinity pools in Assagao, and private riverfront estates in Aldona.',
    avgPriceSqFt: '₹28,000 / sq ft',
    yoyGrowth: '+18.2%',
    activeListingsCount: 28,
    topNeighborhoods: ['Assagao', 'Anjuna Hills', 'Aldona Riverfront', 'Candolim Seafront', 'Moira'],
    highlights: ['Portuguese Heritage Architecture', 'Private Infinity Pools', 'Boutique Culinary Scene', 'Mopa International Airport Connectivity'],
  },
  {
    id: 'loc-delhi-ncr',
    slug: 'delhi-ncr',
    name: 'Delhi NCR',
    state: 'Delhi / Haryana',
    heroImage: 'https://images.unsplash.com/photo-1587474260584-136574528ed5?w=1600&q=85&auto=format&fit=crop',
    cardImage: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80&auto=format&fit=crop',
    tagline: 'Expansive Sprawling Estates & Golf Course Sky Duplexes',
    description: 'Home to majestic Lutyens Bungalow Zone residences, tree-lined diplomatic avenues, and high-tech luxury towers overlooking championship golf courses along Golf Course Road.',
    avgPriceSqFt: '₹42,000 / sq ft',
    yoyGrowth: '+14.1%',
    activeListingsCount: 35,
    topNeighborhoods: ['Golf Course Road', 'DLF Phase 5', 'Sundar Nagar', 'Panchsheel Park', 'Chanakyapuri'],
    highlights: ['Private Golf Course Views', 'Helipad Access', 'Diplomatic Security Enclaves', 'Expansive Manicured Grounds'],
  },
  {
    id: 'loc-bangalore',
    slug: 'bangalore',
    name: 'Bangalore',
    state: 'Karnataka',
    heroImage: 'https://images.unsplash.com/photo-1596178065887-1198b6148b2b?w=1600&q=85&auto=format&fit=crop',
    cardImage: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80&auto=format&fit=crop',
    tagline: 'Silicon Valley’s Garden Estates & Ultra-Modern Smart Penthouses',
    description: 'Blended climate and tech-driven innovation meet lush canopy avenues in Sadashivnagar, Indiranagar, and private golf estates near International Airport road.',
    avgPriceSqFt: '₹24,500 / sq ft',
    yoyGrowth: '+11.8%',
    activeListingsCount: 31,
    topNeighborhoods: ['Sadashivnagar', 'Indiranagar', 'Koramangala 3rd Block', 'Hebbal Lakefront', 'Lavelle Road'],
    highlights: ['Year-round Pleasant Climate', 'Smart Home Automation', 'Proximity to Tech Hubs', 'Private Lakes & Parks'],
  },
  {
    id: 'loc-hyderabad',
    slug: 'hyderabad',
    name: 'Hyderabad',
    state: 'Telangana',
    heroImage: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1600&q=85&auto=format&fit=crop',
    cardImage: 'https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?w=800&q=80&auto=format&fit=crop',
    tagline: 'Royal Heritage Meets Contemporary Hilltop Mansions',
    description: 'Jubilee Hills and Banjara Hills showcase palatial modern architecture, sprawling plots, and high-security gated compounds with panoramic skyline vistas.',
    avgPriceSqFt: '₹22,000 / sq ft',
    yoyGrowth: '+16.5%',
    activeListingsCount: 24,
    topNeighborhoods: ['Jubilee Hills', 'Banjara Hills', 'Gachibowli Financial District', 'Kokapet Lakefront'],
    highlights: ['Elevated Hilltop Views', 'Palatial Plot Sizes', 'Gated Security Enclaves', 'Outer Ring Road Connectivity'],
  },
  {
    id: 'loc-pune',
    slug: 'pune',
    name: 'Pune',
    state: 'Maharashtra',
    heroImage: 'https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=1600&q=85&auto=format&fit=crop',
    cardImage: 'https://images.unsplash.com/photo-1600573472550-8090b5e0745e?w=800&q=80&auto=format&fit=crop',
    tagline: 'Boutique Green Mansions & Koregaon Park Cultural Enclaves',
    description: 'Serene banyan-shaded avenues of Koregaon Park and modern high-rise penthouses in Kalyani Nagar offering quiet luxury and refined living.',
    avgPriceSqFt: '₹19,800 / sq ft',
    yoyGrowth: '+9.8%',
    activeListingsCount: 19,
    topNeighborhoods: ['Koregaon Park', 'Kalyani Nagar', 'Bhosale Nagar', 'Baner Hills'],
    highlights: ['Boutique Heritage Cafes', 'Lush Green Canopies', 'Low Density Living', 'Proximity to Mumbai Express Highway'],
  },
]
