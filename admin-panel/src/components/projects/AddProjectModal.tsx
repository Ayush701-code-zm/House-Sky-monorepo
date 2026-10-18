import React, { useState } from 'react';
import {
  X,
  Building2,
  UploadCloud,
  ScanText,
  Cpu,
  CheckCircle2,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  Trash2,
  Edit,
  Plus,
  Star
} from 'lucide-react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { GalleryUploader } from '../common/GalleryUploader';
import LocationMapPicker from '../common/LocationMapPicker';
import { GalleryImage } from '../../types';

interface AddProjectModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

interface ExtractedPlot {
  plotNo: string;
  status: string;
  sellableSqYrd?: number;
  carpetSqYrd?: number;
  dimensions?: string;
  sizeSqft?: number;
  plc12mtr?: number;
  plc9mtr?: number;
  plcCorner?: number;
  plcParkFacing?: number;
  totalPlc?: number;
  discountedPlc?: number;
  otmc?: number;
  gstOnOtherCharges?: number;
  totalCost?: number;
  confidence?: number;
  polygonPoints?: { x: number; y: number }[];
  coordinates?: { x: number; y: number; width: number; height: number };
}

export const AddProjectModal: React.FC<AddProjectModalProps> = ({ onClose, onSuccess }) => {
  const toast = useToast();

  // Wizard Step: 1 = Form & File Upload, 2 = AI Vision Scanning, 3 = Review Extracted Plots
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Form Fields
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [location, setLocation] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('Haryana');
  const [description, setDescription] = useState('');
  const [totalAreaSqft, setTotalAreaSqft] = useState(250000);
  const [area, setArea] = useState(''); // e.g. "25 Bigha" or "3.2 Acres"
  const [totalPlots, setTotalPlots] = useState(20);
  const [basePricePerSqft, setBasePricePerSqft] = useState(4500);
  const [priceRange, setPriceRange] = useState(''); // e.g. "₹18L – ₹45L"
  const [highlights, setHighlights] = useState<string[]>([]);
  const [amenities, setAmenities] = useState<string[]>([]);
  const [locationAdvantages, setLocationAdvantages] = useState<{distance: string; landmark: string}[]>([]);
  const [highlightInput, setHighlightInput] = useState('');
  const [amenityInput, setAmenityInput] = useState('');
  const [locAdvDistance, setLocAdvDistance] = useState('');
  const [locAdvLandmark, setLocAdvLandmark] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [brochureUrl, setBrochureUrl] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [reraNumber, setReraNumber] = useState('');
  const [titleType, setTitleType] = useState('Freehold');
  const [approvalAuthority, setApprovalAuthority] = useState('');
  const [mapImageUrl, setMapImageUrl] = useState('');
  const [mapImageS3Key, setMapImageS3Key] = useState('');
  const [bannerImage, setBannerImage] = useState('');
  const [bannerImageS3Key, setBannerImageS3Key] = useState('');
  const [bannerFileName, setBannerFileName] = useState('');
  const [gallery, setGallery] = useState<GalleryImage[]>([]);
  const [surveyNumber, setSurveyNumber] = useState('');
  const [village, setVillage] = useState('');
  const [googleMapsUrl, setGoogleMapsUrl] = useState('');
  const [mapEmbedUrl, setMapEmbedUrl] = useState('');
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [logoImage, setLogoImage] = useState('');
  const [isDholera, setIsDholera] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // AI OCR States
  const [isUploading, setIsUploading] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scanStatusMsg, setScanStatusMsg] = useState('');
  const [extractedPlots, setExtractedPlots] = useState<ExtractedPlot[]>([]);
  const [ocrMapId, setOcrMapId] = useState('');
  const [ocrWarnings, setOcrWarnings] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingIdx, setEditingIdx] = useState<number | null>(null);

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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setFileName(selectedFile.name);
      let localUrl = '';
      if (selectedFile.type.startsWith('image/')) {
        localUrl = URL.createObjectURL(selectedFile);
        setPreviewUrl(localUrl);
      }

      try {
        setIsUploading(true);
        const formData = new FormData();
        formData.append('file', selectedFile);
        formData.append('folder', 'project_maps');

        const response = await api.post('/upload', formData);

        if (response.data?.url) {
          setMapImageUrl(response.data.url);
          setMapImageS3Key(response.data.s3Key || '');
          toast.success('Map uploaded! Auto-analyzing Naksha with Gemini 2.5 Pro...');
          runAiOcrAnalysis(selectedFile, response.data.url);
        } else {
          runAiOcrAnalysis(selectedFile, localUrl);
        }
      } catch (err) {
        console.error('S3 Upload Error:', err);
        toast.error('Using local preview for AI OCR');
        runAiOcrAnalysis(selectedFile, localUrl);
      } finally {
        setIsUploading(false);
      }
    }
  };

  const runAiOcrAnalysis = async (fileToAnalyze = file, imageUrlOverride = mapImageUrl) => {
    const targetFile = fileToAnalyze || file;
    const targetUrl = imageUrlOverride || mapImageUrl;

    if (!targetFile && !targetUrl) {
      toast.error('Please upload a Naksha layout blueprint file first');
      return;
    }

    setStep(2);
    setIsScanning(true);

    const messages = [
      'Uploading Naksha map to Gemini 2.5 Pro AI Engine...',
      'Running Google Gemini 2.5 Pro Vision layout extraction...',
      'Scanning 3x3 tile grid for plot numbers & boundaries...',
      'Extracting dimensions, sqft, rates & SOLD stamps...',
      'Building plot vector overlay layout...'
    ];
    let i = 0;
    setScanStatusMsg(messages[0]);
    const interval = setInterval(() => {
      i++;
      if (i < messages.length) setScanStatusMsg(messages[i]);
    }, 1500);

    try {
      const formData = new FormData();
      if (targetFile) formData.append('file', targetFile);
      formData.append('mapName', name ? `${name} Naksha` : 'Project Masterplan Layout');

      const response = await api.post('/ocr/analyze', formData);

      clearInterval(interval);
      setIsScanning(false);

      const plots: ExtractedPlot[] = response.data?.extractedPlots || [];
      const meta = response.data?.projectMeta || {};
      const warnings: string[] = response.data?.ocrWarnings || [];
      setExtractedPlots(plots);
      setOcrMapId(response.data?.mapId || '');
      setOcrWarnings(warnings);
      if (plots.length > 0) {
        setTotalPlots(plots.length);
      }
      if (response.data?.imageUrl) setMapImageUrl(response.data.imageUrl);
      if (response.data?.imageS3Key) setMapImageS3Key(response.data.imageS3Key);
      if (meta.location && !location) setLocation(meta.location);
      if (Array.isArray(meta.highlights) && meta.highlights.length) setHighlights(meta.highlights);
      if (Array.isArray(meta.amenities) && meta.amenities.length) setAmenities(meta.amenities);
      if (Array.isArray(meta.locationAdvantages) && meta.locationAdvantages.length) setLocationAdvantages(meta.locationAdvantages);
      if (meta.surveyNumber) setSurveyNumber(meta.surveyNumber);
      if (meta.village) setVillage(meta.village);
      setStep(3);
      if (warnings.length) {
        toast.error(warnings[0]);
      } else {
        toast.success(`AI extracted ${plots.length} plots from the naksha. Review before saving.`);
      }
    } catch (err: any) {
      clearInterval(interval);
      setIsScanning(false);
      setStep(1);
      toast.error(err?.response?.data?.message || 'AI OCR extraction failed. You can proceed with standard creation.');
    }
  };

  const handlePlotFieldChange = (index: number, field: keyof ExtractedPlot, value: any) => {
    const updated = [...extractedPlots];
    updated[index] = { ...updated[index], [field]: value };
    setExtractedPlots(updated);
  };

  const handleAddPlot = () => {
    const newNo = `Plot-${101 + extractedPlots.length}`;
    setExtractedPlots([
      ...extractedPlots,
      {
        plotNo: newNo,
        status: 'AVAILABLE',
        sellableSqYrd: 0,
        sizeSqft: 0,
        dimensions: '',
        confidence: 1.0
      }
    ]);
  };

  const handleRemovePlot = (index: number) => {
    setExtractedPlots(extractedPlots.filter((_, idx) => idx !== index));
  };

  const handleFinalSubmit = async () => {
    if (!name || !code || !location) {
      toast.error('Please fill in Project Name, Code, and Location');
      return;
    }
    if (latitude == null || longitude == null) {
      toast.error('Please pin the exact project location on the map');
      return;
    }

    try {
      setIsSubmitting(true);
      await api.post('/projects', {
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
        totalPlots: extractedPlots.length > 0 ? extractedPlots.length : totalPlots,
        basePricePerSqft,
        priceRange,
        bannerImage,
        bannerImageS3Key,
        mapImageUrl: mapImageUrl,
        mapImageS3Key,
        latitude,
        longitude,
        googleMapsUrl,
        mapEmbedUrl,
        brochureUrl,
        videoUrl,
        contactPhone,
        contactEmail,
        legalInfo: { reraNumber, titleType, approvalAuthority },
        gallery,
        surveyNumber,
        village,
        logoImage,
        status: 'ACTIVE',
        isDholera,
        ocrPlots: extractedPlots.length > 0 ? extractedPlots : undefined,
        mapId: ocrMapId || undefined
      });

      toast.success(
        extractedPlots.length > 0
          ? `Project created with ${extractedPlots.length} plots extracted from the naksha.`
          : 'Project created. Upload a naksha next to extract plot inventory.'
      );
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error(error);
      toast.error(error?.response?.data?.message || 'Failed to create project');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white border border-[#0B4F3C]/20 w-full max-w-3xl rounded-3xl p-6 space-y-6 shadow-2xl overflow-y-auto max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-[#0B4F3C]/15 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#0B4F3C] text-white flex items-center justify-center shadow-md">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-serif font-bold text-[#171A18]">Create Real Estate Project</h3>
              <p className="text-xs text-[#171A18]/70">Add new township & extract plot map layout with AI OCR</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl bg-[#E8F0EC] text-[#0B4F3C] hover:bg-[#0B4F3C] hover:text-white transition-colors cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Navigation Pill Indicator */}
        <div className="flex items-center justify-between bg-[#FDFCF0] p-2.5 rounded-2xl border border-[#0B4F3C]/15 text-xs font-bold">
          <div className={`flex items-center gap-2 px-3 py-1 rounded-xl ${step === 1 ? 'bg-[#0B4F3C] text-white shadow-sm' : 'text-[#0B4F3C]'}`}>
            <span>1. Project Details & Naksha Map</span>
          </div>
          <ChevronRight className="w-4 h-4 text-[#0B4F3C]/40" />
          <div className={`flex items-center gap-2 px-3 py-1 rounded-xl ${step === 2 ? 'bg-[#0B4F3C] text-white shadow-sm' : 'text-[#0B4F3C]'}`}>
            <Cpu className="w-3.5 h-3.5" />
            <span>2. AI OCR Scanning</span>
          </div>
          <ChevronRight className="w-4 h-4 text-[#0B4F3C]/40" />
          <div className={`flex items-center gap-2 px-3 py-1 rounded-xl ${step === 3 ? 'bg-[#0B4F3C] text-white shadow-sm' : 'text-[#0B4F3C]'}`}>
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>3. Review Extracted Plots ({extractedPlots.length})</span>
          </div>
        </div>

        {/* STEP 1: Project Details Form & Naksha Upload */}
        {step === 1 && (
          <div className="space-y-4 text-xs">
            <div>
              <label className="text-[#171A18]/70 font-semibold block mb-1">Project Name <span className="text-red-500">*</span></label>
              <input
                type="text"
                required
                placeholder="e.g. Royal Palms Executive City"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-[#FDFCF0] border border-[#0B4F3C]/20 rounded-xl px-3 py-2 text-[#171A18] font-bold focus:outline-none focus:border-[#0B4F3C]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[#171A18]/70 font-semibold block mb-1">Project Code <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  required
                  placeholder="RPE-03"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="w-full bg-[#FDFCF0] border border-[#0B4F3C]/20 rounded-xl px-3 py-2 text-[#171A18] font-bold focus:outline-none focus:border-[#0B4F3C]"
                />
              </div>
              <div>
                <label className="text-[#171A18]/70 font-semibold block mb-1">Location <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  required
                  placeholder="Sector 150, Noida"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full bg-[#FDFCF0] border border-[#0B4F3C]/20 rounded-xl px-3 py-2 text-[#171A18] font-bold focus:outline-none focus:border-[#0B4F3C]"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-[#171A18]/70 font-semibold block mb-1">Total Area (sqft)</label>
                <input
                  type="number"
                  required
                  value={totalAreaSqft}
                  onChange={(e) => setTotalAreaSqft(Number(e.target.value))}
                  className="w-full bg-[#FDFCF0] border border-[#0B4F3C]/20 rounded-xl px-3 py-2 text-[#171A18] font-bold focus:outline-none focus:border-[#0B4F3C]"
                />
              </div>
              <div>
                <label className="text-[#171A18]/70 font-semibold block mb-1">Total Plots</label>
                <input
                  type="number"
                  required
                  value={totalPlots}
                  onChange={(e) => setTotalPlots(Number(e.target.value))}
                  className="w-full bg-[#FDFCF0] border border-[#0B4F3C]/20 rounded-xl px-3 py-2 text-[#171A18] font-bold focus:outline-none focus:border-[#0B4F3C]"
                />
              </div>
              <div>
                <label className="text-[#171A18]/70 font-semibold block mb-1">Rate / Sqft (₹)</label>
                <input
                  type="number"
                  required
                  value={basePricePerSqft}
                  onChange={(e) => setBasePricePerSqft(Number(e.target.value))}
                  className="w-full bg-[#FDFCF0] border border-[#0B4F3C]/20 rounded-xl px-3 py-2 text-[#171A18] font-bold focus:outline-none focus:border-[#0B4F3C]"
                />
              </div>
            </div>

            {/* City & State */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[#171A18]/70 font-semibold block mb-1">City</label>
                <input type="text" placeholder="e.g. Gurgaon" value={city} onChange={(e) => setCity(e.target.value)}
                  className="w-full bg-[#FDFCF0] border border-[#0B4F3C]/20 rounded-xl px-3 py-2 text-[#171A18] font-bold focus:outline-none focus:border-[#0B4F3C]" />
              </div>
              <div>
                <label className="text-[#171A18]/70 font-semibold block mb-1">State</label>
                <input type="text" placeholder="e.g. Haryana" value={state} onChange={(e) => setState(e.target.value)}
                  className="w-full bg-[#FDFCF0] border border-[#0B4F3C]/20 rounded-xl px-3 py-2 text-[#171A18] font-bold focus:outline-none focus:border-[#0B4F3C]" />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="text-[#171A18]/70 font-semibold block mb-1">Project Description</label>
              <textarea rows={2} placeholder="Brief township description shown on public page…" value={description} onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-[#FDFCF0] border border-[#0B4F3C]/20 rounded-xl px-3 py-2 text-[#171A18] font-bold focus:outline-none focus:border-[#0B4F3C] resize-none" />
            </div>

            {/* Area & Price Range */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[#171A18]/70 font-semibold block mb-1">Area (display)</label>
                <input type="text" placeholder="e.g. 25 Bigha / 3.2 Acres" value={area} onChange={(e) => setArea(e.target.value)}
                  className="w-full bg-[#FDFCF0] border border-[#0B4F3C]/20 rounded-xl px-3 py-2 text-[#171A18] font-bold focus:outline-none focus:border-[#0B4F3C]" />
              </div>
              <div>
                <label className="text-[#171A18]/70 font-semibold block mb-1">Price Range (display)</label>
                <input type="text" placeholder="e.g. ₹18L – ₹45L" value={priceRange} onChange={(e) => setPriceRange(e.target.value)}
                  className="w-full bg-[#FDFCF0] border border-[#0B4F3C]/20 rounded-xl px-3 py-2 text-[#171A18] font-bold focus:outline-none focus:border-[#0B4F3C]" />
              </div>
            </div>

            {/* Highlights */}
            <div>
              <label className="text-[#171A18]/70 font-semibold block mb-1">Key Highlights</label>
              <div className="flex gap-2 mb-2">
                <input type="text" placeholder="Add highlight & press Enter" value={highlightInput} onChange={(e) => setHighlightInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && highlightInput.trim()) { setHighlights([...highlights, highlightInput.trim()]); setHighlightInput(''); e.preventDefault(); }}}
                  className="flex-1 bg-[#FDFCF0] border border-[#0B4F3C]/20 rounded-xl px-3 py-2 text-[#171A18] font-bold focus:outline-none focus:border-[#0B4F3C]" />
                <button type="button" onClick={() => { if (highlightInput.trim()) { setHighlights([...highlights, highlightInput.trim()]); setHighlightInput(''); }}}
                  className="px-3 py-2 bg-[#0B4F3C] text-white rounded-xl font-bold cursor-pointer"><Plus className="w-4 h-4" /></button>
              </div>
              {highlights.length > 0 && <div className="flex flex-wrap gap-1.5">{highlights.map((h, i) => (
                <span key={i} className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#E8F0EC] border border-[#0B4F3C]/20 rounded-lg text-xs font-bold text-[#0B4F3C]">
                  {h} <button type="button" onClick={() => setHighlights(highlights.filter((_, idx) => idx !== i))} className="text-red-500 cursor-pointer"><X className="w-3 h-3" /></button>
                </span>
              ))}</div>}
            </div>

            {/* Amenities */}
            <div>
              <label className="text-[#171A18]/70 font-semibold block mb-1">Amenities</label>
              <div className="flex gap-2 mb-2">
                <input type="text" placeholder="e.g. 24/7 Security, Wide Roads" value={amenityInput} onChange={(e) => setAmenityInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && amenityInput.trim()) { setAmenities([...amenities, amenityInput.trim()]); setAmenityInput(''); e.preventDefault(); }}}
                  className="flex-1 bg-[#FDFCF0] border border-[#0B4F3C]/20 rounded-xl px-3 py-2 text-[#171A18] font-bold focus:outline-none focus:border-[#0B4F3C]" />
                <button type="button" onClick={() => { if (amenityInput.trim()) { setAmenities([...amenities, amenityInput.trim()]); setAmenityInput(''); }}}
                  className="px-3 py-2 bg-[#0B4F3C] text-white rounded-xl font-bold cursor-pointer"><Plus className="w-4 h-4" /></button>
              </div>
              {amenities.length > 0 && <div className="flex flex-wrap gap-1.5">{amenities.map((a, i) => (
                <span key={i} className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#E8F0EC] border border-[#0B4F3C]/20 rounded-lg text-xs font-bold text-[#0B4F3C]">
                  {a} <button type="button" onClick={() => setAmenities(amenities.filter((_, idx) => idx !== i))} className="text-red-500 cursor-pointer"><X className="w-3 h-3" /></button>
                </span>
              ))}</div>}
            </div>

            {/* Location Advantages */}
            <div>
              <label className="text-[#171A18]/70 font-semibold block mb-1">Location Advantages</label>
              <p className="text-[10px] text-[#171A18]/50 mb-2">e.g. "500 MTR" · "Dholera Sir" (shown on detail page)</p>
              <div className="flex gap-2 mb-2">
                <input type="text" placeholder="Distance (e.g. 500 MTR)" value={locAdvDistance} onChange={(e) => setLocAdvDistance(e.target.value)}
                  className="w-28 bg-[#FDFCF0] border border-[#0B4F3C]/20 rounded-xl px-3 py-2 text-[#171A18] font-bold focus:outline-none focus:border-[#0B4F3C]" />
                <input type="text" placeholder="Landmark name" value={locAdvLandmark} onChange={(e) => setLocAdvLandmark(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && locAdvLandmark.trim()) { setLocationAdvantages([...locationAdvantages, { distance: locAdvDistance.trim(), landmark: locAdvLandmark.trim() }]); setLocAdvDistance(''); setLocAdvLandmark(''); e.preventDefault(); }}}
                  className="flex-1 bg-[#FDFCF0] border border-[#0B4F3C]/20 rounded-xl px-3 py-2 text-[#171A18] font-bold focus:outline-none focus:border-[#0B4F3C]" />
                <button type="button" onClick={() => { if (locAdvLandmark.trim()) { setLocationAdvantages([...locationAdvantages, { distance: locAdvDistance.trim(), landmark: locAdvLandmark.trim() }]); setLocAdvDistance(''); setLocAdvLandmark(''); }}}
                  className="px-3 py-2 bg-[#0B4F3C] text-white rounded-xl font-bold cursor-pointer"><Plus className="w-4 h-4" /></button>
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
                <label className="text-[#171A18]/70 font-semibold block mb-1">Project Contact Phone</label>
                <input type="tel" placeholder="+91 98765 43210" value={contactPhone} onChange={(e) => setContactPhone(e.target.value)}
                  className="w-full bg-[#FDFCF0] border border-[#0B4F3C]/20 rounded-xl px-3 py-2 text-[#171A18] font-bold focus:outline-none focus:border-[#0B4F3C]" />
              </div>
              <div>
                <label className="text-[#171A18]/70 font-semibold block mb-1">Project Contact Email</label>
                <input type="email" placeholder="project@houseandsky.com" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)}
                  className="w-full bg-[#FDFCF0] border border-[#0B4F3C]/20 rounded-xl px-3 py-2 text-[#171A18] font-bold focus:outline-none focus:border-[#0B4F3C]" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[#171A18]/70 font-semibold block mb-1">Survey Number</label>
                <input type="text" placeholder="e.g. 177" value={surveyNumber} onChange={(e) => setSurveyNumber(e.target.value)}
                  className="w-full bg-[#FDFCF0] border border-[#0B4F3C]/20 rounded-xl px-3 py-2 text-[#171A18] font-bold focus:outline-none focus:border-[#0B4F3C]" />
              </div>
              <div>
                <label className="text-[#171A18]/70 font-semibold block mb-1">Village</label>
                <input type="text" placeholder="e.g. Nabhoi" value={village} onChange={(e) => setVillage(e.target.value)}
                  className="w-full bg-[#FDFCF0] border border-[#0B4F3C]/20 rounded-xl px-3 py-2 text-[#171A18] font-bold focus:outline-none focus:border-[#0B4F3C]" />
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
              <label className="text-[#171A18]/70 font-semibold block mb-1">Google Maps URL (auto from pin)</label>
              <input type="url" placeholder="Set by map pin, or paste a custom URL" value={googleMapsUrl} onChange={(e) => setGoogleMapsUrl(e.target.value)}
                className="w-full bg-[#FDFCF0] border border-[#0B4F3C]/20 rounded-xl px-3 py-2 text-[#171A18] font-bold focus:outline-none focus:border-[#0B4F3C]" />
            </div>
            <GalleryUploader items={gallery} onChange={setGallery} folder="project_gallery" label="Project Photo Gallery (S3)" />

            {/* Brochure & Video URLs */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[#171A18]/70 font-semibold block mb-1">Brochure URL (PDF)</label>
                <input type="url" placeholder="https://…/brochure.pdf" value={brochureUrl} onChange={(e) => setBrochureUrl(e.target.value)}
                  className="w-full bg-[#FDFCF0] border border-[#0B4F3C]/20 rounded-xl px-3 py-2 text-[#171A18] font-bold focus:outline-none focus:border-[#0B4F3C]" />
              </div>
              <div>
                <label className="text-[#171A18]/70 font-semibold block mb-1">Promo Video URL</label>
                <input type="url" placeholder="https://youtube.com/…" value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)}
                  className="w-full bg-[#FDFCF0] border border-[#0B4F3C]/20 rounded-xl px-3 py-2 text-[#171A18] font-bold focus:outline-none focus:border-[#0B4F3C]" />
              </div>
            </div>

            {/* Special Dholera SIR Toggle */}
            <div className="flex items-center justify-between p-3.5 bg-amber-50 border border-amber-300 rounded-xl">
              <div>
                <p className="font-bold text-amber-900 text-xs flex items-center gap-1.5">
                  <Star className="w-3.5 h-3.5 fill-amber-600 text-amber-600" />
                  Special Dholera SIR Project
                </p>
                <p className="text-[10px] text-amber-700 mt-0.5">Mark this project as part of the Dholera Special Investment Region. It will appear under the dedicated Dholera section in the website navigation.</p>
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
                    <option>Freehold</option>
                    <option>Leasehold</option>
                    <option>NA Plot</option>
                    <option>Agricultural</option>
                  </select>
                </div>
                <div>
                  <label className="text-[#171A18]/60 font-semibold block mb-1">Approved By</label>
                  <input type="text" placeholder="DTCP, DMIC…" value={approvalAuthority} onChange={(e) => setApprovalAuthority(e.target.value)}
                    className="w-full bg-white border border-[#0B4F3C]/20 rounded-lg px-2.5 py-1.5 text-[#171A18] font-bold focus:outline-none focus:border-[#0B4F3C]" />
                </div>
              </div>
            </div>

            <div className="p-4 bg-[#FDFCF0] rounded-2xl border border-[#0B4F3C]/15 space-y-3">
              <label className="font-bold text-[#0B4F3C] flex items-center gap-1.5 text-xs">
                <UploadCloud className="w-4 h-4 text-[#0B4F3C]" /> Project background image (hero)
              </label>
              <div className="border-2 border-dashed border-[#0B4F3C]/20 hover:border-[#0B4F3C] rounded-xl p-4 text-center bg-white">
                <input type="file" accept="image/*" onChange={handleBannerUpload} className="hidden" id="add-project-banner-upload" />
                <label htmlFor="add-project-banner-upload" className="cursor-pointer flex flex-col items-center">
                  <UploadCloud className="w-6 h-6 text-[#0B4F3C] mb-1" />
                  <span className="text-xs font-bold text-[#171A18]">
                    {bannerFileName ? `Selected: ${bannerFileName}` : 'Upload background image'}
                  </span>
                  <span className="text-[10px] text-[#171A18]/70 mt-0.5">This is the hero photo. Naksha is uploaded separately below.</span>
                </label>
              </div>
              {bannerImage ? (
                <img src={bannerImage} alt="Background preview" className="w-full h-24 object-cover rounded-lg border border-[#0B4F3C]/15" />
              ) : null}
            </div>

            {/* Project Site Naksha Layout Upload Box */}
            <div className="p-4 bg-[#E8F0EC] rounded-2xl border border-[#0B4F3C]/20 space-y-3">
              <div className="flex items-center justify-between">
                <label className="font-bold text-[#0B4F3C] flex items-center gap-1.5 text-xs">
                  <UploadCloud className="w-4 h-4 text-[#0B4F3C]" /> Site Naksha Layout Blueprint & AI OCR
                </label>
                <span className="text-[10px] bg-[#0B4F3C] text-white px-2 py-0.5 rounded-full font-bold">
                  ✨ Gemini Vision OCR
                </span>
              </div>

              {/* Upload Zone */}
              <div className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all bg-white ${isUploading ? 'border-[#0B4F3C] bg-[#E8F0EC]/50' : 'border-[#0B4F3C]/20 hover:border-[#0B4F3C]'}`}>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="project-map-upload"
                  disabled={isUploading}
                />
                <label htmlFor="project-map-upload" className={`flex flex-col items-center gap-1 ${isUploading ? 'cursor-wait' : 'cursor-pointer'}`}>
                  {isUploading ? (
                    <>
                      <div className="w-6 h-6 border-2 border-[#0B4F3C] border-t-transparent rounded-full animate-spin mb-1" />
                      <span className="text-xs font-bold text-[#0B4F3C]">Uploading Naksha layout...</span>
                    </>
                  ) : (
                    <>
                      <UploadCloud className="w-7 h-7 text-[#0B4F3C] mb-1" />
                      <span className="text-xs font-bold text-[#171A18]">
                        {fileName ? `✅ ${fileName}` : 'Click to Upload Site Naksha Map (PNG, JPG)'}
                      </span>
                      <span className="text-[10px] text-[#171A18]/70 mt-0.5">Upload masterplan JPG/PNG to run AI plot boundary & size extraction</span>
                    </>
                  )}
                </label>
              </div>

              {/* Image Preview & Run AI OCR Trigger Button */}
              {previewUrl || mapImageUrl ? (
                <div className="space-y-2 pt-2 border-t border-[#0B4F3C]/15">
                  <div className="relative rounded-xl overflow-hidden border-2 border-[#0B4F3C]/20 max-h-40">
                    <img src={previewUrl || mapImageUrl} alt="Naksha Preview" className="w-full h-36 object-contain bg-slate-900" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <div className="absolute bottom-2 left-2 flex items-center gap-2">
                      <span className="bg-emerald-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full">
                        ✅ Naksha Map Loaded
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => runAiOcrAnalysis()}
                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#0B4F3C] to-emerald-700 hover:from-[#063B2D] hover:to-emerald-800 text-white font-bold text-xs shadow-md flex items-center justify-center gap-2 cursor-pointer border border-emerald-500/30"
                  >
                    <Sparkles className="w-4 h-4 text-amber-300" /> Run AI Naksha OCR Plot Extraction
                  </button>
                </div>
              ) : null}
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
                type="button"
                onClick={handleFinalSubmit}
                disabled={isSubmitting || !name || !code || !location}
                className="flex-1 py-2.5 rounded-xl bg-[#0B4F3C] hover:bg-[#063B2D] font-bold text-xs text-white shadow-md cursor-pointer border border-[#0B4F3C] disabled:opacity-40"
              >
                {isSubmitting ? 'Creating...' : 'Create Project Directly'}
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: AI Vision Scanning Animation */}
        {step === 2 && (
          <div className="p-12 flex flex-col items-center justify-center gap-6 min-h-[320px]">
            <div className="relative w-20 h-20">
              <div className="w-20 h-20 rounded-3xl bg-[#0B4F3C]/10 flex items-center justify-center">
                <Cpu className="w-10 h-10 text-[#0B4F3C]" />
              </div>
              <div className="absolute inset-0 rounded-3xl border-2 border-[#0B4F3C]/40 animate-ping" />
            </div>

            <div className="text-center space-y-2">
              <h4 className="text-base font-bold text-[#171A18]">Gemini Vision AI is analyzing Naksha...</h4>
              <p className="text-xs text-[#0B4F3C] font-semibold min-h-[1.2rem]">{scanStatusMsg}</p>
            </div>
          </div>
        )}

        {/* STEP 3: Review Extracted Plots Table & Confirmation */}
        {step === 3 && (
          <div className="space-y-4 text-xs">
            {ocrWarnings.length > 0 && (
              <div className="p-3 rounded-2xl border border-amber-300 bg-amber-50 text-amber-900 text-[11px] font-semibold space-y-1">
                {ocrWarnings.map((warning) => (
                  <p key={warning}>{warning}</p>
                ))}
              </div>
            )}
            <div className="flex items-center justify-between bg-[#E8F0EC] p-3 rounded-2xl border border-[#0B4F3C]/20">
              <div>
                <p className="font-bold text-[#0B4F3C] text-sm flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-[#0B4F3C]" /> Extracted {extractedPlots.length} Plots from Naksha
                </p>
                <p className="text-[11px] text-[#171A18]/70 mt-0.5">Review, edit numbers or sizes before synchronizing with Plot Inventory Canvas</p>
              </div>

              <button
                type="button"
                onClick={handleAddPlot}
                className="px-3 py-1.5 rounded-xl bg-[#0B4F3C] text-white font-bold text-xs flex items-center gap-1 cursor-pointer shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" /> Add Plot
              </button>
            </div>

            {/* Extracted Plots Table */}
            <div className="border border-[#0B4F3C]/20 rounded-2xl overflow-hidden max-h-72 overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#E8F0EC] text-[#0B4F3C] text-[10px] uppercase font-bold border-b border-[#0B4F3C]/15 sticky top-0 bg-white z-10">
                  <tr>
                    <th className="p-2.5">#</th>
                    <th className="p-2.5">Plot No</th>
                    <th className="p-2.5">Status</th>
                    <th className="p-2.5">Sq Yrd</th>
                    <th className="p-2.5">Dimensions</th>
                    <th className="p-2.5">Total Cost (₹)</th>
                    <th className="p-2.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#0B4F3C]/10">
                  {extractedPlots.map((p, idx) => (
                    <tr key={idx} className="hover:bg-[#E8F0EC]/30">
                      <td className="p-2.5 font-mono text-[#171A18]/50">{idx + 1}</td>
                      <td className="p-2.5 font-bold text-[#0B4F3C]">
                        <input
                          type="text"
                          value={p.plotNo}
                          onChange={(e) => handlePlotFieldChange(idx, 'plotNo', e.target.value)}
                          className="bg-white border border-[#0B4F3C]/20 rounded px-2 py-0.5 font-bold font-mono text-xs w-24 focus:outline-none focus:border-[#0B4F3C]"
                        />
                      </td>
                      <td className="p-2.5">
                        <select
                          value={p.status || 'AVAILABLE'}
                          onChange={(e) => handlePlotFieldChange(idx, 'status', e.target.value)}
                          className="bg-white border border-[#0B4F3C]/20 rounded px-2 py-0.5 font-bold text-[10px] focus:outline-none"
                        >
                          <option value="AVAILABLE">AVAILABLE</option>
                          <option value="BOOKED">BOOKED</option>
                          <option value="PENDING">PENDING</option>
                          <option value="SOLD">SOLD</option>
                        </select>
                      </td>
                      <td className="p-2.5">
                        <input
                          type="number"
                          value={p.sellableSqYrd || 0}
                          onChange={(e) => handlePlotFieldChange(idx, 'sellableSqYrd', Number(e.target.value))}
                          className="bg-white border border-[#0B4F3C]/20 rounded px-2 py-0.5 font-bold text-xs w-20 focus:outline-none"
                        />
                      </td>
                      <td className="p-2.5">
                        <input
                          type="text"
                          value={p.dimensions || ''}
                          onChange={(e) => handlePlotFieldChange(idx, 'dimensions', e.target.value)}
                          placeholder="30x60"
                          className="bg-white border border-[#0B4F3C]/20 rounded px-2 py-0.5 font-mono text-xs w-20 focus:outline-none"
                        />
                      </td>
                      <td className="p-2.5 font-bold text-[#0B4F3C]">
                        <input
                          type="number"
                          value={p.totalCost || 0}
                          onChange={(e) => handlePlotFieldChange(idx, 'totalCost', Number(e.target.value))}
                          className="bg-white border border-[#0B4F3C]/20 rounded px-2 py-0.5 font-bold text-xs w-28 focus:outline-none"
                        />
                      </td>
                      <td className="p-2.5 text-right">
                        <button
                          type="button"
                          onClick={() => handleRemovePlot(idx)}
                          className="p-1 rounded text-red-600 hover:bg-red-50 cursor-pointer"
                          title="Remove Plot"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="pt-4 border-t border-[#0B4F3C]/15 flex items-center gap-3">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="py-2.5 px-4 rounded-xl bg-[#FDFCF0] border border-[#0B4F3C]/20 font-bold text-xs text-[#171A18]/70 hover:text-[#171A18] flex items-center gap-1"
              >
                <ChevronLeft className="w-4 h-4" /> Back to Details
              </button>
              <button
                type="button"
                onClick={handleFinalSubmit}
                disabled={isSubmitting}
                className="flex-1 py-2.5 rounded-xl bg-[#0B4F3C] hover:bg-[#063B2D] font-bold text-xs text-white shadow-md cursor-pointer border border-[#0B4F3C]"
              >
                {isSubmitting ? 'Saving Project & Plots...' : `Confirm & Create Project (${extractedPlots.length} Plots)`}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
