import React, { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { GalleryUploader } from '../common/GalleryUploader';
import LocationMapPicker from '../common/LocationMapPicker';
import AreaUnitField from '../common/AreaUnitField';
import { gajFromSqft } from '../../utils/areaUnits';
import { GalleryImage, ListingProperty, Project, PROPERTY_TYPES } from '../../types';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';

const GALLERY_FOLDER = 'property_gallery';
const HERO_FOLDER = 'property_hero';
const PROPERTY_TYPE_LABELS: Record<string, string> = {
  RESIDENTIAL_PLOT: 'Residential Plot',
  COMMERCIAL: 'Commercial Property',
  VILLA: 'Villa',
  SHOWROOM: 'Commercial Showroom',
  APARTMENT: 'Apartment',
  STUDIO_APARTMENT: 'Studio Apartment',
  LAND: 'Land'
};

export interface PropertyFormValues {
  title: string;
  tagline: string;
  description: string;
  propertyType: ListingProperty['propertyType'];
  listingType: ListingProperty['listingType'];
  projectId: string;
  location: string;
  city: string;
  state: string;
  area: string;
  address: string;
  village: string;
  surveyNumber: string;
  price: number;
  pricePerSqft: number;
  priceRange: string;
  areaSqft: number;
  areaSqYrd: number;
  dimensions: string;
  bedrooms: number;
  bathrooms: number;
  parkingSpaces: number;
  highlights: string[];
  amenities: string[];
  features: string[];
  heroImage: string;
  gallery: GalleryImage[];
  floorPlanUrl: string;
  brochureUrl: string;
  videoUrl: string;
  latitude: number | null;
  longitude: number | null;
  googleMapsUrl: string;
  mapEmbedUrl: string;
  contactPhone: string;
  contactEmail: string;
  status: ListingProperty['status'];
  isFeatured: boolean;
  isPublished: boolean;
  reraNumber: string;
  titleType: string;
  approvalAuthority: string;
}

export function emptyPropertyForm(): PropertyFormValues {
  return {
    title: '',
    tagline: '',
    description: '',
    propertyType: 'RESIDENTIAL_PLOT',
    listingType: 'SALE',
    projectId: '',
    location: '',
    city: '',
    state: '',
    area: '',
    address: '',
    village: '',
    surveyNumber: '',
    price: 0,
    pricePerSqft: 0,
    priceRange: '',
    areaSqft: 0,
    areaSqYrd: 0,
    dimensions: '',
    bedrooms: 0,
    bathrooms: 0,
    parkingSpaces: 0,
    highlights: [],
    amenities: [],
    features: [],
    heroImage: '',
    gallery: [],
    floorPlanUrl: '',
    brochureUrl: '',
    videoUrl: '',
    latitude: null,
    longitude: null,
    googleMapsUrl: '',
    mapEmbedUrl: '',
    contactPhone: '',
    contactEmail: '',
    status: 'AVAILABLE',
    isFeatured: false,
    isPublished: true,
    reraNumber: '',
    titleType: 'Freehold',
    approvalAuthority: ''
  };
}

export function propertyToForm(property: ListingProperty): PropertyFormValues {
  const projectIdValue = typeof property.projectId === 'object' && property.projectId
    ? String((property.projectId as any)._id || (property.projectId as any).id || '')
    : String(property.projectId || '');

  return {
    ...emptyPropertyForm(),
    title: property.title || '',
    tagline: property.tagline || '',
    description: property.description || '',
    propertyType: property.propertyType || 'RESIDENTIAL_PLOT',
    listingType: property.listingType || 'SALE',
    projectId: projectIdValue,
    location: property.location || '',
    city: property.city || '',
    state: property.state || '',
    area: property.area || '',
    address: property.address || '',
    village: property.village || '',
    surveyNumber: property.surveyNumber || '',
    price: property.price || 0,
    pricePerSqft: property.pricePerSqft || 0,
    priceRange: property.priceRange || '',
    areaSqft: property.areaSqft || 0,
    areaSqYrd: property.areaSqYrd || 0,
    dimensions: property.dimensions || '',
    bedrooms: property.bedrooms || 0,
    bathrooms: property.bathrooms || 0,
    parkingSpaces: property.parkingSpaces || 0,
    highlights: property.highlights || [],
    amenities: property.amenities || [],
    features: property.features || [],
    heroImage: property.heroImage || '',
    gallery: property.gallery || [],
    floorPlanUrl: property.floorPlanUrl || '',
    brochureUrl: property.brochureUrl || '',
    videoUrl: property.videoUrl || '',
    latitude: property.latitude ?? null,
    longitude: property.longitude ?? null,
    googleMapsUrl: property.googleMapsUrl || '',
    mapEmbedUrl: property.mapEmbedUrl || '',
    contactPhone: property.contactPhone || '',
    contactEmail: property.contactEmail || '',
    status: property.status || 'AVAILABLE',
    isFeatured: Boolean(property.isFeatured),
    isPublished: property.isPublished !== false,
    reraNumber: property.legalInfo?.reraNumber || '',
    titleType: property.legalInfo?.titleType || 'Freehold',
    approvalAuthority: property.legalInfo?.approvalAuthority || ''
  };
}

export function formToPayload(form: PropertyFormValues) {
  return {
    title: form.title,
    tagline: form.tagline,
    description: form.description,
    propertyType: form.propertyType,
    listingType: form.listingType,
    // null (not undefined) so clearing the project on edit actually unlinks it
    projectId: form.projectId || null,
    location: form.location,
    city: form.city,
    state: form.state,
    area: form.area,
    address: form.address,
    village: form.village,
    surveyNumber: form.surveyNumber,
    price: form.price,
    pricePerSqft: form.pricePerSqft,
    priceRange: form.priceRange,
    areaSqft: form.areaSqft,
    areaSqYrd: form.areaSqYrd,
    dimensions: form.dimensions,
    bedrooms: form.bedrooms,
    bathrooms: form.bathrooms,
    parkingSpaces: form.parkingSpaces,
    highlights: form.highlights,
    amenities: form.amenities,
    features: form.features,
    heroImage: form.heroImage,
    gallery: form.gallery,
    floorPlanUrl: form.floorPlanUrl,
    brochureUrl: form.brochureUrl,
    videoUrl: form.videoUrl,
    latitude: form.latitude,
    longitude: form.longitude,
    googleMapsUrl: form.googleMapsUrl,
    mapEmbedUrl: form.mapEmbedUrl,
    contactPhone: form.contactPhone,
    contactEmail: form.contactEmail,
    status: form.status,
    isFeatured: form.isFeatured,
    isPublished: form.isPublished,
    legalInfo: {
      reraNumber: form.reraNumber,
      titleType: form.titleType,
      approvalAuthority: form.approvalAuthority
    }
  };
}

const inputClass = 'w-full bg-[#FDFCF0] border border-[#0B4F3C]/20 rounded-xl px-3 py-2 text-[#171A18] font-bold focus:outline-none focus:border-[#0B4F3C]';
const labelClass = 'text-[#171A18]/70 font-semibold block mb-1 text-xs';

interface PropertyFormProps {
  value: PropertyFormValues;
  onChange: (next: PropertyFormValues) => void;
  projects: Project[];
}

function TagList({
  items,
  onChange,
  placeholder
}: {
  items: string[];
  onChange: (items: string[]) => void;
  placeholder: string;
}) {
  const [draft, setDraft] = useState('');
  const add = () => {
    const next = draft.trim();
    if (!next) return;
    onChange([...items, next]);
    setDraft('');
  };

  return (
    <div>
      <div className="flex gap-2 mb-2">
        <input
          type="text"
          placeholder={placeholder}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); add(); } }}
          className={`flex-1 ${inputClass}`}
        />
        <button type="button" onClick={add} className="px-3 py-2 bg-[#0B4F3C] text-white rounded-xl cursor-pointer">
          <Plus className="w-4 h-4" />
        </button>
      </div>
      {items.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {items.map((item, index) => (
            <span key={`${item}-${index}`} className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#E8F0EC] border border-[#0B4F3C]/20 rounded-lg text-xs font-bold text-[#0B4F3C]">
              {item}
              <button type="button" onClick={() => onChange(items.filter((_, i) => i !== index))} className="text-red-500 cursor-pointer">
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export const PropertyForm: React.FC<PropertyFormProps> = ({ value, onChange, projects }) => {
  const toast = useToast();
  const [isHeroUploading, setIsHeroUploading] = useState(false);

  const patch = (partial: Partial<PropertyFormValues>) => onChange({ ...value, ...partial });

  const uploadHero = async (file: File) => {
    setIsHeroUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', HERO_FOLDER);
      const response = await api.post('/upload', formData);
      if (response.data?.url) {
        patch({ heroImage: response.data.url });
        toast.success('Hero image uploaded');
      }
    } catch {
      toast.error('Hero image upload failed');
    } finally {
      setIsHeroUploading(false);
    }
  };

  return (
    <div className="space-y-5 text-xs">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="sm:col-span-2">
          <label className={labelClass}>Property Title *</label>
          <input type="text" required value={value.title} onChange={(e) => patch({ title: e.target.value })} placeholder="Residential Plot For Sale In Dholera" className={inputClass} />
        </div>
        <div className="sm:col-span-2">
          <label className={labelClass}>Tagline</label>
          <input type="text" value={value.tagline} onChange={(e) => patch({ tagline: e.target.value })} placeholder="Prime plotted inventory with clear title" className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Property Type</label>
          <select value={value.propertyType} onChange={(e) => patch({ propertyType: e.target.value as ListingProperty['propertyType'] })} className={inputClass}>
            {PROPERTY_TYPES.map((type) => (
              <option key={type} value={type}>{PROPERTY_TYPE_LABELS[type]}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass}>Listing Type</label>
          <select value={value.listingType} onChange={(e) => patch({ listingType: e.target.value as ListingProperty['listingType'] })} className={inputClass}>
            <option value="SALE">Sale</option>
            <option value="RENT">Rent</option>
          </select>
        </div>
        <div>
          <label className={labelClass}>Linked Township Project</label>
          <select value={value.projectId} onChange={(e) => patch({ projectId: e.target.value })} className={inputClass}>
            <option value="">Not linked to a project</option>
            {projects.map((project) => (
              <option key={project._id} value={project._id}>{project.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass}>Status</label>
          <select value={value.status} onChange={(e) => patch({ status: e.target.value as ListingProperty['status'] })} className={inputClass}>
            <option value="AVAILABLE">Available</option>
            <option value="UPCOMING">Upcoming</option>
            <option value="BOOKED">Booked</option>
            <option value="SOLD">Sold</option>
          </select>
        </div>
      </div>

      <textarea rows={3} value={value.description} onChange={(e) => patch({ description: e.target.value })} placeholder="Full marketing description shown on the public property page" className={`${inputClass} resize-none`} />

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div>
          <label className={labelClass}>Location</label>
          <input type="text" value={value.location} onChange={(e) => patch({ location: e.target.value })} placeholder="Dholera SIR" className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>City</label>
          <input type="text" value={value.city} onChange={(e) => patch({ city: e.target.value })} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>State</label>
          <input type="text" value={value.state} onChange={(e) => patch({ state: e.target.value })} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Area / Sector</label>
          <input type="text" value={value.area} onChange={(e) => patch({ area: e.target.value })} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Village</label>
          <input type="text" value={value.village} onChange={(e) => patch({ village: e.target.value })} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Survey Number</label>
          <input type="text" value={value.surveyNumber} onChange={(e) => patch({ surveyNumber: e.target.value })} className={inputClass} />
        </div>
        <div className="sm:col-span-3">
          <label className={labelClass}>Full Address</label>
          <input type="text" value={value.address} onChange={(e) => patch({ address: e.target.value })} className={inputClass} />
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div>
          <label className={labelClass}>Price (₹)</label>
          <input type="number" min={0} value={value.price} onChange={(e) => patch({ price: Number(e.target.value) })} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Rate / sq ft</label>
          <input type="number" min={0} value={value.pricePerSqft} onChange={(e) => patch({ pricePerSqft: Number(e.target.value) })} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Price Range</label>
          <input type="text" value={value.priceRange} onChange={(e) => patch({ priceRange: e.target.value })} placeholder="₹18L – ₹45L" className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Dimensions</label>
          <input type="text" value={value.dimensions} onChange={(e) => patch({ dimensions: e.target.value })} placeholder="20x40" className={inputClass} />
        </div>
        <div className="col-span-2">
          <AreaUnitField
            sqft={value.areaSqft}
            onSqftChange={(sqft) => patch({ areaSqft: sqft, areaSqYrd: gajFromSqft(sqft) })}
            label="Area"
          />
        </div>
        <div>
          <label className={labelClass}>Bedrooms</label>
          <input type="number" min={0} value={value.bedrooms} onChange={(e) => patch({ bedrooms: Number(e.target.value) })} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Bathrooms</label>
          <input type="number" min={0} value={value.bathrooms} onChange={(e) => patch({ bathrooms: Number(e.target.value) })} className={inputClass} />
        </div>
      </div>

      <div>
        <label className={labelClass}>Highlights</label>
        <TagList items={value.highlights} onChange={(highlights) => patch({ highlights })} placeholder="Add highlight" />
      </div>
      <div>
        <label className={labelClass}>Amenities</label>
        <TagList items={value.amenities} onChange={(amenities) => patch({ amenities })} placeholder="e.g. 24/7 Security" />
      </div>
      <div>
        <label className={labelClass}>Features</label>
        <TagList items={value.features} onChange={(features) => patch({ features })} placeholder="e.g. Corner plot" />
      </div>

      <div>
        <label className={labelClass}>Hero Image</label>
        <div className="flex items-center gap-3">
          {value.heroImage && <img src={value.heroImage} alt="Hero" className="w-20 h-16 rounded-xl object-cover border border-[#0B4F3C]/15" />}
          <label className="px-3 py-2 rounded-xl bg-[#E8F0EC] border border-[#0B4F3C]/20 text-[#0B4F3C] font-bold cursor-pointer">
            {isHeroUploading ? 'Uploading…' : 'Upload hero to S3'}
            <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && uploadHero(e.target.files[0])} />
          </label>
        </div>
      </div>

      <GalleryUploader items={value.gallery} onChange={(gallery) => patch({ gallery })} folder={GALLERY_FOLDER} label="Property Gallery (S3)" />

      <LocationMapPicker
        latitude={value.latitude}
        longitude={value.longitude}
        onChange={({ latitude, longitude, googleMapsUrl, mapEmbedUrl }) =>
          patch({
            latitude,
            longitude,
            ...(googleMapsUrl !== undefined ? { googleMapsUrl } : {}),
            ...(mapEmbedUrl !== undefined ? { mapEmbedUrl } : {})
          })
        }
      />
      <div>
        <label className={labelClass}>Google Maps URL (auto from pin)</label>
        <input type="url" value={value.googleMapsUrl} onChange={(e) => patch({ googleMapsUrl: e.target.value })} className={inputClass} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className={labelClass}>Brochure URL</label>
          <input type="url" value={value.brochureUrl} onChange={(e) => patch({ brochureUrl: e.target.value })} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Floor Plan URL</label>
          <input type="url" value={value.floorPlanUrl} onChange={(e) => patch({ floorPlanUrl: e.target.value })} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Video URL</label>
          <input type="url" value={value.videoUrl} onChange={(e) => patch({ videoUrl: e.target.value })} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Contact Phone</label>
          <input type="tel" value={value.contactPhone} onChange={(e) => patch({ contactPhone: e.target.value })} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Contact Email</label>
          <input type="email" value={value.contactEmail} onChange={(e) => patch({ contactEmail: e.target.value })} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>RERA Number</label>
          <input type="text" value={value.reraNumber} onChange={(e) => patch({ reraNumber: e.target.value })} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Title Type</label>
          <input type="text" value={value.titleType} onChange={(e) => patch({ titleType: e.target.value })} className={inputClass} />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <label className="inline-flex items-center gap-2 font-bold text-[#171A18] cursor-pointer">
          <input type="checkbox" checked={value.isFeatured} onChange={(e) => patch({ isFeatured: e.target.checked })} />
          Featured on homepage
        </label>
        <label className="inline-flex items-center gap-2 font-bold text-[#171A18] cursor-pointer">
          <input type="checkbox" checked={value.isPublished} onChange={(e) => patch({ isPublished: e.target.checked })} />
          Published on landing page
        </label>
      </div>
    </div>
  );
};
