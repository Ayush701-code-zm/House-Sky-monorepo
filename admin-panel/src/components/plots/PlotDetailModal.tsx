import React, { useState } from 'react';
import { Plot, Employee } from '../../types';
import { X, UserCheck, ShoppingBag, CreditCard, User, Phone, Mail, Calendar, Clock, Plus, Trash2 } from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { DraftNotice } from '../common/DraftNotice';
import { mergeDraft, usePersistDraft } from '../../utils/useFormDraft';

const SQFT_PER_SQ_YRD = 9;

interface PlotDetailModalProps {
  plot: Plot;
  employees: Employee[];
  onClose: () => void;
  onSuccess: () => void;
}

export const PlotDetailModal: React.FC<PlotDetailModalProps> = ({
  plot,
  employees,
  onClose,
  onSuccess
}) => {
  const { employee: loggedInEmployee } = useAuth();
  const toast = useToast();
  const draftKey = `hs-admin-plot-${plot._id}`;
  const baseline = {
    status: plot.status,
    ownerName: plot.ownerName || '',
    ownerPhone: plot.ownerPhone || '',
    ownerEmail: plot.ownerEmail || '',
    paidAmount: plot.paidAmount || 0,
    registryStatus: (plot.registryStatus || 'NOT_REGISTERED') as 'NOT_REGISTERED' | 'PENDING' | 'REGISTERED',
    registryDate: plot.registryDate ? new Date(plot.registryDate).toISOString().split('T')[0] : '',
    paymentMilestones: plot.paymentMilestones || [],
    mTitle: '',
    mAmount: '',
    mDueDate: '',
    sellerEmployeeId: plot.sellerEmployeeId
      ? (typeof plot.sellerEmployeeId === 'string' ? plot.sellerEmployeeId : plot.sellerEmployeeId._id)
      : (loggedInEmployee ? loggedInEmployee.id : 'DIRECT'),
    paymentMode: 'NET_BANKING',
    plc12mtr: plot.plc12mtr || 0,
    plcCorner: plot.plcCorner || 0,
    plcParkFacing: plot.plcParkFacing || 0,
    plotType: plot.plotType || 'SIMPLE',
    facing: plot.facing || '',
    dimensions: plot.dimensions || '',
    superBuiltUpSqft: plot.superBuiltUpSqft || 0,
    plotNo: plot.plotNo || '',
    block: plot.block || '',
    sellableSqYrd: plot.sellableSqYrd || 0,
  };
  const [boot] = useState(() => mergeDraft(draftKey, baseline));
  const initial = boot.value;
  const [draftRestored, setDraftRestored] = useState(boot.restored);

  const [status, setStatus] = useState<string>(initial.status);
  const [ownerName, setOwnerName] = useState<string>(initial.ownerName);
  const [ownerPhone, setOwnerPhone] = useState<string>(initial.ownerPhone);
  const [ownerEmail, setOwnerEmail] = useState<string>(initial.ownerEmail);
  const [paidAmount, setPaidAmount] = useState<number>(initial.paidAmount);
  const [registryStatus, setRegistryStatus] = useState<'NOT_REGISTERED' | 'PENDING' | 'REGISTERED'>(initial.registryStatus);
  const [registryDate, setRegistryDate] = useState<string>(initial.registryDate);
  const [paymentMilestones, setPaymentMilestones] = useState<any[]>(initial.paymentMilestones);
  const [mTitle, setMTitle] = useState(initial.mTitle);
  const [mAmount, setMAmount] = useState(initial.mAmount);
  const [mDueDate, setMDueDate] = useState(initial.mDueDate);
  const [sellerEmployeeId, setSellerEmployeeId] = useState<string>(initial.sellerEmployeeId);
  const [paymentMode, setPaymentMode] = useState<string>(initial.paymentMode);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [plc12mtr, setPlc12mtr] = useState<number>(initial.plc12mtr);
  const [plcCorner, setPlcCorner] = useState<number>(initial.plcCorner);
  const [plcParkFacing, setPlcParkFacing] = useState<number>(initial.plcParkFacing);
  const [plotType, setPlotType] = useState<string>(initial.plotType);
  const [facing, setFacing] = useState<string>(initial.facing);
  const [dimensions, setDimensions] = useState<string>(initial.dimensions);
  const [superBuiltUpSqft, setSuperBuiltUpSqft] = useState<number>(initial.superBuiltUpSqft);
  const [plotNo, setPlotNo] = useState<string>(initial.plotNo);
  const [block, setBlock] = useState<string>(initial.block);
  const [sellableSqYrd, setSellableSqYrd] = useState<number>(initial.sellableSqYrd);
  const clearPlotDraft = usePersistDraft(draftKey, {
    status, ownerName, ownerPhone, ownerEmail, paidAmount, registryStatus, registryDate,
    paymentMilestones, mTitle, mAmount, mDueDate, sellerEmployeeId, paymentMode,
    plc12mtr, plcCorner, plcParkFacing, plotType, facing, dimensions, superBuiltUpSqft,
    plotNo, block, sellableSqYrd,
  }, baseline);

  // IMPORTANT: plot.totalCost is already authoritative — computed by the
  // pricingEngine and persisted by the Mongoose pre-save hook. We must NOT
  // recalculate it client-side (different units: engine uses per-sq-yard rates,
  // not basePricePerSqft × sizeSqft). Just read from the DB field.
  const totalCost = plot.totalCost || plot.price || 0;
  const dueBalance = Math.max(0, totalCost - paidAmount);

  const handleAddMilestone = () => {
    if (!mTitle || !mAmount || !mDueDate) {
      toast.error('Please enter Title, Amount, and Due Date for the milestone.');
      return;
    }
    const newM = {
      title: mTitle,
      amount: Number(mAmount),
      dueDate: new Date(mDueDate),
      status: 'PENDING',
      paymentMode: 'NET_BANKING'
    };
    setPaymentMilestones([...paymentMilestones, newM]);
    setMTitle('');
    setMAmount('');
    setMDueDate('');
    toast.success(`Added installment milestone "${mTitle}"`);
  };

  const handleRemoveMilestone = (idx: number) => {
    const removed = paymentMilestones[idx];
    setPaymentMilestones(paymentMilestones.filter((_, i) => i !== idx));
    toast.info(`Removed milestone "${removed.title}"`);
  };

  const handleToggleMilestoneStatus = (idx: number) => {
    const updated = [...paymentMilestones];
    updated[idx].status = updated[idx].status === 'RECEIVED' ? 'PENDING' : 'RECEIVED';
    setPaymentMilestones(updated);
    toast.success(`Milestone "${updated[idx].title}" status toggled to ${updated[idx].status}`);
  };

  const handleInventoryCorrection = async () => {
    try {
      setIsSubmitting(true);
      await api.put(`/plots/${plot._id}/status`, {
        status,
        inventoryOnly: true,
        plotNo,
        block,
        sellableSqYrd,
        sizeSqft: sellableSqYrd > 0 ? Number((sellableSqYrd * SQFT_PER_SQ_YRD).toFixed(2)) : plot.sizeSqft,
        dimensions
      });
      clearPlotDraft();
      toast.success(`Plot ${plotNo || plot.plotNo} inventory corrected`);
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error(error);
      toast.error(error.response?.data?.message || 'Failed to correct plot inventory');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateStatus = async () => {
    try {
      setIsSubmitting(true);
      await api.put(`/plots/${plot._id}/status`, {
        status,
        ownerName,
        ownerPhone,
        ownerEmail,
        paidAmount,
        registryStatus,
        registryDate: registryDate ? new Date(registryDate) : undefined,
        paymentMilestones,
        // Send 'DIRECT' explicitly: the backend treats a null seller as "credit the
        // logged-in user", which would wrongly create commission for a direct sale.
        sellerEmployeeId: sellerEmployeeId === 'DIRECT' ? 'DIRECT' : (sellerEmployeeId || null),
        paymentMode,
        plotType,
        facing,
        dimensions,
        superBuiltUpSqft
      });

      clearPlotDraft();
      toast.success(`Plot ${plot.plotNo} status updated successfully!`);
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error(error);
      toast.error(error.response?.data?.message || 'Failed to update plot status');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white border border-[#0B4F3C]/20 w-full max-w-xl rounded-3xl p-6 space-y-6 shadow-2xl overflow-y-auto max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#0B4F3C]/15 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xl font-serif font-bold text-[#171A18]">Plot {plot.plotNo}</h3>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                plot.status === 'AVAILABLE' ? 'bg-emerald-500/20 text-emerald-800 border-emerald-500/30' :
                plot.status === 'BOOKED' ? 'bg-sky-500/20 text-sky-800 border-sky-500/30' :
                plot.status === 'PENDING' ? 'bg-amber-500/20 text-amber-800 border-amber-500/30' :
                'bg-red-500/20 text-red-800 border-red-500/30'
              }`}>
                {plot.status}
              </span>
            </div>
            <p className="text-xs text-[#171A18]/70 mt-1">Block {plot.block} • {plot.sizeSqft} sq.ft</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl bg-[#E8F0EC] text-[#0B4F3C] hover:bg-[#0B4F3C] hover:text-white transition-colors cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>
        {draftRestored && (
          <DraftNotice onDiscard={() => {
            clearPlotDraft();
            setStatus(baseline.status);
            setOwnerName(baseline.ownerName);
            setOwnerPhone(baseline.ownerPhone);
            setOwnerEmail(baseline.ownerEmail);
            setPaidAmount(baseline.paidAmount);
            setRegistryStatus(baseline.registryStatus);
            setRegistryDate(baseline.registryDate);
            setPaymentMilestones(baseline.paymentMilestones);
            setMTitle(baseline.mTitle);
            setMAmount(baseline.mAmount);
            setMDueDate(baseline.mDueDate);
            setSellerEmployeeId(baseline.sellerEmployeeId);
            setPaymentMode(baseline.paymentMode);
            setPlc12mtr(baseline.plc12mtr);
            setPlcCorner(baseline.plcCorner);
            setPlcParkFacing(baseline.plcParkFacing);
            setPlotType(baseline.plotType);
            setFacing(baseline.facing);
            setDimensions(baseline.dimensions);
            setSuperBuiltUpSqft(baseline.superBuiltUpSqft);
            setPlotNo(baseline.plotNo);
            setBlock(baseline.block);
            setSellableSqYrd(baseline.sellableSqYrd);
            setDraftRestored(false);
          }} />
        )}

        {/* Pricing Details */}
        <div className="bg-[#E8F0EC] p-4 rounded-2xl border border-[#0B4F3C]/20 flex items-center justify-between">
          <div>
            <p className="text-xs text-[#171A18]/70 font-semibold">Plot Total Cost</p>
            <h4 className="text-2xl font-serif font-bold text-[#0B4F3C] mt-0.5">₹{totalCost.toLocaleString('en-IN')}</h4>
          </div>
          <div className="text-right">
            <p className="text-xs text-[#171A18]/70 font-semibold">Rate / Sqft</p>
            <p className="text-sm font-bold text-[#171A18] mt-0.5">₹{Math.round(totalCost / plot.sizeSqft)}</p>
          </div>
        </div>

        {/* Purchaser Info Display */}
        {plot.status !== 'AVAILABLE' && (plot.ownerName || plot.ownerPhone || plot.ownerEmail) && (
          <div className="p-4 rounded-2xl bg-white border border-[#0B4F3C]/15 space-y-2.5 shadow-sm">
            <h5 className="font-bold text-[#0B4F3C] flex items-center gap-2 text-xs">
              <UserCheck className="w-4 h-4 text-[#0B4F3C]" /> Purchaser / Owner Information:
            </h5>
            <div className="grid grid-cols-2 gap-2 text-[11px] text-[#171A18]">
              <div>
                <span className="block text-[10px] uppercase font-bold text-[#171A18]/60">Name</span>
                <span className="font-bold flex items-center gap-1">
                  <User className="w-3 h-3 text-[#0B4F3C]" /> {plot.ownerName || 'N/A'}
                </span>
              </div>
              <div>
                <span className="block text-[10px] uppercase font-bold text-[#171A18]/60">Phone</span>
                <span className="font-bold flex items-center gap-1">
                  <Phone className="w-3 h-3 text-[#0B4F3C]" /> {plot.ownerPhone || 'N/A'}
                </span>
              </div>
              <div className="col-span-2">
                <span className="block text-[10px] uppercase font-bold text-[#171A18]/60">Email</span>
                <span className="font-bold flex items-center gap-1">
                  <Mail className="w-3 h-3 text-[#0B4F3C]" /> {plot.ownerEmail || 'N/A'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Part Payment & Balance Summary Card */}
        {status !== 'AVAILABLE' && (
          <div className="p-4 rounded-2xl bg-[#FDFCF0] border border-[#0B4F3C]/15 space-y-3">
            <div className="flex items-center justify-between">
              <h5 className="font-bold text-[#171A18] flex items-center gap-2 text-xs">
                <CreditCard className="w-4 h-4 text-[#0B4F3C]" /> Part Payment & Dues Summary
              </h5>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#E8F0EC] text-[#0B4F3C] border border-[#0B4F3C]/20">
                {Math.round((paidAmount / (totalCost || 1)) * 100)}% Paid
              </span>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-[#E8F0EC] h-2.5 rounded-full overflow-hidden border border-[#0B4F3C]/20">
              <div 
                className="bg-[#0B4F3C] h-full transition-all duration-300"
                style={{ width: `${Math.min(100, (paidAmount / (totalCost || 1)) * 100)}%` }}
              />
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs pt-1">
              <div className="bg-white p-2.5 rounded-xl border border-[#0B4F3C]/15">
                <span className="text-[#171A18]/70 text-[10px] block">Advance / Paid Amount</span>
                <span className="text-[#0B4F3C] font-extrabold text-sm">₹{paidAmount.toLocaleString('en-IN')}</span>
              </div>
              <div className="bg-white p-2.5 rounded-xl border border-[#0B4F3C]/15">
                <span className="text-[#171A18]/70 text-[10px] block">Remaining Due Balance</span>
                <span className="text-red-600 font-extrabold text-sm">₹{dueBalance.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-3 text-xs p-4 rounded-2xl bg-[#FDFCF0] border border-[#0B4F3C]/15">
          <h4 className="font-bold text-[#0B4F3C] uppercase tracking-wider">Inventory correction (no commission)</h4>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="text-[#171A18]/70 font-semibold">Plot No</label>
              <input
                type="text"
                value={plotNo}
                onChange={(e) => setPlotNo(e.target.value)}
                className="w-full mt-1 bg-white border border-[#0B4F3C]/20 rounded-xl px-3 py-2 text-[#171A18] font-bold focus:outline-none focus:border-[#0B4F3C]"
              />
            </div>
            <div>
              <label className="text-[#171A18]/70 font-semibold">Block</label>
              <input
                type="text"
                value={block}
                onChange={(e) => setBlock(e.target.value)}
                className="w-full mt-1 bg-white border border-[#0B4F3C]/20 rounded-xl px-3 py-2 text-[#171A18] font-bold focus:outline-none focus:border-[#0B4F3C]"
              />
            </div>
            <div>
              <label className="text-[#171A18]/70 font-semibold">Sq. Yrd</label>
              <input
                type="number"
                value={sellableSqYrd}
                onChange={(e) => setSellableSqYrd(Number(e.target.value))}
                className="w-full mt-1 bg-white border border-[#0B4F3C]/20 rounded-xl px-3 py-2 text-[#171A18] font-bold focus:outline-none focus:border-[#0B4F3C]"
              />
            </div>
          </div>
          <button
            type="button"
            disabled={isSubmitting}
            onClick={handleInventoryCorrection}
            className="w-full py-2 rounded-xl bg-[#0B4F3C] text-white font-bold disabled:opacity-50"
          >
            Save inventory correction
          </button>
        </div>

        {/* Status & Booking Form */}
        <div className="space-y-4 text-xs">
          <h4 className="font-bold text-[#0B4F3C] uppercase tracking-wider flex items-center gap-2">
            <ShoppingBag className="w-4 h-4 text-[#0B4F3C]" /> Plot Status & Customer Details
          </h4>
          
          <div>
            <label className="text-[#171A18]/70 font-semibold">Plot Status Action</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full mt-1 bg-[#FDFCF0] border border-[#0B4F3C]/20 rounded-xl px-3 py-2 text-[#171A18] font-bold focus:outline-none focus:border-[#0B4F3C]"
            >
              <option value="AVAILABLE">AVAILABLE (Green)</option>
              <option value="BOOKED">BOOKED (Yellow)</option>
              <option value="PENDING">PENDING (Yellow)</option>
              <option value="SOLD">SOLD (Red — triggers commission)</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[#171A18]/70 font-semibold">Plot Type</label>
              <select
                value={plotType}
                onChange={(e) => setPlotType(e.target.value)}
                className="w-full mt-1 bg-[#FDFCF0] border border-[#0B4F3C]/20 rounded-xl px-3 py-2 text-[#171A18] font-bold focus:outline-none focus:border-[#0B4F3C]"
              >
                <option value="SIMPLE">Simple</option>
                <option value="CORNER">Corner</option>
                <option value="PARK_FACING">Park Facing</option>
                <option value="GARDEN_FACING">Garden Facing</option>
                <option value="ROAD_FACING">Road Facing</option>
              </select>
            </div>
            <div>
              <label className="text-[#171A18]/70 font-semibold">Facing</label>
              <input
                type="text"
                placeholder="Garden / Park / East..."
                value={facing}
                onChange={(e) => setFacing(e.target.value)}
                className="w-full mt-1 bg-[#FDFCF0] border border-[#0B4F3C]/20 rounded-xl px-3 py-2 text-[#171A18] font-bold focus:outline-none focus:border-[#0B4F3C]"
              />
            </div>
            <div>
              <label className="text-[#171A18]/70 font-semibold">Dimensions</label>
              <input
                type="text"
                placeholder="e.g. 30x50"
                value={dimensions}
                onChange={(e) => setDimensions(e.target.value)}
                className="w-full mt-1 bg-[#FDFCF0] border border-[#0B4F3C]/20 rounded-xl px-3 py-2 text-[#171A18] font-bold focus:outline-none focus:border-[#0B4F3C]"
              />
            </div>
            <div>
              <label className="text-[#171A18]/70 font-semibold">Super Built-up (sqft)</label>
              <input
                type="number"
                value={superBuiltUpSqft}
                onChange={(e) => setSuperBuiltUpSqft(Number(e.target.value))}
                className="w-full mt-1 bg-[#FDFCF0] border border-[#0B4F3C]/20 rounded-xl px-3 py-2 text-[#171A18] font-bold focus:outline-none focus:border-[#0B4F3C]"
              />
            </div>
          </div>

          <div>
            <label className="text-[#171A18]/70 font-semibold">Buyer / Customer Full Name</label>
            <input
              type="text"
              placeholder="Enter customer name..."
              value={ownerName}
              onChange={(e) => setOwnerName(e.target.value)}
              className="w-full mt-1 bg-[#FDFCF0] border border-[#0B4F3C]/20 rounded-xl px-3 py-2 text-[#171A18] font-bold focus:outline-none focus:border-[#0B4F3C]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[#171A18]/70 font-semibold">Buyer Phone Number</label>
              <input
                type="text"
                placeholder="+91 9876543210"
                value={ownerPhone}
                onChange={(e) => setOwnerPhone(e.target.value)}
                className="w-full mt-1 bg-[#FDFCF0] border border-[#0B4F3C]/20 rounded-xl px-3 py-2 text-[#171A18] font-bold focus:outline-none focus:border-[#0B4F3C]"
              />
            </div>
            <div>
              <label className="text-[#171A18]/70 font-semibold">Buyer Email Address</label>
              <input
                type="email"
                placeholder="customer@singhania.com"
                value={ownerEmail}
                onChange={(e) => setOwnerEmail(e.target.value)}
                className="w-full mt-1 bg-[#FDFCF0] border border-[#0B4F3C]/20 rounded-xl px-3 py-2 text-[#171A18] font-bold focus:outline-none focus:border-[#0B4F3C]"
              />
            </div>
          </div>

          {/* Part Payment & Registry Schedule Controls */}
          {status !== 'AVAILABLE' && (
            <div className="p-4 bg-[#E8F0EC] rounded-2xl border border-[#0B4F3C]/20 space-y-4">
              <h5 className="font-bold text-[#0B4F3C] flex items-center gap-2 text-xs">
                <Calendar className="w-4 h-4 text-[#0B4F3C]" /> Part Payment & Registry Management
              </h5>

              {/* Amount Paid Input & Registry Date */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[#171A18]/70 font-semibold">Total Amount Paid Till Date (₹)</label>
                  <input
                    type="number"
                    placeholder="e.g. 200000"
                    value={paidAmount}
                    onChange={(e) => setPaidAmount(Number(e.target.value))}
                    className="w-full mt-1 bg-white border border-[#0B4F3C]/20 rounded-xl px-3 py-2 text-[#0B4F3C] font-bold focus:outline-none focus:border-[#0B4F3C]"
                  />
                </div>

                <div>
                  <label className="text-[#171A18]/70 font-semibold">Government Registry Status</label>
                  <select
                    value={registryStatus}
                    onChange={(e) => setRegistryStatus(e.target.value as any)}
                    className="w-full mt-1 bg-white border border-[#0B4F3C]/20 rounded-xl px-3 py-2 text-[#171A18] font-bold focus:outline-none focus:border-[#0B4F3C]"
                  >
                    <option value="NOT_REGISTERED">Not Registered</option>
                    <option value="PENDING">Registration Scheduled</option>
                    <option value="REGISTERED">Registry Completed</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[#171A18]/70 font-semibold">Expected Registry Date</label>
                <input
                  type="date"
                  value={registryDate}
                  onChange={(e) => setRegistryDate(e.target.value)}
                  className="w-full mt-1 bg-white border border-[#0B4F3C]/20 rounded-xl px-3 py-2 text-[#171A18] font-bold focus:outline-none focus:border-[#0B4F3C]"
                />
              </div>

              {/* Payment Milestones Schedule */}
              <div className="border-t border-[#0B4F3C]/15 pt-3 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-[#0B4F3C] font-bold flex items-center gap-1.5 text-xs">
                    <Clock className="w-3.5 h-3.5" /> Installment Milestone Schedule
                  </label>
                  <span className="text-[10px] text-[#171A18]/70 font-bold">{paymentMilestones.length} Milestones</span>
                </div>

                {/* List of Milestones */}
                {paymentMilestones.length > 0 ? (
                  <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                    {paymentMilestones.map((m, idx) => (
                      <div key={idx} className="p-2.5 bg-white rounded-xl border border-[#0B4F3C]/15 flex items-center justify-between text-xs">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-[#171A18]">{m.title}</span>
                            <span 
                              onClick={() => handleToggleMilestoneStatus(idx)}
                              className={`cursor-pointer px-2 py-0.5 rounded text-[9px] font-extrabold border ${
                                m.status === 'RECEIVED' 
                                  ? 'bg-emerald-500/20 text-emerald-800 border-emerald-500/30' 
                                  : 'bg-amber-500/20 text-amber-800 border-amber-500/30'
                              }`}
                            >
                              {m.status} (Click to toggle)
                            </span>
                          </div>
                          <p className="text-[10px] text-[#171A18]/70 mt-0.5">
                            Due: {new Date(m.dueDate).toLocaleDateString()}
                          </p>
                        </div>

                        <div className="flex items-center gap-3">
                          <span className="font-extrabold text-[#0B4F3C]">₹{Number(m.amount).toLocaleString('en-IN')}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveMilestone(idx)}
                            className="text-red-600 hover:text-red-800 p-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[11px] text-[#171A18]/70 italic bg-white p-2.5 rounded-xl border border-[#0B4F3C]/15 text-center">
                    No part payment milestones added yet. Add below!
                  </p>
                )}

                {/* Add New Milestone Inputs */}
                <div className="p-3 bg-white rounded-xl border border-[#0B4F3C]/15 space-y-2">
                  <p className="font-bold text-[#0B4F3C] text-[11px]">Add Upcoming Installment / Payment Date:</p>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="e.g. 2nd Installment"
                      value={mTitle}
                      onChange={(e) => setMTitle(e.target.value)}
                      className="bg-[#FDFCF0] border border-[#0B4F3C]/20 rounded-lg px-2.5 py-1.5 text-[#171A18] text-xs focus:outline-none font-bold"
                    />
                    <input
                      type="number"
                      placeholder="Amount (₹)"
                      value={mAmount}
                      onChange={(e) => setMAmount(e.target.value)}
                      className="bg-[#FDFCF0] border border-[#0B4F3C]/20 rounded-lg px-2.5 py-1.5 text-[#171A18] text-xs focus:outline-none font-bold"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="date"
                      value={mDueDate}
                      onChange={(e) => setMDueDate(e.target.value)}
                      className="bg-[#FDFCF0] border border-[#0B4F3C]/20 rounded-lg px-2.5 py-1.5 text-[#171A18] text-xs focus:outline-none font-bold"
                    />
                    <button
                      type="button"
                      onClick={handleAddMilestone}
                      className="py-1.5 bg-[#0B4F3C] hover:bg-[#063B2D] text-white font-bold rounded-lg text-xs flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Milestone
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {status === 'SOLD' && (
            <div className="p-3 bg-[#E8F0EC] rounded-xl border border-[#0B4F3C]/20 space-y-3">
              <p className="font-bold text-[#0B4F3C] text-[11px]">MLM Commission Distribution Settings:</p>

              <div>
                <label className="text-[#171A18]/70 font-semibold">Selling Agent (Defaults to Logged-in Agent)</label>
                <select
                  value={sellerEmployeeId}
                  onChange={(e) => setSellerEmployeeId(e.target.value)}
                  className="w-full mt-1 bg-white border border-[#0B4F3C]/20 rounded-xl px-3 py-2 text-[#171A18] font-bold focus:outline-none focus:border-[#0B4F3C]"
                >
                  <option value="DIRECT">Direct Sale (No Agent / Direct Customer Purchase)</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.userId ? emp.userId.fullName : emp.employeeCode} ({emp.employeeCode} - {emp.currentRank})
                      {loggedInEmployee && emp.id === loggedInEmployee.id ? ' [YOU]' : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[#171A18]/70 font-semibold">Payment Mode</label>
                <select
                  value={paymentMode}
                  onChange={(e) => setPaymentMode(e.target.value)}
                  className="w-full mt-1 bg-white border border-[#0B4F3C]/20 rounded-xl px-3 py-2 text-[#171A18] font-bold focus:outline-none focus:border-[#0B4F3C]"
                >
                  <option value="NET_BANKING">Net Banking / RTGS</option>
                  <option value="UPI">UPI Payment</option>
                  <option value="CHEQUE">Bank Cheque</option>
                  <option value="CASH">Cash</option>
                  <option value="DEMAND_DRAFT">Demand Draft</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="pt-4 border-t border-[#0B4F3C]/15 flex items-center gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl bg-[#FDFCF0] text-xs font-bold text-[#171A18]/70 hover:text-[#171A18] border border-[#0B4F3C]/20"
          >
            Cancel
          </button>
          <button
            onClick={handleUpdateStatus}
            disabled={isSubmitting}
            className="flex-1 py-2.5 rounded-xl bg-[#0B4F3C] hover:bg-[#063B2D] text-xs font-bold text-white shadow-md cursor-pointer border border-[#0B4F3C]"
          >
            {isSubmitting ? 'Processing...' : status === 'SOLD' ? 'Sell Plot & Credit Upline' : 'Save Plot & Payment Schedule'}
          </button>
        </div>
      </div>
    </div>
  );
};
