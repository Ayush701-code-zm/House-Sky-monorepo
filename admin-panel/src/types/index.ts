export interface User {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  role: 'ADMIN' | 'MANAGER' | 'EMPLOYEE' | 'AGENT' | 'DIRECTOR';
  avatar?: string;
}

export const RANKS = [
  'Business Executive',
  'Sr Business Executive',
  'Team Leader',
  'Sr Team Leader',
  'Business Development Manager',
  'Associate Sales Director',
  'Director Sales'
];

export type KycStatus = 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED';

export interface AgentKyc {
  _id?: string;
  employeeId?: any;
  firstName: string;
  middleName: string;
  surname: string;
  dateOfBirth?: string | null;
  address: string;
  mobile: string;
  alternatePhone: string;
  email: string;
  panNumber: string;
  aadhaarNumber: string;
  accountHolderName: string;
  accountNumber: string;
  ifscCode: string;
  bankName: string;
  branchName: string;
  nomineeName: string;
  nomineeDob?: string | null;
  nomineeAddress: string;
  nomineeRelation: string;
  panDocUrl: string;
  panDocS3Key: string;
  aadhaarDocUrl: string;
  aadhaarDocS3Key: string;
  status: KycStatus;
  rejectionReason?: string;
  submittedAt?: string;
  reviewedAt?: string;
}

export interface Employee {
  id: string;
  _id?: string;
  employeeCode: string;
  currentRank: string;
  selfSalesCount: number;
  teamSalesCount: number;
  activeLegsCount: number;
  joiningDate: string;
  parentId?: any;
  inviteCode?: string;
  legNumber?: number;  // Which leg slot under the parent (1, 2, 3... N — unlimited)
  userId?: User;
}

export interface MLMTreeNode {
  id: string;
  employeeCode: string;
  name: string;
  email: string;
  phone: string;
  avatar?: string;
  currentRank: string;
  commissionPercent: number;
  selfSalesCount: number;
  teamSalesCount: number;
  activeLegsCount: number;
  parentId?: string | null;
  legNumber?: number;  // Which leg slot under the parent (1, 2, 3... N — unlimited)
  children: MLMTreeNode[];
}

export interface GalleryImage {
  url: string;
  s3Key?: string;
  caption?: string;
}

export interface Project {
  _id: string;
  name: string;
  code: string;
  location: string;
  city?: string;
  state?: string;
  description?: string;
  totalAreaSqft: number;
  area?: string;
  totalPlots: number;
  priceRange?: string;
  status: 'UPCOMING' | 'ACTIVE' | 'COMPLETED';
  basePricePerSqft: number;
  bannerImage?: string;
  bannerImageS3Key?: string;
  mapImageUrl?: string;
  mapImageS3Key?: string;
  logoImage?: string;
  insetImage?: string;
  gallery?: GalleryImage[];
  surveyNumber?: string;
  village?: string;
  googleMapsUrl?: string;
  mapEmbedUrl?: string;
  brochureUrl?: string;
  videoUrl?: string;
  contactPhone?: string;
  contactEmail?: string;
  highlights?: string[];
  amenities?: string[];
  locationAdvantages?: { distance: string; landmark: string }[];
  legalInfo?: {
    reraNumber?: string;
    titleType?: string;
    approvalAuthority?: string;
  };
  availableCount?: number;
  pendingCount?: number;
  bookedCount?: number;
  soldCount?: number;
  isDholera?: boolean;
}

export const PROPERTY_TYPES = [
  'RESIDENTIAL_PLOT',
  'COMMERCIAL',
  'VILLA',
  'SHOWROOM',
  'APARTMENT',
  'STUDIO_APARTMENT',
  'LAND'
] as const;

export type PropertyType = typeof PROPERTY_TYPES[number];

export interface PropertyKycInfo {
  fullName: string;
  idType: 'PAN' | 'AADHAAR' | 'PASSPORT' | 'VOTER_ID' | 'DRIVING_LICENSE';
  idNumber: string;
  idDocumentUrl?: string;
  idDocumentS3Key?: string;
  ownershipType: 'OWNER' | 'JOINT_OWNER' | 'AGENT_POA' | 'BUILDER';
  ownershipDocumentUrl?: string;
  ownershipDocumentS3Key?: string;
  propertyTaxId?: string;
  declarationSigned: boolean;
  verifiedStatus?: 'PENDING' | 'VERIFIED' | 'REJECTED';
  submittedAt?: string;
}

export interface ListingProperty {
  _id: string;
  title: string;
  slug: string;
  tagline?: string;
  description?: string;
  propertyType: PropertyType;
  listingType: 'SALE' | 'RENT' | 'LEASE';
  projectId?: string | Project | null;
  location?: string;
  city?: string;
  state?: string;
  area?: string;
  address?: string;
  village?: string;
  surveyNumber?: string;
  price?: number;
  pricePerSqft?: number;
  priceRange?: string;
  areaSqft?: number;
  areaSqYrd?: number;
  dimensions?: string;
  bedrooms?: number;
  bathrooms?: number;
  parkingSpaces?: number;
  highlights?: string[];
  amenities?: string[];
  features?: string[];
  heroImage?: string;
  gallery?: GalleryImage[];
  floorPlanUrl?: string;
  brochureUrl?: string;
  videoUrl?: string;
  googleMapsUrl?: string;
  mapEmbedUrl?: string;
  contactPhone?: string;
  contactEmail?: string;
  status: 'AVAILABLE' | 'BOOKED' | 'SOLD' | 'UPCOMING';
  isFeatured?: boolean;
  isPublished?: boolean;
  legalInfo?: {
    reraNumber?: string;
    titleType?: string;
    approvalAuthority?: string;
  };
  kycInfo?: PropertyKycInfo;
  // Approval workflow fields (added for public submission feature)
  approvalStatus?: 'PENDING' | 'APPROVED' | 'REJECTED';
  source?: 'ADMIN' | 'PUBLIC';
  rejectionReason?: string;
  submittedAt?: string;
  createdAt?: string;
}

export interface Plot {
  _id: string;
  projectId: string | Project;
  block: string;
  plotNo: string;
  sizeSqft: number;
  sellableSqYrd?: number;
  carpetSqYrd?: number;
  plc12mtr?: number;
  plc9mtr?: number;
  plcCorner?: number;
  plcParkFacing?: number;
  totalPlc?: number;
  discountedPlc?: number;
  otmc?: number;
  gstOnOtherCharges?: number;
  totalCost?: number;
  price: number;
  status: 'AVAILABLE' | 'BOOKED' | 'PENDING' | 'SOLD';
  plotType?: string;
  facing?: string;
  dimensions?: string;
  superBuiltUpSqft?: number;
  marker?: {
    xPercent?: number | null;
    yPercent?: number | null;
  };
  coordinates?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  polygon?: {
    points: { x: number; y: number }[];
    svgPath?: string;
  };
  ownerName?: string;
  ownerPhone?: string;
  ownerEmail?: string;
  bookingDate?: string;
  paidAmount?: number;
  dueBalance?: number;
  registryDate?: string;
  registryStatus?: 'NOT_REGISTERED' | 'PENDING' | 'REGISTERED';
  paymentMilestones?: PaymentMilestone[];
  sellerEmployeeId?: any;
}

export interface PaymentMilestone {
  _id?: string;
  title: string;
  amount: number;
  dueDate: string;
  status: 'PENDING' | 'RECEIVED' | 'OVERDUE';
  paymentMode?: string;
  receivedDate?: string;
  notes?: string;
}

export interface PlotDocument {
  _id: string;
  plotId: string;
  documentType: string;
  title: string;
  fileUrl: string;
  createdAt: string;
}

export interface Commission {
  _id: string;
  plotId: Plot;
  employeeId: Employee;
  rankAtSale: string;
  saleAmount: number;
  commissionRate: number;
  differentialRate: number;
  commissionAmount: number;
  levelDepth: number;
  status: 'CALCULATED' | 'APPROVED' | 'PAID' | 'CANCELLED';
  calculatedAt: string;
}

export interface Payout {
  _id: string;
  employeeId: Employee;
  amount: number;
  payoutDate: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  referenceNo: string;
}

export interface NotificationItem {
  _id: string;
  title: string;
  message: string;
  channel: 'IN_APP' | 'EMAIL' | 'WHATSAPP';
  status: 'UNREAD' | 'READ' | 'SENT' | 'FAILED';
  sentAt: string;
}

export interface DashboardStats {
  kpi: {
    totalRevenue: number;
    monthlyRevenue: number;
    totalEmployees: number;
    totalProjects: number;
    totalPlots: number;
    availablePlots: number;
    bookedPlots: number;
    pendingPlots: number;
    soldPlots: number;
    totalCommissions: number;
    totalPayouts: number;
  };
  charts: {
    revenueTrend: { month: string; revenue: number; sales: number }[];
    plotStatusDistribution: { name: string; value: number; color: string }[];
    topEmployees: { name: string; rank: string; sales: number; teamSales: number }[];
    projectRevenue: { name: string; plots: number; soldPlots: number; revenue: number }[];
  };
}
