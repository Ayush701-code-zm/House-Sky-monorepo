import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Search, Bell, LogOut, Menu, ChevronRight, Plus, Building2, Users, MapPin, ScanText, Home, Link2, ShieldCheck, KeyRound } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ChangePasswordModal } from '../common/ChangePasswordModal';
import api from '../../services/api';

const ROLE_LABEL: Record<string, string> = {
  ADMIN: 'Super Admin',
  DIRECTOR: 'Director',
  MANAGER: 'Manager',
  AGENT: 'Agent',
  EMPLOYEE: 'Employee'
};

const ROUTE_NAMES: Record<string, string> = {
  '/dashboard': 'Executive Dashboard',
  '/inquiries': 'Customer Inquiries & Leads',
  '/projects': 'Real Estate Projects',
  '/properties': 'Property Listings',
  '/plots': 'Plot Inventory',
  '/plot-maps': 'Plot Map Canvas',
  '/ocr-analyzer': 'Naksha AI Analyzer',
  '/employees': 'Employees & Agents',
  '/invite': 'Invite Agents',
  '/kyc': 'My KYC',
  '/kyc-review': 'KYC Approvals',
  '/mlm-tree': 'Downline MLM Tree',
  '/commissions': 'Commissions Ledger',
  '/payouts': 'Payout Requests',
  '/reports': 'Financial Reports',
  '/ai-knowledge': 'AI Knowledge Base',
  '/notifications': 'Notifications Center',
  '/cities': 'Cities & Locations',
  '/settings': 'System Settings',
  '/bookings': 'Bookings',
  '/agent': 'Agent Home',
  '/agent/plots': 'Plot Availability',
  '/agent/booking': 'Booking Form',
  '/agent/team-sales': 'Plots Sold by Team',
  '/agent/collection': 'Collection from Team',
  '/agent/yearly-plan': 'Yearly Plan',
  '/agent/commission': 'My Commission',
  '/agent/members': 'My Members',
  '/agent/estimate': 'Estimate',
  '/agent/receipt': 'Customer Receipt',
  '/agent/cancel': 'Cancel Plot',
  '/agent/customer-docs': 'Customer Documents',
  '/agent/search': 'Search Executive',
  '/agent/profile': 'My Profile',
  '/agent/bank': 'My Bank Info',
  '/agent/id-card': 'ID Card',
  '/agent/password': 'Reset Password'
};

interface HeaderProps {
  onToggleMobileMenu?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onToggleMobileMenu }) => {
  const { user, employee, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    let active = true;
    api.get('/notifications/unread-count')
      .then((res) => {
        if (!active) return;
        const count = Number(res.data?.count || 0);
        setUnreadCount(Number.isFinite(count) ? count : 0);
      })
      .catch(() => {
        if (active) setUnreadCount(0);
      });
    return () => { active = false; };
  }, [location.pathname]);

  const currentRouteName = ROUTE_NAMES[location.pathname] || 'Dashboard';
  const roleDisplay = user ? (ROLE_LABEL[user.role] || user.role) : 'Super Admin';
  const rankDisplay = employee?.currentRank ? ` • ${employee.currentRank}` : '';

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="h-16 bg-white/95 backdrop-blur-md border-b border-[#0B4F3C]/10 px-4 md:px-6 flex items-center justify-between sticky top-0 z-20 shadow-xs">
      {/* Left: Mobile Toggle & Dynamic Breadcrumb */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleMobileMenu}
          className="p-2 rounded-xl bg-[#E8F0EC] border border-[#0B4F3C]/20 text-[#0B4F3C] hover:bg-[#0B4F3C] hover:text-white transition-colors md:hidden cursor-pointer"
          title="Toggle Navigation Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="hidden sm:flex items-center gap-2 text-xs font-medium text-[#171A18]/60">
          <img
            src="/logo.png"
            alt="House & Sky"
            className="h-8 w-auto max-w-[140px] object-contain"
          />
          <ChevronRight className="w-3.5 h-3.5 opacity-40" />
          <span className="text-[#0B4F3C] font-bold text-sm font-serif">{currentRouteName}</span>
        </div>
      </div>

      {/* Center Search Input */}
      <div className="hidden lg:block relative w-72">
        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#171A18]/40" />
        <input
          type="text"
          placeholder="Search plots, agents, projects..."
          className="w-full bg-[#FDFCF0] border border-[#0B4F3C]/15 rounded-xl pl-9 pr-4 py-1.5 text-xs text-[#171A18] placeholder-[#171A18]/40 focus:outline-none focus:border-[#0B4F3C] focus:bg-white transition-all"
        />
      </div>

      {/* Right Actions Bar */}
      <div className="flex items-center gap-3">
        <a
          href={typeof window !== 'undefined' && window.location.hostname === 'localhost' ? 'http://localhost:3000' : '/'}
          target="_blank"
          rel="noreferrer"
          className="p-2 rounded-xl bg-[#E8F0EC] border border-[#0B4F3C]/15 text-[#0B4F3C] hover:bg-[#0B4F3C] hover:text-white transition-colors"
          title="Open landing page"
        >
          <Home className="w-4.5 h-4.5" />
        </a>
        {/* Quick Action Button Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowQuickActions(!showQuickActions)}
            className="px-3 py-1.5 rounded-xl bg-[#0B4F3C] text-white font-bold text-xs shadow-xs flex items-center gap-1.5 hover:bg-[#083D2E] transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Quick Action</span>
          </button>

          {showQuickActions && (
            <div className="absolute right-0 mt-2 w-56 bg-white border border-[#0B4F3C]/15 rounded-2xl shadow-xl z-50 p-2 space-y-1 animate-in fade-in zoom-in-95 duration-150">
              <p className="px-3 py-1 text-[10px] font-extrabold text-[#0B4F3C] uppercase tracking-wider">Fast Navigation & Tasks</p>
              <button
                onClick={() => { navigate('/projects'); setShowQuickActions(false); }}
                className="w-full px-3 py-2 rounded-xl text-xs font-bold text-left flex items-center gap-2 hover:bg-[#E8F0EC] text-[#171A18] cursor-pointer"
              >
                <Building2 className="w-4 h-4 text-[#0B4F3C]" /> Create New Project
              </button>
              <button
                onClick={() => { navigate('/properties'); setShowQuickActions(false); }}
                className="w-full px-3 py-2 rounded-xl text-xs font-bold text-left flex items-center gap-2 hover:bg-[#E8F0EC] text-[#171A18] cursor-pointer"
              >
                <Home className="w-4 h-4 text-[#0B4F3C]" /> Create Property Listing
              </button>
              <button
                onClick={() => { navigate('/employees'); setShowQuickActions(false); }}
                className="w-full px-3 py-2 rounded-xl text-xs font-bold text-left flex items-center gap-2 hover:bg-[#E8F0EC] text-[#171A18] cursor-pointer"
              >
                <Users className="w-4 h-4 text-[#0B4F3C]" /> Onboard Agent / Employee
              </button>
              <button
                onClick={() => { navigate('/invite'); setShowQuickActions(false); }}
                className="w-full px-3 py-2 rounded-xl text-xs font-bold text-left flex items-center gap-2 hover:bg-[#E8F0EC] text-[#171A18] cursor-pointer"
              >
                <Link2 className="w-4 h-4 text-[#0B4F3C]" /> Copy agent invite link
              </button>
              <button
                onClick={() => { navigate('/kyc'); setShowQuickActions(false); }}
                className="w-full px-3 py-2 rounded-xl text-xs font-bold text-left flex items-center gap-2 hover:bg-[#E8F0EC] text-[#171A18] cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4 text-[#0B4F3C]" /> Complete My KYC
              </button>
              <button
                onClick={() => { navigate('/plots'); setShowQuickActions(false); }}
                className="w-full px-3 py-2 rounded-xl text-xs font-bold text-left flex items-center gap-2 hover:bg-[#E8F0EC] text-[#171A18] cursor-pointer"
              >
                <MapPin className="w-4 h-4 text-[#0B4F3C]" /> Plot Inventory & Naksa
              </button>
              <button
                onClick={() => { navigate('/ocr-analyzer'); setShowQuickActions(false); }}
                className="w-full px-3 py-2 rounded-xl text-xs font-bold text-left flex items-center gap-2 hover:bg-[#E8F0EC] text-[#171A18] cursor-pointer"
              >
                <ScanText className="w-4 h-4 text-emerald-600" /> Naksa AI OCR Scanner
              </button>
            </div>
          )}
        </div>

        {/* Notifications Icon */}
        <button
          onClick={() => navigate('/notifications')}
          className="relative p-2 rounded-xl bg-[#FDFCF0] border border-[#0B4F3C]/15 text-[#0B4F3C] hover:bg-[#E8F0EC] transition-colors cursor-pointer"
          title="Notifications"
        >
          <Bell className="w-4.5 h-4.5" />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#0B4F3C]"></span>
          )}
        </button>

        {/* Profile Avatar & Unified Title Subtext */}
        <div className="flex items-center gap-2.5 pl-3 border-l border-[#0B4F3C]/10">
          <div className="w-9 h-9 rounded-full bg-[#0B4F3C] text-white flex items-center justify-center font-bold text-sm shadow-xs border border-emerald-400/30">
            {user ? user.fullName.charAt(0) : 'A'}
          </div>
          <div className="hidden md:block text-left">
            <p className="text-xs font-bold text-[#171A18] leading-tight">{user ? user.fullName : 'Ankit Kumar'}</p>
            <p className="text-[10px] text-[#0B4F3C] font-semibold mt-0.5">{roleDisplay}{rankDisplay}</p>
          </div>
          <button
            onClick={() => setShowChangePassword(true)}
            title="Change Password"
            className="p-1.5 text-[#171A18]/40 hover:text-[#0B4F3C] transition-colors cursor-pointer ml-1"
          >
            <KeyRound className="w-4 h-4" />
          </button>
          <button
            onClick={handleLogout}
            title="Logout"
            className="p-1.5 text-[#171A18]/40 hover:text-red-600 transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {showChangePassword && <ChangePasswordModal onClose={() => setShowChangePassword(false)} />}
    </header>
  );
};
