import React, { useState } from 'react';
import { X, Building2, UploadCloud, Plus, Star } from 'lucide-react';
import api from '../../services/api';
import { GalleryImage, Project } from '../../types';
import { useToast } from '../../context/ToastContext';
import { GalleryUploader } from '../common/GalleryUploader';
import LocationMapPicker from '../common/LocationMapPicker';

interface EditProjectModalProps {
  project: Project;
  onClose: () => void;
  onSuccess: () => void;
}

export const EditProjectModal: React.FC<EditProjectModalProps> = ({ project, onClose, onSuccess }) => {
  const toast = useToast();
  const [name, setName] = useState(project.name);
  const [code, setCode] = useState(project.code);
  const [location, setLocation] = useState(project.location);
  const [city, setCity] = useState((project as any).city || '');
  const [state, setState] = useState((project as any).state || 'Haryana');
  const [description, setDescription] = useState((project as any).description || '');
  const [totalAreaSqft, setTotalAreaSqft] = useState(project.totalAreaSqft || 250000);
  const [area, setArea] = useState((project as any).area || '');
  const [totalPlots, setTotalPlots] = useState(project.totalPlots);
  const [basePricePerSqft, setBasePricePerSqft] = useState(project.basePricePerSqft);
  const [priceRange, setPriceRange] = useState((project as any).priceRange || '');
  const [highlights, setHighlights] = useState<string[]>((project as any).highlights || []);
  const [amenities, setAmenities] = useState<string[]>((project as any).amenities || []);
  const [locationAdvantages, setLocationAdvantages] = useState<{distance: string; landmark: string}[]>((project as any).locationAdvantages || []);
  const [highlightInput, setHighlightInput] = useState('');
  const [amenityInput, setAmenityInput] = useState('');
  const [locAdvDistance, setLocAdvDistance] = useState('');
  const [locAdvLandmark, setLocAdvLandmark] = useState('');
  const [contactPhone, setContactPhone] = useState((project as any).contactPhone || '');
  const [contactEmail, setContactEmail] = useState((project as any).contactEmail || '');
  const [brochureUrl, setBrochureUrl] = useState((project as any).brochureUrl || '');
  const [videoUrl, setVideoUrl] = useState((project as any).videoUrl || '');
  const [reraNumber, setReraNumber] = useState((project as any).legalInfo?.reraNumber || '');
  const [titleType, setTitleType] = useState((project as any).legalInfo?.titleType || 'Freehold');
  const [approvalAuthority, setApprovalAuthority] = useState((project as any).legalInfo?.approvalAuthority || '');
  const [mapImageUrl, setMapImageUrl] = useState((project as any).mapImageUrl || '');
  const [mapImageS3Key, setMapImageS3Key] = useState((project as any).mapImageS3Key || '');
  const [bannerImage, setBannerImage] = useState(project.bannerImage && project.bannerImage !== (project as any).mapImageUrl ? project.bannerImage : '');
  const [bannerImageS3Key, setBannerImageS3Key] = useState((project as any).bannerImageS3Key || '');
  const [bannerFileName, setBannerFileName] = useState('');
  const [gallery, setGallery] = useState<GalleryImage[]>(project.gallery || []);
  const [surveyNumber, setSurveyNumber] = useState(project.surveyNumber || '');
  const [village, setVillage] = useState(project.village || '');
  const [googleMapsUrl, setGoogleMapsUrl] = useState(project.googleMapsUrl || '');
  const [mapEmbedUrl, setMapEmbedUrl] = useState(project.mapEmbedUrl || '');
  const [latitude, setLatitude] = useState<number | null>(project.latitude ?? null);
  const [longitude, setLongitude] = useState<number | null>(project.longitude ?? null);
  const [fileName, setFileName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDholera, setIsDholera] = useState(project.isDholera || false);

  const [isUploading, setIsUploading] = useState(false);

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
        mapImageS3Key,
        isDholera
      });

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
            <div>
              <label className="text-[#171A18]/70 font-semibold">Total Area (sqft)</label>
              <input
                type="number"
                required
                value={totalAreaSqft}
                onChange={(e) => setTotalAreaSqft(Number(e.target.value))}
                className="w-full mt-1 bg-[#FDFCF0] border border-[#0B4F3C]/20 rounded-xl px-3 py-2 text-[#171A18] font-bold focus:outline-none focus:border-[#0B4F3C]"
              />
            </div>
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
