import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  Users,
  GitMerge,
  Building2,
  MapPin,
  Map,
  DollarSign,
  CreditCard,
  ScanText,
  FileBarChart,
  Bell,
  Settings,
  Building,
  Bot,
  MessageSquare,
  ShieldCheck,
  ChevronRight,
  X,
  Home,
  Link2,
  ClipboardCheck,
  Image as ImageIcon,
  Flame,
  PackageSearch
} from 'lucide-react';

const ALL_ROLES = ['ADMIN', 'DIRECTOR', 'MANAGER', 'EMPLOYEE', 'AGENT'];
const ADMIN_DIRECTOR = ['ADMIN', 'DIRECTOR'];
const ADMIN_DIRECTOR_MANAGER = ['ADMIN', 'DIRECTOR', 'MANAGER'];
const AGENT_EMPLOYEE_MANAGER = ['MANAGER', 'EMPLOYEE', 'AGENT']; // roles that need personal KYC

interface NavItem {
  name: string;
  path: string;
  icon: any;
  allowedRoles: string[];
  badge?: string;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const navSections: NavSection[] = [
  {
    title: 'OVERVIEW & LEADS',
    items: [
      { name: 'Executive Dashboard', path: '/dashboard', icon: LayoutDashboard, allowedRoles: ADMIN_DIRECTOR },
      { name: 'Agent Home', path: '/agent', icon: LayoutDashboard, allowedRoles: ALL_ROLES },
      { name: 'Bookings', path: '/bookings', icon: ClipboardCheck, allowedRoles: ADMIN_DIRECTOR },
      { name: 'Customer Inquiries', path: '/inquiries', icon: MessageSquare, allowedRoles: ALL_ROLES },
      { name: 'Bulk Deal Requests', path: '/bulk-deal-requests', icon: PackageSearch, allowedRoles: ADMIN_DIRECTOR_MANAGER, badge: 'NEW' },
    ]
  },
  {
    title: 'INVENTORY & NAKSA MAPS',
    items: [
      { name: 'Real Estate Projects', path: '/projects', icon: Building2, allowedRoles: ADMIN_DIRECTOR },
      { name: 'Property Listings', path: '/properties', icon: Home, allowedRoles: ADMIN_DIRECTOR },
      { name: 'Bulk Deals Manager', path: '/bulk-deals-management', icon: Flame, allowedRoles: ADMIN_DIRECTOR_MANAGER, badge: 'HOT' },
      { name: 'Public Gallery Showcase', path: '/gallery-management', icon: ImageIcon, allowedRoles: ADMIN_DIRECTOR_MANAGER },
      { name: 'Cities & Locations', path: '/cities', icon: Map, allowedRoles: ADMIN_DIRECTOR_MANAGER },
      { name: 'Plot Inventory & Canvas', path: '/plots', icon: MapPin, allowedRoles: ALL_ROLES },
      { name: 'Naksha AI OCR Tool', path: '/ocr-analyzer', icon: ScanText, allowedRoles: ADMIN_DIRECTOR, badge: 'AI' },
    ]
  },

  {
    title: 'MLM AGENT NETWORK',
    items: [
      { name: 'Invite Agents', path: '/invite', icon: Link2, allowedRoles: ALL_ROLES },
      { name: 'Employees & Agents', path: '/employees', icon: Users, allowedRoles: ALL_ROLES },
      { name: 'Downline MLM Tree', path: '/mlm-tree', icon: GitMerge, allowedRoles: ALL_ROLES },
    ]
  },
  {
    title: 'FINANCIALS & PAYOUTS',
    items: [
      { name: 'My KYC', path: '/kyc', icon: ShieldCheck, allowedRoles: AGENT_EMPLOYEE_MANAGER },
      { name: 'KYC Approvals', path: '/kyc-review', icon: ClipboardCheck, allowedRoles: ADMIN_DIRECTOR_MANAGER },
      { name: 'Commissions Ledger', path: '/commissions', icon: DollarSign, allowedRoles: ADMIN_DIRECTOR_MANAGER },
      { name: 'Payout Requests', path: '/payouts', icon: CreditCard, allowedRoles: ALL_ROLES },
      { name: 'Financial Reports', path: '/reports', icon: FileBarChart, allowedRoles: ADMIN_DIRECTOR },
    ]
  },
  {
    title: 'AI & SYSTEM',
    items: [
      { name: 'AI Knowledge Base', path: '/ai-knowledge', icon: Bot, allowedRoles: ADMIN_DIRECTOR },
      { name: 'Notifications', path: '/notifications', icon: Bell, allowedRoles: ALL_ROLES },
      { name: 'Settings', path: '/settings', icon: Settings, allowedRoles: ADMIN_DIRECTOR },
    ]
  }
];

interface SidebarProps {
  isMobileOpen?: boolean;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isMobileOpen = false, onClose }) => {
  const { user } = useAuth();
  const userRole = user?.role || 'AGENT';

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden transition-opacity"
        />
      )}

      <aside
        className={`w-64 bg-[#0A1612] text-white flex flex-col h-screen fixed md:sticky top-0 z-50 md:z-30 select-none shadow-2xl border-r border-[#0B4F3C]/30 transition-transform duration-300 ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Brand Header */}
        <div className="p-3 border-b border-white/10 flex items-center justify-between gap-2 bg-[#061913]">
          <div className="flex items-center min-w-0 flex-1 bg-white rounded-xl px-2 py-1.5">
            <img
              src="/logo.png"
              alt="House & Sky — Building Trust. Delivering Value."
              className="h-10 w-auto max-w-full object-contain"
            />
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 md:hidden cursor-pointer shrink-0"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

      {/* User Role Badge */}
      <div className="px-5 py-3 bg-white/5 border-b border-white/10 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
          <span className="font-mono text-white/80 text-[11px] font-bold">{user?.fullName || 'Logged User'}</span>
        </div>
        <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-extrabold text-[10px] uppercase border border-emerald-500/30">
          {userRole}
        </span>
      </div>

      {/* Navigation Groups */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6 scrollbar-thin scrollbar-thumb-white/10">
        {navSections.map((section) => {
          const visibleItems = section.items.filter((item) => item.allowedRoles.includes(userRole));
          if (visibleItems.length === 0) return null;

          return (
            <div key={section.title} className="space-y-1">
              <span className="px-3 text-[10px] font-extrabold tracking-[0.2em] text-emerald-400/80 uppercase block mb-2">
                {section.title}
              </span>

              {visibleItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    end
                    className={({ isActive }) =>
                      `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 ${
                        isActive
                          ? 'bg-gradient-to-r from-[#0B4F3C] to-emerald-600 text-white shadow-lg border border-emerald-400/30'
                          : 'text-white/70 hover:bg-white/10 hover:text-white'
                      }`
                    }
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="w-4 h-4 flex-shrink-0" />
                      <span>{item.name}</span>
                    </div>

                    {item.badge ? (
                      <span className="px-1.5 py-0.5 bg-amber-400/20 text-amber-300 rounded text-[9px] font-extrabold border border-amber-400/30">
                        {item.badge}
                      </span>
                    ) : (
                      <ChevronRight className="w-3.5 h-3.5 opacity-40" />
                    )}
                  </NavLink>
                );
              })}
            </div>
          );
        })}
      </nav>

      {/* Enterprise Footer */}
      <div className="p-4 border-t border-white/10 bg-[#0B241C] text-xs">
        <div className="flex items-center justify-between text-[#0B4F3C]">
          <div className="flex items-center gap-2 text-emerald-400 font-bold">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Admin Suite v1.0</span>
          </div>
          <span className="text-[10px] text-white/50 font-mono">Live Sync</span>
        </div>
      </div>
    </aside>
  </>
);
};

