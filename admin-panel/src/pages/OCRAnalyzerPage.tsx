import React, { useState, useEffect, useRef } from 'react';
import { DraftNotice } from '../components/common/DraftNotice';
import { mergeDraft, usePersistDraft } from '../utils/useFormDraft';
import api from '../services/api';
import { OcrValidationViewer } from '../components/ocr/OcrValidationViewer';
import { useAuth } from '../context/AuthContext';
import {
  UploadCloud,
  ScanText,
  Lock,
  CheckCircle2,
  Cpu,
  FileImage,
  ChevronRight,
  X
} from 'lucide-react';
import { useToast } from '../context/ToastContext';

const STEPS = ['Upload Naksha', 'AI Scanning', 'Review & Approve'];

export const OCRAnalyzerPage: React.FC = () => {
  const { user } = useAuth();
  const toast = useToast();
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'DIRECTOR';

  const ocrDefaults = { selectedProjectId: '', mapName: '', ocrResult: null as any };
  const [ocrBoot] = useState(() => mergeDraft('hs-admin-ocr', ocrDefaults));
  const [ocrDraftRestored, setOcrDraftRestored] = useState(ocrBoot.restored);
  const [step, setStep] = useState<0 | 1 | 2>(ocrBoot.value.ocrResult ? 2 : 0);
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>(ocrBoot.value.selectedProjectId);
  const [mapName, setMapName] = useState<string>(ocrBoot.value.mapName);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [ocrResult, setOcrResult] = useState<any>(ocrBoot.value.ocrResult);
  const clearOcrDraft = usePersistDraft('hs-admin-ocr', {
    selectedProjectId,
    mapName,
    ocrResult: step === 1 ? null : ocrResult,
  }, ocrDefaults);
  const [statusMsg, setStatusMsg] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isAdmin) {
      api.get('/projects')
        .then((r) => {
          const data = r.data || [];
          setProjects(data);
          if (data.length > 0 && !ocrBoot.value.selectedProjectId) {
            setSelectedProjectId(data[0]._id);
            setMapName(`${data[0].name} — Naksha Layout`);
          }
        })
        .catch(() => {});
    }
  }, [isAdmin]);

  const handleAnalyze = async (targetFile = file, targetProjectId = selectedProjectId) => {
    if (!targetProjectId) {
      toast.error('Please select a project first.');
      return;
    }
    if (!targetFile) {
      toast.error('Please upload a Naksha image first.');
      return;
    }

    setStep(1);
    const startedAt = Date.now();
    const messages = [
      'Uploading image to secure storage...',
      'Running Gemini 2.5 Pro Vision AI on Naksha...',
      'Scanning 3x3 tile layout grid for plot boundaries...',
      'Extracting plot numbers, dimensions & SOLD stamps...',
      'Finalizing vector overlay results...'
    ];
    let i = 0;
    setStatusMsg(messages[0]);
    const interval = setInterval(() => {
      i++;
      if (i < messages.length) setStatusMsg(messages[i]);
    }, 1500);

    try {
      const formData = new FormData();
      formData.append('file', targetFile);
      formData.append('projectId', targetProjectId);
      formData.append('mapName', mapName || 'Naksha Layout');

      const response = await api.post('/ocr/analyze', formData);

      clearInterval(interval);
      setOcrResult(response.data);
      setStep(2);
      toast.success(`Extracted ${response.data?.extractedPlots?.length || 0} plots from the Naksha!`);
    } catch (error: any) {
      clearInterval(interval);
      // Attempt recovery of completed background OCR map only if network/timeout/gateway
      // errors occurred. A 4xx means the server rejected THIS upload — never show an older map.
      const httpStatus: number | undefined = error?.response?.status;
      const recoverable = !httpStatus || httpStatus >= 500;
      if (targetProjectId && recoverable) {
        try {
          const recovered = await api.get(`/ocr/latest/${targetProjectId}`);
          const createdAt = recovered.data?.createdAt ? new Date(recovered.data.createdAt).getTime() : 0;
          // allow some client/server clock skew, but reject maps from earlier runs
          const isFromThisRun = createdAt >= startedAt - 2 * 60 * 1000;
          if (recovered.data?.extractedPlots?.length && recovered.data?.status === 'PENDING_REVIEW' && isFromThisRun) {
            setOcrResult(recovered.data);
            setStep(2);
            toast.success(`AI analysis completed in background! Recovered ${recovered.data.extractedPlots.length} plots.`);
            return;
          }
        } catch (_recoveryErr) {
          // ignore
        }
      }
      setStep(0);
      toast.error(error?.response?.data?.message || 'AI analysis timed out or failed. Please retry or pick project.');
    }
  };

  const handleFileSelect = (f: File) => {
    setFile(f);
    if (f.type.startsWith('image/')) {
      const url = URL.createObjectURL(f);
      setPreviewUrl(url);
    } else {
      setPreviewUrl(null);
    }
    if (selectedProjectId) {
      handleAnalyze(f, selectedProjectId);
    } else {
      toast.error('Please select a project above to run AI analysis.');
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFileSelect(f);
  };

  const handleReset = () => {
    clearOcrDraft();
    setOcrDraftRestored(false);
    setOcrResult(null);
    setStep(0);
    setFile(null);
    setPreviewUrl(null);
    setOcrResult(null);
    setStatusMsg('');
  };

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="bg-white p-12 rounded-3xl border border-amber-200 max-w-md text-center space-y-4 shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto">
            <Lock className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-serif font-bold text-[#171A18]">Admin Access Only</h3>
          <p className="text-xs text-[#171A18]/70">
            Naksha OCR analysis is restricted to Administrators and Directors only.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300 max-w-4xl mx-auto">
      {/* Page Header */}
      <div>
        <h2 className="text-2xl font-serif font-bold text-[#171A18]">Naksha AI Analyzer</h2>
        <p className="text-xs text-[#171A18]/60 mt-1">
          Upload any site layout image — AI will extract all plot numbers, sizes and boundaries automatically.
        </p>
      </div>
      {ocrDraftRestored && (
        <DraftNotice onDiscard={() => {
          clearOcrDraft();
          setSelectedProjectId('');
          setMapName('');
          setOcrResult(null);
          setStep(0);
          setOcrDraftRestored(false);
        }} />
      )}

      {/* Step Indicator */}
      <div className="flex items-center gap-0">
        {STEPS.map((label, idx) => (
          <React.Fragment key={idx}>
            <div className="flex items-center gap-2">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${
                idx < step
                  ? 'bg-[#0B4F3C] border-[#0B4F3C] text-white'
                  : idx === step
                  ? 'bg-white border-[#0B4F3C] text-[#0B4F3C]'
                  : 'bg-white border-[#0B4F3C]/20 text-[#171A18]/40'
              }`}>
                {idx < step ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
              </div>
              <span className={`text-xs font-bold hidden sm:block ${
                idx === step ? 'text-[#0B4F3C]' : idx < step ? 'text-[#0B4F3C]/70' : 'text-[#171A18]/40'
              }`}>{label}</span>
            </div>
            {idx < STEPS.length - 1 && (
              <div className={`flex-1 h-0.5 mx-3 transition-all ${idx < step ? 'bg-[#0B4F3C]' : 'bg-[#0B4F3C]/15'}`} />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* STEP 0 — Upload */}
      {step === 0 && (
        <div className="bg-white rounded-3xl border border-[#0B4F3C]/15 p-8 space-y-6 shadow-sm">

          {/* Project + Map Name */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-[#171A18]/70 block mb-1.5">
                Project <span className="text-red-500">*</span>
              </label>
              <select
                value={selectedProjectId}
                onChange={(e) => {
                  setSelectedProjectId(e.target.value);
                  const proj = projects.find(p => p._id === e.target.value);
                  if (proj) setMapName(`${proj.name} — Naksha Layout`);
                }}
                className="w-full bg-[#FDFCF0] border border-[#0B4F3C]/20 rounded-xl px-3 py-2.5 text-xs text-[#171A18] font-bold focus:outline-none focus:border-[#0B4F3C] focus:ring-1 focus:ring-[#0B4F3C]/20"
              >
                <option value="">— Select Project —</option>
                {projects.map((p) => (
                  <option key={p._id} value={p._id}>{p.name} ({p.code})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-[#171A18]/70 block mb-1.5">Map / Layout Title</label>
              <input
                type="text"
                value={mapName}
                onChange={(e) => setMapName(e.target.value)}
                placeholder="e.g. Sector 5 — Phase 2 Layout"
                className="w-full bg-[#FDFCF0] border border-[#0B4F3C]/20 rounded-xl px-3 py-2.5 text-xs text-[#171A18] font-bold focus:outline-none focus:border-[#0B4F3C] focus:ring-1 focus:ring-[#0B4F3C]/20"
              />
            </div>
          </div>

          {/* Drop Zone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`relative border-2 border-dashed rounded-2xl cursor-pointer transition-all ${
              isDragging
                ? 'border-[#0B4F3C] bg-[#E8F0EC] scale-[1.01]'
                : file
                ? 'border-[#0B4F3C]/60 bg-[#E8F0EC]/40'
                : 'border-[#0B4F3C]/20 bg-[#FDFCF0] hover:border-[#0B4F3C]/50 hover:bg-[#E8F0EC]/30'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".png,.jpg,.jpeg,.webp"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
            />

            {file && previewUrl ? (
              /* Image Preview inside drop zone */
              <div className="p-4">
                <div className="relative rounded-xl overflow-hidden max-h-64">
                  <img src={previewUrl} alt="Preview" className="w-full object-contain max-h-64" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                  <div className="absolute bottom-3 left-3 flex items-center gap-2">
                    <span className="bg-emerald-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                      ✅ Ready to Analyze
                    </span>
                    <span className="bg-black/60 text-white text-[10px] px-2 py-0.5 rounded-full">
                      {file.name}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setFile(null); setPreviewUrl(null); }}
                    className="absolute top-2 right-2 w-7 h-7 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors shadow-md"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : file ? (
              /* PDF or non-image */
              <div className="p-10 text-center">
                <FileImage className="w-12 h-12 text-[#0B4F3C] mx-auto mb-3" />
                <p className="text-sm font-bold text-[#171A18]">✅ {file.name}</p>
                <p className="text-xs text-[#171A18]/60 mt-1">PDF selected — AI will extract all plot data</p>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setFile(null); }}
                  className="mt-3 text-xs text-red-500 hover:text-red-700 font-semibold"
                >
                  Remove
                </button>
              </div>
            ) : (
              /* Empty State */
              <div className="p-12 text-center">
                <UploadCloud className="w-12 h-12 text-[#0B4F3C]/50 mx-auto mb-3" />
                <p className="text-sm font-bold text-[#171A18]">Drop your Naksha image here</p>
                <p className="text-xs text-[#171A18]/50 mt-1">or click to browse — PNG, JPG, WEBP supported</p>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => handleAnalyze()}
              disabled={!file || !selectedProjectId}
              className="flex-1 py-3 rounded-xl bg-[#0B4F3C] hover:bg-[#063B2D] text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer border border-[#0B4F3C] disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ScanText className="w-4 h-4" />
              Analyze with AI
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 1 — AI Scanning */}
      {step === 1 && (
        <div className="bg-white rounded-3xl border border-[#0B4F3C]/15 p-12 shadow-sm flex flex-col items-center justify-center gap-6 min-h-[380px]">
          {/* Animated Scanner */}
          <div className="relative w-24 h-24">
            <div className="w-24 h-24 rounded-3xl bg-[#0B4F3C]/10 flex items-center justify-center">
              <Cpu className="w-12 h-12 text-[#0B4F3C]" />
            </div>
            <div className="absolute inset-0 rounded-3xl border-2 border-[#0B4F3C]/30 animate-ping" />
            <div className="absolute inset-0 rounded-3xl border-2 border-[#0B4F3C]/20 animate-ping" style={{ animationDelay: '0.5s' }} />
          </div>

          {/* Image preview while analyzing */}
          {previewUrl && (
            <div className="relative w-full max-w-xs rounded-xl overflow-hidden border-2 border-[#0B4F3C]/20">
              <img src={previewUrl} alt="Analyzing" className="w-full object-cover max-h-40 opacity-60" />
              {/* Scanning line animation */}
              <div className="absolute inset-0 overflow-hidden">
                <div className="absolute w-full h-1 bg-gradient-to-r from-transparent via-emerald-400 to-transparent animate-bounce opacity-80" style={{ top: '40%' }} />
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-[#0B4F3C]/30 to-transparent" />
            </div>
          )}

          <div className="text-center space-y-2">
            <p className="text-base font-bold text-[#171A18]">AI is reading your Naksha...</p>
            <p className="text-xs text-[#171A18]/60 min-h-[1.2rem] transition-all">{statusMsg}</p>
          </div>

          <div className="flex gap-1.5">
            {[0,1,2].map(i => (
              <div
                key={i}
                className="w-2 h-2 rounded-full bg-[#0B4F3C] animate-bounce"
                style={{ animationDelay: `${i * 0.2}s` }}
              />
            ))}
          </div>
        </div>
      )}

      {/* STEP 2 — Review Results */}
      {step === 2 && ocrResult && (
        <OcrValidationViewer
          mapData={ocrResult}
          uploadedPreviewUrl={previewUrl}
          onComplete={handleReset}
        />
      )}
    </div>
  );
};
