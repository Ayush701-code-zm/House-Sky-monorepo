import React, { useEffect, useState, useCallback } from 'react';
import api from '../services/api';
import {
  Bell,
  MessageSquare,
  Mail,
  RefreshCw,
  CheckCheck,
  PackageSearch,
  Home,
  Users,
  ShieldCheck,
  Inbox,
  TrendingUp,
  Award
} from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { formatDate } from '../utils/formatters';

interface BackendNotification {
  _id: string;
  title: string;
  message: string;
  category: 'SYSTEM' | 'BULK_DEAL' | 'INQUIRY' | 'PROPERTY' | 'AGENT' | 'COMMISSION';
  channel: 'IN_APP' | 'EMAIL' | 'WHATSAPP';
  status: 'UNREAD' | 'READ' | 'SENT' | 'FAILED';
  meta?: Record<string, any>;
  sentAt: string;
  userId?: any;
}

type FilterTab = 'ALL' | 'UNREAD' | 'BULK_DEAL' | 'PROPERTY' | 'INQUIRY' | 'AGENT' | 'COMMISSION' | 'SYSTEM';

const FILTER_TABS: { id: FilterTab; label: string }[] = [
  { id: 'ALL', label: 'All' },
  { id: 'UNREAD', label: 'Unread' },
  { id: 'BULK_DEAL', label: 'Bulk Deals' },
  { id: 'PROPERTY', label: 'Properties' },
  { id: 'INQUIRY', label: 'Inquiries' },
  { id: 'AGENT', label: 'Agents' },
  { id: 'COMMISSION', label: 'Commission' },
  { id: 'SYSTEM', label: 'System' },
];

const CATEGORY_ICON: Record<string, React.ReactNode> = {
  BULK_DEAL:  <PackageSearch className="w-4 h-4" />,
  PROPERTY:   <Home className="w-4 h-4" />,
  INQUIRY:    <MessageSquare className="w-4 h-4" />,
  AGENT:      <Users className="w-4 h-4" />,
  COMMISSION: <Award className="w-4 h-4" />,
  SYSTEM:     <Bell className="w-4 h-4" />,
};

const CATEGORY_COLOR: Record<string, string> = {
  BULK_DEAL:  'bg-amber-500 text-white',
  PROPERTY:   'bg-sky-600 text-white',
  INQUIRY:    'bg-emerald-600 text-white',
  AGENT:      'bg-purple-600 text-white',
  COMMISSION: 'bg-[#0B4F3C] text-white',
  SYSTEM:     'bg-slate-600 text-white',
};

const CATEGORY_BADGE: Record<string, string> = {
  BULK_DEAL:  'bg-amber-100 text-amber-800 border-amber-300',
  PROPERTY:   'bg-sky-100 text-sky-800 border-sky-300',
  INQUIRY:    'bg-emerald-100 text-emerald-800 border-emerald-300',
  AGENT:      'bg-purple-100 text-purple-800 border-purple-300',
  COMMISSION: 'bg-[#E8F0EC] text-[#0B4F3C] border-[#0B4F3C]/30',
  SYSTEM:     'bg-slate-100 text-slate-700 border-slate-300',
};

export const NotificationsPage: React.FC = () => {
  const toast = useToast();
  const [notifications, setNotifications] = useState<BackendNotification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<FilterTab>('ALL');

  const fetchNotifications = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/notifications', { params: { limit: 200 } });
      setNotifications(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      console.error('Failed to load notifications', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchNotifications(); }, [fetchNotifications]);

  const markRead = async (id: string) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => n._id === id ? { ...n, status: 'READ' } : n)
      );
    } catch (e) {
      // silent
    }
  };

  const markAllRead = async () => {
    try {
      await api.put('/notifications/mark-all-read');
      setNotifications((prev) => prev.map((n) => ({ ...n, status: 'READ' })));
      toast.success('All notifications marked as read');
    } catch (e: any) {
      toast.error(e?.friendlyMessage || 'Failed to mark all read');
    }
  };

  // Filtering
  const filtered = notifications.filter((n) => {
    if (activeTab === 'ALL') return true;
    if (activeTab === 'UNREAD') return n.status === 'UNREAD';
    return n.category === activeTab;
  });

  const unreadCount = notifications.filter((n) => n.status === 'UNREAD').length;

  // Category counts
  const getCategoryCount = (cat: string) =>
    cat === 'UNREAD'
      ? unreadCount
      : cat === 'ALL'
      ? notifications.length
      : notifications.filter((n) => n.category === cat).length;

  // KPI counts
  const bulkCount     = notifications.filter((n) => n.category === 'BULK_DEAL'  && n.status === 'UNREAD').length;
  const propCount     = notifications.filter((n) => n.category === 'PROPERTY'   && n.status === 'UNREAD').length;
  const inquiryCount  = notifications.filter((n) => n.category === 'INQUIRY'    && n.status === 'UNREAD').length;
  const agentCount    = notifications.filter((n) => n.category === 'AGENT'      && n.status === 'UNREAD').length;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-serif font-bold text-[#171A18]">Activity & Notifications</h2>
            {unreadCount > 0 && (
              <span className="px-2.5 py-0.5 bg-red-500 text-white text-[11px] font-extrabold rounded-full animate-pulse">
                {unreadCount} new
              </span>
            )}
          </div>
          <p className="text-xs text-[#171A18]/70 mt-1">
            Real-time alerts — bulk deal requests, property submissions, inquiries & agent signups
          </p>
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              className="px-3.5 py-2 rounded-xl bg-[#E8F0EC] border border-[#0B4F3C]/20 text-[#0B4F3C] text-xs font-bold hover:bg-[#0B4F3C] hover:text-white transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <CheckCheck className="w-4 h-4" /> Mark All Read
            </button>
          )}
          <button
            onClick={fetchNotifications}
            className="p-2.5 rounded-xl bg-[#E8F0EC] border border-[#0B4F3C]/20 text-[#0B4F3C] hover:bg-[#0B4F3C] hover:text-white transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Bulk Deal Requests',    count: bulkCount,    icon: <PackageSearch className="w-4 h-4" />, color: 'bg-amber-500',   border: 'border-amber-200' },
          { label: 'Property Submissions',  count: propCount,    icon: <Home className="w-4 h-4" />,          color: 'bg-sky-600',     border: 'border-sky-200' },
          { label: 'New Inquiries',         count: inquiryCount, icon: <MessageSquare className="w-4 h-4" />, color: 'bg-emerald-600', border: 'border-emerald-200' },
          { label: 'Agent Applications',    count: agentCount,   icon: <Users className="w-4 h-4" />,         color: 'bg-purple-600',  border: 'border-purple-200' },
        ].map((kpi) => (
          <div key={kpi.label} className={`bg-white p-3 rounded-2xl border ${kpi.border} flex items-center gap-3 shadow-sm`}>
            <div className={`w-9 h-9 rounded-xl ${kpi.color} text-white flex items-center justify-center shrink-0`}>
              {kpi.icon}
            </div>
            <div>
              <p className="text-[10px] font-bold text-[#171A18]/60 uppercase leading-none">{kpi.label}</p>
              <p className="text-lg font-extrabold text-[#171A18] mt-0.5">
                {kpi.count > 0 ? <span className="text-red-600">{kpi.count} unread</span> : '0 new'}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1 bg-[#E8F0EC]/60 rounded-xl p-1 border border-[#0B4F3C]/10 flex-wrap">
        {FILTER_TABS.map((tab) => {
          const count = getCategoryCount(tab.id);
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3.5 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1 ${
                activeTab === tab.id ? 'bg-[#0B4F3C] text-white shadow-sm' : 'text-[#171A18]/60 hover:text-[#171A18]'
              }`}
            >
              {tab.label}
              {count > 0 && (
                <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-extrabold ${
                  activeTab === tab.id ? 'bg-white/25 text-white' : 'bg-[#0B4F3C]/10 text-[#0B4F3C]'
                }`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Notifications Feed */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-16 bg-[#E8F0EC]/40 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-[#0B4F3C]/15 text-center space-y-3 shadow-sm">
          <Inbox className="w-10 h-10 text-[#0B4F3C]/30 mx-auto" />
          <p className="font-bold text-[#171A18]/60">No notifications here yet</p>
          <p className="text-[11px] text-[#171A18]/40">
            New events from bulk deal requests, property submissions, customer inquiries & agent signups will appear here automatically.
          </p>
        </div>
      ) : (
        <div className="bg-white border border-[#0B4F3C]/15 rounded-2xl shadow-sm overflow-hidden divide-y divide-[#0B4F3C]/08">
          {filtered.map((notif) => {
            const isUnread = notif.status === 'UNREAD';
            return (
              <div
                key={notif._id}
                className={`flex items-start gap-4 px-5 py-4 transition-colors ${isUnread ? 'bg-[#E8F0EC]/25' : 'hover:bg-[#FDFCF0]'}`}
              >
                {/* Category icon */}
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shadow-sm shrink-0 ${CATEGORY_COLOR[notif.category] || 'bg-slate-600 text-white'}`}>
                  {CATEGORY_ICON[notif.category] || <Bell className="w-4 h-4" />}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className={`text-sm leading-snug text-[#171A18] ${isUnread ? 'font-bold' : 'font-semibold'}`}>
                      {notif.title}
                      {isUnread && (
                        <span className="ml-2 inline-block w-2 h-2 rounded-full bg-red-500 align-middle" />
                      )}
                    </p>
                    <span className="text-[10px] text-[#171A18]/50 font-mono shrink-0 whitespace-nowrap">
                      {formatDate(notif.sentAt, { includeTime: true, fallback: '—' })}
                    </span>
                  </div>
                  <p className="text-xs text-[#171A18]/60 mt-0.5 truncate">{notif.message}</p>

                  {/* Tags row */}
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full border ${CATEGORY_BADGE[notif.category] || ''}`}>
                      {notif.category.replace('_', ' ')}
                    </span>
                    {notif.channel !== 'IN_APP' && (
                      <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded-full bg-[#E8F0EC] text-[#0B4F3C] border border-[#0B4F3C]/20">
                        via {notif.channel}
                      </span>
                    )}
                    {isUnread && (
                      <button
                        onClick={() => markRead(notif._id)}
                        className="text-[10px] text-[#0B4F3C] font-bold hover:underline cursor-pointer ml-auto"
                      >
                        Mark read ✓
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default NotificationsPage;
