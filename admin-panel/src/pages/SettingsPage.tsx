import React, { useState, useEffect, useCallback } from 'react';
import {
  Settings,
  Bell,
  Save,
  CheckCircle,
  Megaphone,
  Loader2,
  Building2,
  Phone,
  Mail,
  Globe,
  FileText,
  Award,
  GitMerge,
  RefreshCw,
  Shield,
  AlertTriangle,
  Info,
  X,
  LayoutDashboard
} from 'lucide-react';
import api from '../services/api';
import { useToast } from '../context/ToastContext';
import { DraftNotice } from '../components/common/DraftNotice';
import { readDraft } from '../utils/formDraft';
import { usePersistDraft } from '../utils/useFormDraft';

const SETTINGS_DRAFT_KEY = 'hs-admin-settings';

type SettingsSnap = {
  activeTab: Tab;
  announcementText: string;
  isTickerActive: boolean;
  company: CompanyInfo;
  commission: CommissionConfig;
  mlm: MlmConfig;
  frontendStats: FrontendStatsConfig;
};

interface CompanyInfo {
  companyName: string;
  tagline: string;
  phone: string;
  whatsapp: string;
  email: string;
  address: string;
  gstNumber: string;
  reraNumber: string;
  website: string;
}

interface CommissionConfig {
  enableAutoCommission: boolean;
  enableWhatsappAlerts: boolean;
  enableEmailAlerts: boolean;
  defaultCommissionPercent: number;
  gstOnCommission: number;
}

interface MlmConfig {
  maxLegDepth: number;
  minSalesForRankUp: number;
  autoRankPromotion: boolean;
}

interface FrontendStatsConfig {
  projectsCount: string;
  advisorsCount: string;
  locationsCount: string;
  revenue: string;
}

type Tab = 'ANNOUNCEMENT' | 'COMPANY' | 'COMMISSION' | 'MLM' | 'FRONTEND_STATS';

const TAB_CONFIG: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: 'ANNOUNCEMENT', label: 'Announcement Ticker', icon: <Megaphone className="w-4 h-4" /> },
  { id: 'COMPANY',      label: 'Company Identity',   icon: <Building2 className="w-4 h-4" /> },
  { id: 'COMMISSION',   label: 'Commission & Alerts', icon: <Award className="w-4 h-4" /> },
  { id: 'MLM',          label: 'MLM Network',         icon: <GitMerge className="w-4 h-4" /> },
  { id: 'FRONTEND_STATS', label: 'Frontend Stats',    icon: <LayoutDashboard className="w-4 h-4" /> },
];

export const SettingsPage: React.FC = () => {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState<Tab>('ANNOUNCEMENT');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Announcement
  const [announcementText, setAnnouncementText] = useState('');
  const [isTickerActive, setIsTickerActive] = useState(true);

  // Company Info
  const [company, setCompany] = useState<CompanyInfo>({
    companyName: 'House & Sky Enterprise Advisory',
    tagline: 'Premium Real Estate & Township Investments',
    phone: '+91 93112 27789',
    whatsapp: '+91 92899 27527',
    email: 'info@houseandskyenterprise.com',
    address: 'India',
    gstNumber: '',
    reraNumber: '',
    website: ''
  });

  // Commission
  const [commission, setCommission] = useState<CommissionConfig>({
    enableAutoCommission: true,
    enableWhatsappAlerts: true,
    enableEmailAlerts: true,
    defaultCommissionPercent: 2,
    gstOnCommission: 18
  });

  // MLM Config
  const [mlm, setMlm] = useState<MlmConfig>({
    maxLegDepth: 10,
    minSalesForRankUp: 1,
    autoRankPromotion: false
  });

  // Frontend Stats
  const [frontendStats, setFrontendStats] = useState<FrontendStatsConfig>({
    projectsCount: '2 Projects',
    advisorsCount: '45+ Team',
    locationsCount: '6 Enclaves',
    revenue: '₹120 Cr+'
  });
  const [settingsBaseline, setSettingsBaseline] = useState<SettingsSnap | null>(null);
  const [draftRestored, setDraftRestored] = useState(false);
  const settingsSnapshot: SettingsSnap = {
    activeTab, announcementText, isTickerActive, company, commission, mlm, frontendStats,
  };
  const clearSettingsDraft = usePersistDraft(
    SETTINGS_DRAFT_KEY,
    settingsSnapshot,
    settingsBaseline,
    !isLoading && settingsBaseline != null
  );

  const fetchSettings = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/admin/settings');
      const data = res.data;
      const serverSnap: SettingsSnap = {
        activeTab: 'ANNOUNCEMENT',
        announcementText: data.ANNOUNCEMENT_TICKER?.value || '',
        isTickerActive: data.ANNOUNCEMENT_TICKER ? data.ANNOUNCEMENT_TICKER.jsonValue?.isActive !== false : true,
        company: {
          companyName: 'House & Sky Enterprise Advisory',
          tagline: 'Premium Real Estate & Township Investments',
          phone: '+91 93112 27789',
          whatsapp: '+91 92899 27527',
          email: 'info@houseandskyenterprise.com',
          address: 'India',
          gstNumber: '',
          reraNumber: '',
          website: '',
          ...(data.COMPANY_INFO?.jsonValue || {}),
        },
        commission: {
          enableAutoCommission: true,
          enableWhatsappAlerts: true,
          enableEmailAlerts: true,
          defaultCommissionPercent: 2,
          gstOnCommission: 18,
          ...(data.COMMISSION_CONFIG?.jsonValue || {}),
        },
        mlm: {
          maxLegDepth: 10,
          minSalesForRankUp: 1,
          autoRankPromotion: false,
          ...(data.MLM_CONFIG?.jsonValue || {}),
        },
        frontendStats: {
          projectsCount: '2 Projects',
          advisorsCount: '45+ Team',
          locationsCount: '6 Enclaves',
          revenue: '₹120 Cr+',
          ...(data.FRONTEND_STATS?.jsonValue || {}),
        },
      };
      const saved = readDraft<SettingsSnap>(SETTINGS_DRAFT_KEY);
      const next: SettingsSnap = saved
        ? {
            ...serverSnap,
            ...saved,
            company: { ...serverSnap.company, ...(saved.company || {}) },
            commission: { ...serverSnap.commission, ...(saved.commission || {}) },
            mlm: { ...serverSnap.mlm, ...(saved.mlm || {}) },
            frontendStats: { ...serverSnap.frontendStats, ...(saved.frontendStats || {}) },
          }
        : serverSnap;
      setActiveTab(next.activeTab || 'ANNOUNCEMENT');
      setAnnouncementText(next.announcementText);
      setIsTickerActive(next.isTickerActive);
      setCompany(next.company);
      setCommission(next.commission);
      setMlm(next.mlm);
      setFrontendStats(next.frontendStats);
      setSettingsBaseline(serverSnap);
      setDraftRestored(JSON.stringify(next) !== JSON.stringify(serverSnap));
    } catch (err) {
      console.error('Failed to load settings', err);
      toast.error('Failed to load settings. Please refresh.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchSettings(); }, [fetchSettings]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await api.put('/admin/settings', {
        ANNOUNCEMENT_TICKER: {
          value: announcementText,
          jsonValue: { isActive: isTickerActive }
        },
        COMPANY_INFO: {
          value: company.companyName,
          jsonValue: company
        },
        COMMISSION_CONFIG: {
          value: 'commission_config',
          jsonValue: commission
        },
        MLM_CONFIG: {
          value: 'mlm_config',
          jsonValue: mlm
        },
        FRONTEND_STATS: {
          value: 'frontend_stats',
          jsonValue: frontendStats
        }
      });
      clearSettingsDraft();
      setSettingsBaseline(settingsSnapshot);
      setDraftRestored(false);
      toast.success('All settings saved successfully!');
    } catch (err: any) {
      toast.error(err?.friendlyMessage || 'Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  const updateCompany = (field: keyof CompanyInfo, value: string) =>
    setCompany((prev) => ({ ...prev, [field]: value }));

  const updateCommission = (field: keyof CommissionConfig, value: any) =>
    setCommission((prev) => ({ ...prev, [field]: value }));

  const updateMlm = (field: keyof MlmConfig, value: any) =>
    setMlm((prev) => ({ ...prev, [field]: value }));

  const updateFrontendStats = (field: keyof FrontendStatsConfig, value: string) =>
    setFrontendStats((prev) => ({ ...prev, [field]: value }));

  return (
    <div className="space-y-6 animate-in fade-in duration-300 max-w-4xl">
      {draftRestored && settingsBaseline && (
        <DraftNotice onDiscard={() => {
          clearSettingsDraft();
          setActiveTab(settingsBaseline.activeTab);
          setAnnouncementText(settingsBaseline.announcementText);
          setIsTickerActive(settingsBaseline.isTickerActive);
          setCompany(settingsBaseline.company);
          setCommission(settingsBaseline.commission);
          setMlm(settingsBaseline.mlm);
          setFrontendStats(settingsBaseline.frontendStats);
          setDraftRestored(false);
        }} />
      )}
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-serif font-bold text-[#171A18]">System Settings</h2>
          <p className="text-xs text-[#171A18]/70 mt-1">
            Configure company identity, commission rules, MLM structure, and live announcements
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchSettings}
            disabled={isLoading}
            className="p-2.5 rounded-xl bg-[#E8F0EC] border border-[#0B4F3C]/20 text-[#0B4F3C] hover:bg-[#0B4F3C] hover:text-white transition-colors cursor-pointer"
            title="Reload settings"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving || isLoading}
            className="px-5 py-2.5 rounded-xl bg-[#0B4F3C] hover:bg-[#063B2D] text-white font-bold text-xs shadow-md flex items-center gap-2 cursor-pointer border border-[#0B4F3C] disabled:opacity-50 transition-colors"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save All Settings
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="bg-white rounded-3xl border border-[#0B4F3C]/15 p-16 flex items-center justify-center">
          <div className="text-center space-y-3">
            <Loader2 className="w-8 h-8 animate-spin text-[#0B4F3C] mx-auto" />
            <p className="text-sm font-bold text-[#171A18]/60">Loading settings from database...</p>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-[#0B4F3C]/15 shadow-sm overflow-hidden">
          {/* Tab Navigation */}
          <div className="flex border-b border-[#0B4F3C]/15 bg-[#FDFCF0] overflow-x-auto">
            {TAB_CONFIG.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-5 py-3.5 text-xs font-bold whitespace-nowrap transition-all cursor-pointer border-b-2 ${
                  activeTab === tab.id
                    ? 'border-[#0B4F3C] text-[#0B4F3C] bg-white'
                    : 'border-transparent text-[#171A18]/50 hover:text-[#171A18] hover:bg-[#E8F0EC]/50'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="p-6 sm:p-8 space-y-6">

            {/* ── ANNOUNCEMENT TAB ── */}
            {activeTab === 'ANNOUNCEMENT' && (
              <div className="space-y-5">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-serif font-bold text-[#171A18] text-lg">Landing Page Announcement Ribbon</h3>
                    <p className="text-xs text-[#171A18]/60 mt-0.5">Scrolling marquee ticker that appears below the Navbar on the public website</p>
                  </div>
                  <label className="flex items-center gap-2.5 cursor-pointer bg-[#E8F0EC] px-4 py-2 rounded-xl border border-[#0B4F3C]/20">
                    <div
                      onClick={() => setIsTickerActive(!isTickerActive)}
                      className={`w-10 h-5 rounded-full transition-colors relative cursor-pointer ${isTickerActive ? 'bg-[#0B4F3C]' : 'bg-slate-300'}`}
                    >
                      <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${isTickerActive ? 'translate-x-5' : 'translate-x-0.5'}`} />
                    </div>
                    <span className="text-xs font-bold text-[#0B4F3C]">
                      {isTickerActive ? 'Ribbon ON' : 'Ribbon OFF'}
                    </span>
                  </label>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-[#171A18]/70 block">
                    Marquee Text (scrolls right-to-left on the website)
                  </label>
                  <textarea
                    rows={4}
                    value={announcementText}
                    onChange={(e) => setAnnouncementText(e.target.value)}
                    placeholder="Type important announcement... e.g. महत्वपूर्ण सूचना: धोलरा SIR प्रोजेक्ट बुकिंग चालू है..."
                    className="w-full bg-[#FDFCF0] border border-[#0B4F3C]/20 rounded-xl p-4 text-sm text-[#171A18] font-medium focus:outline-none focus:border-[#0B4F3C] resize-none"
                  />
                  <div className="flex items-center gap-2 text-[11px] text-[#171A18]/50 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
                    <Info className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    Changes saved here reflect instantly on the live website's announcement bar.
                  </div>
                </div>

                {/* Preview */}
                {isTickerActive && announcementText && (
                  <div className="rounded-xl overflow-hidden border border-[#0B4F3C]/20">
                    <p className="text-[10px] font-bold text-[#0B4F3C] bg-[#E8F0EC] px-3 py-1.5 uppercase tracking-wider">
                      Live Preview
                    </p>
                    <div className="bg-[#0B4F3C] py-2 overflow-hidden">
                      <div className="whitespace-nowrap animate-marquee text-white text-xs font-semibold px-4">
                        {announcementText}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── COMPANY TAB ── */}
            {activeTab === 'COMPANY' && (
              <div className="space-y-5">
                <div>
                  <h3 className="font-serif font-bold text-[#171A18] text-lg">Company Identity</h3>
                  <p className="text-xs text-[#171A18]/60 mt-0.5">Business name, contact details, GST & RERA numbers shown on invoices and the website</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    { key: 'companyName', label: 'Company Name', icon: <Building2 className="w-3.5 h-3.5" />, placeholder: 'House & Sky Enterprise Advisory' },
                    { key: 'tagline', label: 'Tagline / Slogan', icon: <FileText className="w-3.5 h-3.5" />, placeholder: 'Premium Real Estate Investments' },
                    { key: 'phone', label: 'Office Phone', icon: <Phone className="w-3.5 h-3.5" />, placeholder: '+91 93112 27789' },
                    { key: 'whatsapp', label: 'WhatsApp Number', icon: <Phone className="w-3.5 h-3.5" />, placeholder: '+91 92899 27527' },
                    { key: 'email', label: 'Company Email', icon: <Mail className="w-3.5 h-3.5" />, placeholder: 'info@company.com' },
                    { key: 'website', label: 'Website URL', icon: <Globe className="w-3.5 h-3.5" />, placeholder: 'https://houseandskyenterprise.com' },
                    { key: 'gstNumber', label: 'GST Number', icon: <FileText className="w-3.5 h-3.5" />, placeholder: '22AAAAA0000A1Z5' },
                    { key: 'reraNumber', label: 'RERA Registration No.', icon: <Shield className="w-3.5 h-3.5" />, placeholder: 'RERA/GJ/XXX' },
                  ].map((field) => (
                    <div key={field.key} className="space-y-1.5">
                      <label className="text-xs font-bold text-[#171A18]/70 flex items-center gap-1.5">
                        {field.icon} {field.label}
                      </label>
                      <input
                        type="text"
                        value={(company as any)[field.key] || ''}
                        onChange={(e) => updateCompany(field.key as keyof CompanyInfo, e.target.value)}
                        placeholder={field.placeholder}
                        className="w-full bg-[#FDFCF0] border border-[#0B4F3C]/20 rounded-xl px-3 py-2.5 text-sm text-[#171A18] font-semibold focus:outline-none focus:border-[#0B4F3C] transition-colors"
                      />
                    </div>
                  ))}
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#171A18]/70 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5" /> Registered Office Address
                  </label>
                  <textarea
                    rows={2}
                    value={company.address}
                    onChange={(e) => updateCompany('address', e.target.value)}
                    placeholder="Full registered office address..."
                    className="w-full bg-[#FDFCF0] border border-[#0B4F3C]/20 rounded-xl px-3 py-2.5 text-sm text-[#171A18] font-semibold focus:outline-none focus:border-[#0B4F3C] resize-none"
                  />
                </div>
              </div>
            )}

            {/* ── COMMISSION TAB ── */}
            {activeTab === 'COMMISSION' && (
              <div className="space-y-5">
                <div>
                  <h3 className="font-serif font-bold text-[#171A18] text-lg">Commission & Notification Settings</h3>
                  <p className="text-xs text-[#171A18]/60 mt-0.5">Commission auto-calculation rules and multi-channel alert preferences</p>
                </div>

                {/* Toggles */}
                <div className="space-y-3">
                  {[
                    { key: 'enableAutoCommission', label: 'Auto-calculate commission on plot sale', desc: 'Automatically run commission engine when a plot is marked as SOLD' },
                    { key: 'enableWhatsappAlerts', label: 'Send WhatsApp payout alerts to agents', desc: 'Agents receive WhatsApp notifications when commissions are approved or paid' },
                    { key: 'enableEmailAlerts', label: 'Send email payout alerts & invoices', desc: 'Send commission invoices and payout confirmations via email' },
                  ].map((item) => (
                    <div key={item.key} className="flex items-start justify-between gap-4 p-4 bg-[#FDFCF0] rounded-2xl border border-[#0B4F3C]/15">
                      <div>
                        <p className="text-sm font-bold text-[#171A18]">{item.label}</p>
                        <p className="text-[11px] text-[#171A18]/60 mt-0.5">{item.desc}</p>
                      </div>
                      <div
                        onClick={() => updateCommission(item.key as keyof CommissionConfig, !(commission as any)[item.key])}
                        className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer shrink-0 mt-0.5 ${(commission as any)[item.key] ? 'bg-[#0B4F3C]' : 'bg-slate-300'}`}
                      >
                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${(commission as any)[item.key] ? 'translate-x-5' : 'translate-x-1'}`} />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Numeric settings */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[#171A18]/70">
                      Default Commission % (Base Rate)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min={0}
                        max={100}
                        step={0.5}
                        value={commission.defaultCommissionPercent}
                        onChange={(e) => updateCommission('defaultCommissionPercent', parseFloat(e.target.value) || 0)}
                        className="w-full bg-[#FDFCF0] border border-[#0B4F3C]/20 rounded-xl px-3 py-2.5 text-sm text-[#171A18] font-bold focus:outline-none focus:border-[#0B4F3C]"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-[#0B4F3C]">%</span>
                    </div>
                    <p className="text-[10px] text-[#171A18]/50">Used as default if no rank-specific rate is defined</p>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[#171A18]/70">
                      GST on Commission (%)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min={0}
                        max={50}
                        step={1}
                        value={commission.gstOnCommission}
                        onChange={(e) => updateCommission('gstOnCommission', parseFloat(e.target.value) || 0)}
                        className="w-full bg-[#FDFCF0] border border-[#0B4F3C]/20 rounded-xl px-3 py-2.5 text-sm text-[#171A18] font-bold focus:outline-none focus:border-[#0B4F3C]"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-[#0B4F3C]">%</span>
                    </div>
                    <p className="text-[10px] text-[#171A18]/50">Standard GST rate applied on commission amounts</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-[11px] text-amber-800 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  Commission rates per rank are configured inside the MLM Engine (mlmEngine.js). The default % above applies only when no rank match is found.
                </div>
              </div>
            )}

            {/* ── MLM TAB ── */}
            {activeTab === 'MLM' && (
              <div className="space-y-5">
                <div>
                  <h3 className="font-serif font-bold text-[#171A18] text-lg">MLM Network Configuration</h3>
                  <p className="text-xs text-[#171A18]/60 mt-0.5">Multi-leg tree structure rules and rank promotion behaviour</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[#171A18]/70">
                      Max Upline Depth for Commission
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={50}
                      value={mlm.maxLegDepth}
                      onChange={(e) => updateMlm('maxLegDepth', parseInt(e.target.value, 10) || 10)}
                      className="w-full bg-[#FDFCF0] border border-[#0B4F3C]/20 rounded-xl px-3 py-2.5 text-sm text-[#171A18] font-bold focus:outline-none focus:border-[#0B4F3C]"
                    />
                    <p className="text-[10px] text-[#171A18]/50">How many upline levels receive differential commission when a sale is made</p>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[#171A18]/70">
                      Min Sales for Rank Qualification
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={mlm.minSalesForRankUp}
                      onChange={(e) => updateMlm('minSalesForRankUp', parseInt(e.target.value, 10) || 1)}
                      className="w-full bg-[#FDFCF0] border border-[#0B4F3C]/20 rounded-xl px-3 py-2.5 text-sm text-[#171A18] font-bold focus:outline-none focus:border-[#0B4F3C]"
                    />
                    <p className="text-[10px] text-[#171A18]/50">Minimum self sales plots needed before rank criteria is evaluated</p>
                  </div>
                </div>

                <div className="flex items-start justify-between gap-4 p-4 bg-[#FDFCF0] rounded-2xl border border-[#0B4F3C]/15">
                  <div>
                    <p className="text-sm font-bold text-[#171A18]">Auto Rank Promotion</p>
                    <p className="text-[11px] text-[#171A18]/60 mt-0.5">
                      When enabled, the system automatically promotes agents to higher ranks when they meet all criteria. When disabled, admin must manually promote.
                    </p>
                  </div>
                  <div
                    onClick={() => updateMlm('autoRankPromotion', !mlm.autoRankPromotion)}
                    className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer shrink-0 mt-0.5 ${mlm.autoRankPromotion ? 'bg-[#0B4F3C]' : 'bg-slate-300'}`}
                  >
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${mlm.autoRankPromotion ? 'translate-x-5' : 'translate-x-1'}`} />
                  </div>
                </div>

                {/* MLM Tree Info */}
                <div className="bg-[#E8F0EC]/50 border border-[#0B4F3C]/15 rounded-2xl p-4 space-y-2">
                  <p className="text-xs font-bold text-[#0B4F3C] uppercase tracking-wider">Current MLM Structure</p>
                  <div className="grid grid-cols-3 gap-3 text-center text-xs">
                    <div className="bg-white rounded-xl p-2.5 border border-[#0B4F3C]/15">
                      <p className="text-[10px] text-[#171A18]/60 font-semibold">Tree Type</p>
                      <p className="font-extrabold text-[#0B4F3C] mt-0.5">N-Ary</p>
                      <p className="text-[9px] text-[#171A18]/40">Unlimited legs</p>
                    </div>
                    <div className="bg-white rounded-xl p-2.5 border border-[#0B4F3C]/15">
                      <p className="text-[10px] text-[#171A18]/60 font-semibold">Commission Type</p>
                      <p className="font-extrabold text-[#0B4F3C] mt-0.5">Differential</p>
                      <p className="text-[9px] text-[#171A18]/40">Rank-based</p>
                    </div>
                    <div className="bg-white rounded-xl p-2.5 border border-[#0B4F3C]/15">
                      <p className="text-[10px] text-[#171A18]/60 font-semibold">Max Depth</p>
                      <p className="font-extrabold text-[#0B4F3C] mt-0.5">{mlm.maxLegDepth} Levels</p>
                      <p className="text-[9px] text-[#171A18]/40">Configurable</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── FRONTEND STATS TAB ── */}
            {activeTab === 'FRONTEND_STATS' && (
              <div className="space-y-5">
                <div>
                  <h3 className="font-serif font-bold text-[#171A18] text-lg">Frontend Statistics</h3>
                  <p className="text-xs text-[#171A18]/60 mt-0.5">Manage the dynamic statistics shown on the landing page</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    { key: 'projectsCount', label: 'Township Developments', placeholder: 'e.g. 2 Projects' },
                    { key: 'advisorsCount', label: 'Community Advisors', placeholder: 'e.g. 45+ Team' },
                    { key: 'locationsCount', label: 'Prime Locations', placeholder: 'e.g. 6 Enclaves' },
                    { key: 'revenue', label: 'Demarcated Land Manifest (Revenue)', placeholder: 'e.g. ₹120 Cr+' },
                  ].map((field) => (
                    <div key={field.key} className="space-y-1.5">
                      <label className="text-xs font-bold text-[#171A18]/70 flex items-center gap-1.5">
                        <LayoutDashboard className="w-3.5 h-3.5" /> {field.label}
                      </label>
                      <input
                        type="text"
                        value={(frontendStats as any)[field.key] || ''}
                        onChange={(e) => updateFrontendStats(field.key as keyof FrontendStatsConfig, e.target.value)}
                        placeholder={field.placeholder}
                        className="w-full bg-[#FDFCF0] border border-[#0B4F3C]/20 rounded-xl px-3 py-2.5 text-sm text-[#171A18] font-semibold focus:outline-none focus:border-[#0B4F3C] transition-colors"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>

          {/* Sticky Save Footer */}
          <div className="px-6 sm:px-8 py-4 bg-[#FDFCF0] border-t border-[#0B4F3C]/15 flex items-center justify-between">
            <p className="text-[11px] text-[#171A18]/50">
              Changes are saved to the database and take effect immediately across all services.
            </p>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-6 py-2.5 rounded-xl bg-[#0B4F3C] hover:bg-[#063B2D] text-white font-bold text-xs shadow-md flex items-center gap-2 cursor-pointer border border-[#0B4F3C] disabled:opacity-50 transition-colors"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {isSaving ? 'Saving...' : 'Save All Changes'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
