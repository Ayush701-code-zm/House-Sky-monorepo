import React, { useState } from 'react';
import { X, Building2, UploadCloud, Plus, Star } from 'lucide-react';
import api from '../../services/api';
import { GalleryImage, Project } from '../../types';
import { useToast } from '../../context/ToastContext';
import { GalleryUploader } from '../common/GalleryUploader';
import LocationMapPicker from '../common/LocationMapPicker';
import AreaUnitField from '../common/AreaUnitField';
import { DraftNotice } from '../common/DraftNotice';
import { clearDraft } from '../../utils/formDraft';
import { mergeDraft, usePersistDraft } from '../../utils/useFormDraft';

interface EditProjectModalProps {
  project: Project;
  onClose: () => void;
  onSuccess: () => void;
  onDiscardDraft?: () => void;
}

function editProjectBaseline(project: Project) {
  return {
    name: project.name,
    code: project.code,
    location: project.location,
    city: (project as any).city || '',
    state: (project as any).state || 'Haryana',
    description: (project as any).description || '',
    totalAreaSqft: project.totalAreaSqft || 250000,
    area: (project as any).area || '',
    totalPlots: project.totalPlots,
    basePricePerSqft: project.basePricePerSqft,
    priceRange: (project as any).priceRange || '',
    highlights: ((project as any).highlights || []) as string[],
    amenities: ((project as any).amenities || []) as string[],
    locationAdvantages: ((project as any).locationAdvantages || []) as { distance: string; landmark: string }[],
    highlightInput: '',
    amenityInput: '',
    locAdvDistance: '',
    locAdvLandmark: '',
    contactPhone: (project as any).contactPhone || '',
    contactEmail: (project as any).contactEmail || '',
    brochureUrl: (project as any).brochureUrl || '',
    videoUrl: (project as any).videoUrl || '',
    reraNumber: (project as any).legalInfo?.reraNumber || '',
    titleType: (project as any).legalInfo?.titleType || 'Freehold',
    approvalAuthority: (project as any).legalInfo?.approvalAuthority || '',
    mapImageUrl: (project as any).mapImageUrl || '',
    mapImageS3Key: (project as any).mapImageS3Key || '',
    bannerImage: project.bannerImage && project.bannerImage !== (project as any).mapImageUrl ? project.bannerImage : '',
    bannerImageS3Key: (project as any).bannerImageS3Key || '',
    bannerFileName: '',
    gallery: (project.gallery || []) as GalleryImage[],
    surveyNumber: project.surveyNumber || '',
    village: project.village || '',
    googleMapsUrl: project.googleMapsUrl || '',
    mapEmbedUrl: project.mapEmbedUrl || '',
    paymentQrUrl: (project as any).paymentQrUrl || '',
    bankDetails: (project as any).bankDetails || '',
    latitude: project.latitude ?? null,
    longitude: project.longitude ?? null,
    fileName: '',
    isDholera: project.isDholera || false,
  };
}

const EditProjectModalBody: React.FC<EditProjectModalProps> = ({ project, onClose, onSuccess, onDiscardDraft }) => {
  const toast = useToast();
  const draftKey = `hs-admin-project-edit-${project._id}`;
  const baseline = editProjectBaseline(project);
  const [boot] = useState(() => mergeDraft(draftKey, baseline));
  const initial = boot.value;
  const [draftRestored] = useState(boot.restored);
  const [name, setName] = useState(initial.name);
  const [code, setCode] = useState(initial.code);
  const [location, setLocation] = useState(initial.location);
  const [city, setCity] = useState(initial.city);
  const [state, setState] = useState(initial.state);
  const [description, setDescription] = useState(initial.description);
  const [totalAreaSqft, setTotalAreaSqft] = useState(initial.totalAreaSqft);
  const [area, setArea] = useState(initial.area);
  const [totalPlots, setTotalPlots] = useState(initial.totalPlots);
  const [basePricePerSqft, setBasePricePerSqft] = useState(initial.basePricePerSqft);
  const [priceRange, setPriceRange] = useState(initial.priceRange);
  const [highlights, setHighlights] = useState<string[]>(initial.highlights);
  const [amenities, setAmenities] = useState<string[]>(initial.amenities);
  const [locationAdvantages, setLocationAdvantages] = useState<{distance: string; landmark: string}[]>(initial.locationAdvantages);
  const [highlightInput, setHighlightInput] = useState(initial.highlightInput);
  const [amenityInput, setAmenityInput] = useState(initial.amenityInput);
  const [locAdvDistance, setLocAdvDistance] = useState(initial.locAdvDistance);
  const [locAdvLandmark, setLocAdvLandmark] = useState(initial.locAdvLandmark);
  const [contactPhone, setContactPhone] = useState(initial.contactPhone);
  const [contactEmail, setContactEmail] = useState(initial.contactEmail);
  const [brochureUrl, setBrochureUrl] = useState(initial.brochureUrl);
  const [videoUrl, setVideoUrl] = useState(initial.videoUrl);
  const [reraNumber, setReraNumber] = useState(initial.reraNumber);
  const [titleType, setTitleType] = useState(initial.titleType);
  const [approvalAuthority, setApprovalAuthority] = useState(initial.approvalAuthority);
  const [mapImageUrl, setMapImageUrl] = useState(initial.mapImageUrl);
  const [mapImageS3Key, setMapImageS3Key] = useState(initial.mapImageS3Key);
  const [bannerImage, setBannerImage] = useState(initial.bannerImage);
  const [bannerImageS3Key, setBannerImageS3Key] = useState(initial.bannerImageS3Key);
  const [bannerFileName, setBannerFileName] = useState(initial.bannerFileName);
  const [gallery, setGallery] = useState<GalleryImage[]>(initial.gallery);
  const [surveyNumber, setSurveyNumber] = useState(initial.surveyNumber);
  const [village, setVillage] = useState(initial.village);
  const [googleMapsUrl, setGoogleMapsUrl] = useState(initial.googleMapsUrl);
  const [mapEmbedUrl, setMapEmbedUrl] = useState(initial.mapEmbedUrl);
  const [paymentQrUrl, setPaymentQrUrl] = useState(initial.paymentQrUrl);
  const [bankDetails, setBankDetails] = useState(initial.bankDetails);
  const [latitude, setLatitude] = useState<number | null>(initial.latitude);
  const [longitude, setLongitude] = useState<number | null>(initial.longitude);
  const [fileName, setFileName] = useState(initial.fileName);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDholera, setIsDholera] = useState(initial.isDholera);
  const [isUploading, setIsUploading] = useState(false);

  const clearEditDraft = usePersistDraft(draftKey, {
    name, code, location, city, state, description, totalAreaSqft, area, totalPlots,
    basePricePerSqft, priceRange, highlights, amenities, locationAdvantages,
    highlightInput, amenityInput, locAdvDistance, locAdvLandmark, contactPhone, contactEmail,
    brochureUrl, videoUrl, reraNumber, titleType, approvalAuthority, mapImageUrl, mapImageS3Key,
    bannerImage, bannerImageS3Key, bannerFileName, gallery, surveyNumber, village,
    googleMapsUrl, mapEmbedUrl, paymentQrUrl, bankDetails, latitude, longitude, fileName, isDholera,
  }, baseline);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFileName(file.name);
      try {
        setIsUploading(true);
        const formData = new FormData();
        formData.append('file', file);
        formData.append('folder', 'project_maps');

        const response = await api.post('/upload', formData);

        if (response.data?.url) {
          setMapImageUrl(response.data.url);
          setMapImageS3Key(response.data.s3Key || '');
          toast.success('Map uploaded to S3 successfully!');
        }
      } catch (err) {
        console.error('S3 Upload Error:', err);
        toast.error('Failed to upload image to S3, using fallback local preview');
        const reader = new FileReader();
        reader.onloadend = () => {
          if (reader.result) setMapImageUrl(reader.result as string);
        };
        reader.readAsDataURL(file);
      } finally {
        setIsUploading(false);
      }
    }
  };

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    setBannerFileName(selected.name);
    try {
      setIsUploading(true);
      const formData = new FormData();
      formData.append('file', selected);
      formData.append('folder', 'project_banners');
      const response = await api.post('/upload', formData);
      if (response.data?.url) {
        setBannerImage(response.data.url);
        setBannerImageS3Key(response.data.s3Key || '');
        toast.success('Background image uploaded');
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to upload background image');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      await api.put(`/projects/${project._id}`, {
        name,
        code,
        location,
        city,
        state,
        description,
        highlights: highlights.filter(Boolean),
        locationAdvantages: locationAdvantages.filter(a => a.landmark),
        amenities: amenities.filter(Boolean),
        totalAreaSqft,
        area,
        totalPlots,
        basePricePerSqft,
        priceRange,
        bannerImage,
        bannerImageS3Key,
        mapImageUrl,
        brochureUrl,
        videoUrl,
        contactPhone,
        contactEmail,
        legalInfo: { reraNumber, titleType, approvalAuthority },
        gallery,
        surveyNumber,
        village,
        latitude,
        longitude,
        googleMapsUrl,
        mapEmbedUrl,
        paymentQrUrl,
        bankDetails,
        mapImageS3Key,
        isDholera
      });

      clearEditDraft();
      toast.success('Project updated successfully!');
      onSuccess();
      onClose();
    } catch (error) {
      console.error(error);
      toast.error('Failed to update project');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white border border-[#0B4F3C]/20 w-full max-w-2xl rounded-3xl p-6 space-y-6 shadow-2xl overflow-y-auto max-h-[90vh]">
        <div className="flex items-center justify-between border-b border-[#0B4F3C]/15 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#0B4F3C] text-white flex items-center justify-center shadow-md">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-serif font-bold text-[#171A18]">Edit Real Estate Project</h3>
              <p className="text-xs text-[#171A18]/70">Modify project settings & blueprint map</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl bg-[#E8F0EC] text-[#0B4F3C] hover:bg-[#0B4F3C] hover:text-white transition-colors cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {draftRestored && onDiscardDraft && <DraftNotice onDiscard={onDiscardDraft} />}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="text-[#171A18]/70 font-semibold">Project Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full mt-1 bg-[#FDFCF0] border border-[#0B4F3C]/20 rounded-xl px-3 py-2 text-[#171A18] font-bold focus:outline-none focus:border-[#0B4F3C]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[#171A18]/70 font-semibold">Project Code</label>
              <input
                type="text"
                required
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full mt-1 bg-[#FDFCF0] border border-[#0B4F3C]/20 rounded-xl px-3 py-2 text-[#171A18] font-bold focus:outline-none focus:border-[#0B4F3C]"
              />
            </div>
            <div>
              <label className="text-[#171A18]/70 font-semibold">Location</label>
              <input
                type="text"
                required
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full mt-1 bg-[#FDFCF0] border border-[#0B4F3C]/20 rounded-xl px-3 py-2 text-[#171A18] font-bold focus:outline-none focus:border-[#0B4F3C]"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <AreaUnitField
              sqft={totalAreaSqft}
              onSqftChange={(next) => setTotalAreaSqft(next)}
              label="Total area"
              required
            />
            <div>
              <label className="text-[#171A18]/70 font-semibold">Total Plots</label>
              <input
                type="number"
                required
                value={totalPlots}
                onChange={(e) => setTotalPlots(Number(e.target.value))}
                className="w-full mt-1 bg-[#FDFCF0] border border-[#0B4F3C]/20 rounded-xl px-3 py-2 text-[#171A18] font-bold focus:outline-none focus:border-[#0B4F3C]"
              />
            </div>
            <div>
              <label className="text-[#171A18]/70 font-semibold">Rate / Sqft (₹)</label>
              <input
                type="number"
                required
                value={basePricePerSqft}
                onChange={(e) => setBasePricePerSqft(Number(e.target.value))}
                className="w-full mt-1 bg-[#FDFCF0] border border-[#0B4F3C]/20 rounded-xl px-3 py-2 text-[#171A18] font-bold focus:outline-none focus:border-[#0B4F3C]"
              />
            </div>
          </div>

          {/* Project Site Map File Upload Box */}
          <div className="p-4 bg-[#E8F0EC] rounded-xl border border-[#0B4F3C]/20 space-y-3">
            <label className="font-bold text-[#0B4F3C] flex items-center gap-1.5 text-[11px]">
              <UploadCloud className="w-4 h-4 text-[#0B4F3C]" /> Naksha / layout map
            </label>
            
            <div className="border-2 border-dashed border-[#0B4F3C]/20 hover:border-[#0B4F3C] rounded-xl p-4 text-center cursor-pointer transition-colors bg-white">
              <input
                type="file"
                accept="image/*,.pdf"
                onChange={handleFileUpload}
                className="hidden"
                id="edit-project-map-upload"
              />
              <label htmlFor="edit-project-map-upload" className="cursor-pointer flex flex-col items-center">
                <UploadCloud className="w-6 h-6 text-[#0B4F3C] mb-1" />
                <span className="text-xs font-bold text-[#171A18]">
                  {fileName ? `Selected: ${fileName}` : 'Click to Replace Map Blueprint'}
                </span>
              </label>
            </div>

            {mapImageUrl && (
              <div className="relative rounded-lg overflow-hidden border border-[#0B4F3C]/20 h-28 mt-2">
                <img src={mapImageUrl} alt="Preview" className="w-full h-full object-cover" />
              </div>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="text-[#171A18]/70 font-semibold">Project Description</label>
            <textarea rows={2} value={description} onChange={(e) => setDescription(e.target.value)}
              placeholder="Township overview for public listing page…"
              className="w-full mt-1 bg-[#FDFCF0] border border-[#0B4F3C]/20 rounded-xl px-3 py-2 text-[#171A18] font-bold focus:outline-none focus:border-[#0B4F3C] resize-none" />
          </div>

          {/* Area & Price Range */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[#171A18]/70 font-semibold">Area (display)</label>
              <input type="text" placeholder="25 Bigha / 3.2 Acres" value={area} onChange={(e) => setArea(e.target.value)}
                className="w-full mt-1 bg-[#FDFCF0] border border-[#0B4F3C]/20 rounded-xl px-3 py-2 text-[#171A18] font-bold focus:outline-none focus:border-[#0B4F3C]" />
            </div>
            <div>
              <label className="text-[#171A18]/70 font-semibold">Price Range</label>
              <input type="text" placeholder="₹18L – ₹45L" value={priceRange} onChange={(e) => setPriceRange(e.target.value)}
                className="w-full mt-1 bg-[#FDFCF0] border border-[#0B4F3C]/20 rounded-xl px-3 py-2 text-[#171A18] font-bold focus:outline-none focus:border-[#0B4F3C]" />
            </div>
          </div>

          <div className="p-4 bg-[#FDFCF0] rounded-xl border border-[#0B4F3C]/15 space-y-3">
            <label className="font-bold text-[#0B4F3C] text-[11px]">Project background image (hero)</label>
            <div className="border-2 border-dashed border-[#0B4F3C]/20 hover:border-[#0B4F3C] rounded-xl p-4 text-center bg-white">
              <input type="file" accept="image/*" onChange={handleBannerUpload} className="hidden" id="edit-project-banner-upload" />
              <label htmlFor="edit-project-banner-upload" className="cursor-pointer flex flex-col items-center">
                <UploadCloud className="w-5 h-5 text-[#0B4F3C] mb-1" />
                <span className="text-xs font-bold text-[#171A18]">
                  {bannerFileName ? `Selected: ${bannerFileName}` : 'Upload background image'}
                </span>
              </label>
            </div>
            {bannerImage && (
              <img src={bannerImage} alt="Banner" className="w-full h-24 object-cover rounded-lg border border-[#0B4F3C]/15" />
            )}
          </div>

          <div>
            <label className="text-[#171A18]/70 font-semibold">Naksha / Layout Map URL</label>
            <input type="url" placeholder="https://…/naksha.jpg" value={mapImageUrl} onChange={(e) => setMapImageUrl(e.target.value)}
              className="w-full mt-1 bg-[#FDFCF0] border border-[#0B4F3C]/20 rounded-xl px-3 py-2 text-[#171A18] font-bold focus:outline-none focus:border-[#0B4F3C]" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[#171A18]/70 font-semibold">Survey Number</label>
              <input type="text" value={surveyNumber} onChange={(e) => setSurveyNumber(e.target.value)}
                className="w-full mt-1 bg-[#FDFCF0] border border-[#0B4F3C]/20 rounded-xl px-3 py-2 text-[#171A18] font-bold focus:outline-none focus:border-[#0B4F3C]" />
            </div>
            <div>
              <label className="text-[#171A18]/70 font-semibold">Village</label>
              <input type="text" value={village} onChange={(e) => setVillage(e.target.value)}
                className="w-full mt-1 bg-[#FDFCF0] border border-[#0B4F3C]/20 rounded-xl px-3 py-2 text-[#171A18] font-bold focus:outline-none focus:border-[#0B4F3C]" />
            </div>
          </div>
          <LocationMapPicker
            latitude={latitude}
            longitude={longitude}
            onChange={({ latitude: lat, longitude: lng, googleMapsUrl: gUrl, mapEmbedUrl: eUrl }) => {
              setLatitude(lat);
              setLongitude(lng);
              if (gUrl !== undefined) setGoogleMapsUrl(gUrl);
              if (eUrl !== undefined) setMapEmbedUrl(eUrl);
            }}
          />
          <div>
            <label className="text-[#171A18]/70 font-semibold">Google Maps URL (auto from pin)</label>
            <input type="url" value={googleMapsUrl} onChange={(e) => setGoogleMapsUrl(e.target.value)}
              className="w-full mt-1 bg-[#FDFCF0] border border-[#0B4F3C]/20 rounded-xl px-3 py-2 text-[#171A18] font-bold focus:outline-none focus:border-[#0B4F3C]" />
          </div>
          <GalleryUploader items={gallery} onChange={setGallery} folder="project_gallery" label="Project Photo Gallery (S3)" />

          {/* Highlights */}
          <div>
            <label className="text-[#171A18]/70 font-semibold">Key Highlights</label>
            <div className="flex gap-2 mt-1 mb-2">
              <input type="text" placeholder="Add highlight & press Enter" value={highlightInput} onChange={(e) => setHighlightInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && highlightInput.trim()) { setHighlights([...highlights, highlightInput.trim()]); setHighlightInput(''); e.preventDefault(); }}}
                className="flex-1 bg-[#FDFCF0] border border-[#0B4F3C]/20 rounded-xl px-3 py-2 text-[#171A18] font-bold focus:outline-none focus:border-[#0B4F3C]" />
              <button type="button" onClick={() => { if (highlightInput.trim()) { setHighlights([...highlights, highlightInput.trim()]); setHighlightInput(''); }}}
                className="px-3 py-2 bg-[#0B4F3C] text-white rounded-xl cursor-pointer"><Plus className="w-4 h-4" /></button>
            </div>
            {highlights.length > 0 && <div className="flex flex-wrap gap-1.5">{highlights.map((h, i) => (
              <span key={i} className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#E8F0EC] border border-[#0B4F3C]/20 rounded-lg text-xs font-bold text-[#0B4F3C]">
                {h} <button type="button" onClick={() => setHighlights(highlights.filter((_, idx) => idx !== i))} className="text-red-500 cursor-pointer"><X className="w-3 h-3" /></button>
              </span>
            ))}</div>}
          </div>

          {/* Amenities */}
          <div>
            <label className="text-[#171A18]/70 font-semibold">Amenities</label>
            <div className="flex gap-2 mt-1 mb-2">
              <input type="text" placeholder="e.g. 24/7 Security" value={amenityInput} onChange={(e) => setAmenityInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && amenityInput.trim()) { setAmenities([...amenities, amenityInput.trim()]); setAmenityInput(''); e.preventDefault(); }}}
                className="flex-1 bg-[#FDFCF0] border border-[#0B4F3C]/20 rounded-xl px-3 py-2 text-[#171A18] font-bold focus:outline-none focus:border-[#0B4F3C]" />
              <button type="button" onClick={() => { if (amenityInput.trim()) { setAmenities([...amenities, amenityInput.trim()]); setAmenityInput(''); }}}
                className="px-3 py-2 bg-[#0B4F3C] text-white rounded-xl cursor-pointer"><Plus className="w-4 h-4" /></button>
            </div>
            {amenities.length > 0 && <div className="flex flex-wrap gap-1.5">{amenities.map((a, i) => (
              <span key={i} className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#E8F0EC] border border-[#0B4F3C]/20 rounded-lg text-xs font-bold text-[#0B4F3C]">
                {a} <button type="button" onClick={() => setAmenities(amenities.filter((_, idx) => idx !== i))} className="text-red-500 cursor-pointer"><X className="w-3 h-3" /></button>
              </span>
            ))}</div>}
          </div>

          {/* Location Advantages */}
          <div>
            <label className="text-[#171A18]/70 font-semibold">Location Advantages</label>
            <p className="text-[10px] text-[#171A18]/50 mt-0.5 mb-2">e.g. "500 MTR" · "Dholera Sir"</p>
            <div className="flex gap-2 mt-1 mb-2">
              <input type="text" placeholder="Distance" value={locAdvDistance} onChange={(e) => setLocAdvDistance(e.target.value)}
                className="w-28 bg-[#FDFCF0] border border-[#0B4F3C]/20 rounded-xl px-3 py-2 text-[#171A18] font-bold focus:outline-none focus:border-[#0B4F3C]" />
              <input type="text" placeholder="Landmark name" value={locAdvLandmark} onChange={(e) => setLocAdvLandmark(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && locAdvLandmark.trim()) { setLocationAdvantages([...locationAdvantages, { distance: locAdvDistance.trim(), landmark: locAdvLandmark.trim() }]); setLocAdvDistance(''); setLocAdvLandmark(''); e.preventDefault(); }}}
                className="flex-1 bg-[#FDFCF0] border border-[#0B4F3C]/20 rounded-xl px-3 py-2 text-[#171A18] font-bold focus:outline-none focus:border-[#0B4F3C]" />
              <button type="button" onClick={() => { if (locAdvLandmark.trim()) { setLocationAdvantages([...locationAdvantages, { distance: locAdvDistance.trim(), landmark: locAdvLandmark.trim() }]); setLocAdvDistance(''); setLocAdvLandmark(''); }}}
                className="px-3 py-2 bg-[#0B4F3C] text-white rounded-xl cursor-pointer"><Plus className="w-4 h-4" /></button>
            </div>
            {locationAdvantages.length > 0 && (
              <div className="space-y-1.5">
                {locationAdvantages.map((adv, i) => (
                  <div key={i} className="flex items-center gap-2 px-3 py-1.5 bg-[#E8F0EC] border border-[#0B4F3C]/20 rounded-lg text-xs">
                    <span className="font-extrabold text-[#0B4F3C] w-20 shrink-0">{adv.distance}</span>
                    <span className="flex-1 font-semibold text-[#171A18]">{adv.landmark}</span>
                    <button type="button" onClick={() => setLocationAdvantages(locationAdvantages.filter((_, idx) => idx !== i))} className="text-red-500 cursor-pointer"><X className="w-3 h-3" /></button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Contact Info */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[#171A18]/70 font-semibold">Contact Phone</label>
              <input type="tel" placeholder="+91 98765 43210" value={contactPhone} onChange={(e) => setContactPhone(e.target.value)}
                className="w-full mt-1 bg-[#FDFCF0] border border-[#0B4F3C]/20 rounded-xl px-3 py-2 text-[#171A18] font-bold focus:outline-none focus:border-[#0B4F3C]" />
            </div>
            <div>
              <label className="text-[#171A18]/70 font-semibold">Contact Email</label>
              <input type="email" placeholder="project@houseandsky.com" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)}
                className="w-full mt-1 bg-[#FDFCF0] border border-[#0B4F3C]/20 rounded-xl px-3 py-2 text-[#171A18] font-bold focus:outline-none focus:border-[#0B4F3C]" />
            </div>
          </div>

          {/* Brochure URL */}
          <div>
            <label className="text-[#171A18]/70 font-semibold">Brochure URL (PDF)</label>
            <input type="url" placeholder="https://…/brochure.pdf" value={brochureUrl} onChange={(e) => setBrochureUrl(e.target.value)}
              className="w-full mt-1 bg-[#FDFCF0] border border-[#0B4F3C]/20 rounded-xl px-3 py-2 text-[#171A18] font-bold focus:outline-none focus:border-[#0B4F3C]" />
          </div>
          <div>
            <label className="text-[#171A18]/70 font-semibold">Payment QR URL (optional)</label>
            <input type="url" placeholder="https://…/qr.png" value={paymentQrUrl} onChange={(e) => setPaymentQrUrl(e.target.value)}
              className="w-full mt-1 bg-[#FDFCF0] border border-[#0B4F3C]/20 rounded-xl px-3 py-2 text-[#171A18] font-bold focus:outline-none focus:border-[#0B4F3C]" />
          </div>
          <div>
            <label className="text-[#171A18]/70 font-semibold">Bank details for this project (optional)</label>
            <textarea value={bankDetails} onChange={(e) => setBankDetails(e.target.value)} rows={2}
              placeholder="Account name, number, IFSC"
              className="w-full mt-1 bg-[#FDFCF0] border border-[#0B4F3C]/20 rounded-xl px-3 py-2 text-[#171A18] font-bold focus:outline-none focus:border-[#0B4F3C]" />
          </div>

          {/* Special Dholera SIR Toggle */}
          <div className="flex items-center justify-between p-3.5 bg-amber-50 border border-amber-300 rounded-xl">
            <div>
              <p className="font-bold text-amber-900 text-xs flex items-center gap-1.5">
                <Star className="w-3.5 h-3.5 fill-amber-600 text-amber-600" />
                Special Dholera SIR Project
              </p>
              <p className="text-[10px] text-amber-700 mt-0.5">Mark as part of Dholera Special Investment Region. It will appear under the dedicated Dholera section on the website.</p>
            </div>
            <button
              type="button"
              onClick={() => setIsDholera(!isDholera)}
              className={`relative w-11 h-6 rounded-full transition-colors duration-200 cursor-pointer flex-shrink-0 ml-4 ${
                isDholera ? 'bg-amber-500' : 'bg-[#171A18]/20'
              }`}
            >
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200 ${
                isDholera ? 'translate-x-5' : 'translate-x-0'
              }`} />
            </button>
          </div>

          {/* Legal Info */}
          <div className="p-3 bg-[#FDFCF0] border border-[#0B4F3C]/15 rounded-xl space-y-2">
            <label className="text-[#171A18]/70 font-bold block text-xs uppercase tracking-wider">Legal &amp; Compliance</label>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-[#171A18]/60 font-semibold block mb-1">RERA Number</label>
                <input type="text" placeholder="RERA/…" value={reraNumber} onChange={(e) => setReraNumber(e.target.value)}
                  className="w-full bg-white border border-[#0B4F3C]/20 rounded-lg px-2.5 py-1.5 text-[#171A18] font-bold focus:outline-none focus:border-[#0B4F3C]" />
              </div>
              <div>
                <label className="text-[#171A18]/60 font-semibold block mb-1">Title Type</label>
                <select value={titleType} onChange={(e) => setTitleType(e.target.value)}
                  className="w-full bg-white border border-[#0B4F3C]/20 rounded-lg px-2.5 py-1.5 text-[#171A18] font-bold focus:outline-none">
                  <option>Freehold</option><option>Leasehold</option><option>NA Plot</option><option>Agricultural</option>
                </select>
              </div>
              <div>
                <label className="text-[#171A18]/60 font-semibold block mb-1">Approved By</label>
                <input type="text" placeholder="DTCP, DMIC…" value={approvalAuthority} onChange={(e) => setApprovalAuthority(e.target.value)}
                  className="w-full bg-white border border-[#0B4F3C]/20 rounded-lg px-2.5 py-1.5 text-[#171A18] font-bold focus:outline-none focus:border-[#0B4F3C]" />
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-[#0B4F3C]/15 flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl bg-[#FDFCF0] border border-[#0B4F3C]/20 font-bold text-xs text-[#171A18]/70 hover:text-[#171A18]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-2.5 rounded-xl bg-[#0B4F3C] hover:bg-[#063B2D] font-bold text-xs text-white shadow-md cursor-pointer border border-[#0B4F3C]"
            >
              {isSubmitting ? 'Updating...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export const EditProjectModal: React.FC<EditProjectModalProps> = (props) => {
  const [session, setSession] = useState(0);
  const draftKey = `hs-admin-project-edit-${props.project._id}`;
  return (
    <EditProjectModalBody
      key={session}
      {...props}
      onDiscardDraft={() => {
        clearDraft(draftKey);
        setSession((n) => n + 1);
      }}
    />
  );
};
