import React, { useState, useEffect, useCallback } from 'react';
import {
  Plus, Eye, Edit2, Calendar, ArrowLeft, Download, FileText,
  User, Phone, MapPin, Building2, BedDouble, Users, Info, X,
  Tags, CalendarClock, CalendarCheck, Clock, CreditCard, Search,
  CheckCircle, LogIn, LogOut, XCircle, AlertTriangle, Moon
} from 'lucide-react';
import Pagination from '../components/Pagination';
import { useLocation } from 'react-router-dom';
import { exportToCSV } from '../utils/exportCSV';
import API_BASE_URL from '../config';

// ─── Status config ────────────────────────────────────────────────────────────
const STATUS_CONFIG = {
  confirmed:   { label: 'Confirmed',   color: 'bg-blue-50 text-blue-600 border-blue-100',   icon: CheckCircle },
  checked_in:  { label: 'Checked In',  color: 'bg-green-50 text-green-600 border-green-100', icon: LogIn       },
  checked_out: { label: 'Checked Out', color: 'bg-gray-50 text-gray-500 border-gray-200',    icon: LogOut      },
  cancelled:   { label: 'Cancelled',   color: 'bg-red-50 text-red-500 border-red-100',       icon: XCircle     },
};

const StatusPill = ({ status }) => {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.confirmed;
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded border text-[10px] font-bold uppercase tracking-wider ${cfg.color}`}>
      <Icon size={10} strokeWidth={2.5} />
      {cfg.label}
    </span>
  );
};

// ─── Confirm Dialog ───────────────────────────────────────────────────────────
const ConfirmDialog = ({ open, title, message, onConfirm, onCancel, confirmLabel = 'Confirm', danger = false }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full border border-gray-100">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-4 ${danger ? 'bg-red-50' : 'bg-blue-50'}`}>
          <AlertTriangle size={20} className={danger ? 'text-red-500' : 'text-blue-500'} />
        </div>
        <h3 className="text-[15px] font-bold text-gray-900 mb-1">{title}</h3>
        <p className="text-[13px] text-gray-500 mb-6">{message}</p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 px-4 py-2.5 text-sm font-bold text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
            Cancel
          </button>
          <button onClick={onConfirm} className={`flex-1 px-4 py-2.5 text-sm font-bold text-white rounded-xl transition-colors ${danger ? 'bg-red-500 hover:bg-red-600' : 'bg-[#2563EB] hover:bg-blue-700'}`}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
export default function SalesBooking() {
  const location = useLocation();

  const [bookings,   setBookings]   = useState([]);
  const [sites,      setSites]      = useState([]);
  const [employees,  setEmployees]  = useState([]);
  const [enquiries,  setEnquiries]  = useState([]);
  const [rooms,      setRooms]      = useState([]);
  const [availRooms, setAvailRooms] = useState([]); // rooms available for selected dates
  const [loading,    setLoading]    = useState(true);
  const [loadingAvail, setLoadingAvail] = useState(false);

  const [viewMode,    setViewMode]   = useState('list');
  const [editId,      setEditId]     = useState(null);
  const [isViewOnly,  setIsViewOnly] = useState(false);

  // Confirm dialog state
  const [confirm, setConfirm] = useState({ open: false, title: '', message: '', onConfirm: null, danger: false, label: '' });

  const [form, setForm] = useState({
    booking_type: 'walk_in', guest_name: '', guest_count: 1,
    mobile_number: '', place: '', site_id: '',
    check_in_date: '', check_out_date: '',
    room_id: '', rate_per_night: '', total_amount: '',
    no_of_rooms: 1, remarks: '', enquiry_id: '',
  });

  // Filters
  const [filterSite,     setFilterSite]     = useState('');
  const [filterStatus,   setFilterStatus]   = useState('');
  const [filterEmployee, setFilterEmployee] = useState('');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo,   setFilterDateTo]   = useState('');
  const [searchTerm,     setSearchTerm]     = useState('');
  const [currentPage,    setCurrentPage]    = useState(1);
  const [pagination,     setPagination]     = useState({ total: 0, totalPages: 1 });
  const [limit] = useState(10);

  // ── Fetch master data + bookings ───────────────────────────────────────────
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const headers = { 'Authorization': 'Bearer ' + token };

      const params = new URLSearchParams({
        page: currentPage, limit, search: searchTerm,
        ...(filterStatus && { status: filterStatus }),
        ...(filterSite   && { site_id: filterSite }),
      });

      const [resBooks, resSites, resEmps, resEnqs, resRooms] = await Promise.all([
        fetch(`${API_BASE_URL}/api/bookings?${params}`,          { headers }),
        fetch(`${API_BASE_URL}/api/locations/sites`,             { headers }),
        fetch(`${API_BASE_URL}/api/employees`,                   { headers }),
        fetch(`${API_BASE_URL}/api/enquiries`,                   { headers }),
        fetch(`${API_BASE_URL}/api/rooms`,                       { headers }),
      ]);

      if (resBooks.ok) {
        const r = await resBooks.json();
        setBookings(r.data);
        setPagination({ total: r.total, totalPages: r.totalPages });
      }
      if (resSites.ok) setSites(await resSites.json());
      if (resEmps.ok)  setEmployees(await resEmps.json());
      if (resEnqs.ok) {
        const d = await resEnqs.json();
        setEnquiries(Array.isArray(d) ? d : d.data || []);
      }
      if (resRooms.ok) {
        setRooms(await resRooms.json());
        if (location.state?.autoOpenCreate) {
          setViewMode('create');
          setForm(prev => ({ ...prev, site_id: location.state.prefilledSiteId, room_id: location.state.prefilledRoomId }));
          window.history.replaceState({}, document.title);
        }
      }
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchTerm, filterStatus, filterSite]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ── Fetch available rooms when dates + site change (create mode) ───────────
  useEffect(() => {
    if (viewMode !== 'create' || isViewOnly) return;
    if (!form.site_id || !form.check_in_date || !form.check_out_date) {
      setAvailRooms([]);
      return;
    }
    const fetchAvail = async () => {
      setLoadingAvail(true);
      try {
        const token = localStorage.getItem('token');
        const params = new URLSearchParams({
          site_id:   form.site_id,
          check_in:  form.check_in_date,
          check_out: form.check_out_date,
        });
        const res = await fetch(`${API_BASE_URL}/api/bookings/available-rooms?${params}`, {
          headers: { 'Authorization': 'Bearer ' + token },
        });
        if (res.ok) {
          const data = await res.json();
          setAvailRooms(data);
          // If currently selected room is no longer available, clear it
          if (form.room_id && !data.find(r => r.id === parseInt(form.room_id))) {
            setForm(prev => ({ ...prev, room_id: '', rate_per_night: '', total_amount: '' }));
          }
        }
      } finally {
        setLoadingAvail(false);
      }
    };
    fetchAvail();
  }, [form.site_id, form.check_in_date, form.check_out_date, viewMode]);

  // ── Auto-calculate total when room / nights change ─────────────────────────
  const calcNights = () => {
    if (!form.check_in_date || !form.check_out_date) return 0;
    return Math.max(1, Math.ceil((new Date(form.check_out_date) - new Date(form.check_in_date)) / (1000 * 60 * 60 * 24)));
  };

  const handleRoomSelect = (roomId) => {
    const room = rooms.find(r => r.id === parseInt(roomId));
    const nights = calcNights();
    const rate   = room?.rate_per_night ? parseFloat(room.rate_per_night) : '';
    const total  = rate && nights ? rate * nights : '';
    setForm(prev => ({ ...prev, room_id: roomId, rate_per_night: rate, total_amount: total }));
  };

  const handleDateChange = (field, value) => {
    setForm(prev => {
      const updated = { ...prev, [field]: value };
      const inD  = field === 'check_in_date'  ? new Date(value) : new Date(prev.check_in_date);
      const outD = field === 'check_out_date' ? new Date(value) : new Date(prev.check_out_date);
      if (updated.rate_per_night && inD && outD && outD > inD) {
        const nights = Math.ceil((outD - inD) / (1000 * 60 * 60 * 24));
        updated.total_amount = parseFloat(updated.rate_per_night) * nights;
      }
      return updated;
    });
  };

  // ── Submit (create / edit) ─────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isViewOnly) return setViewMode('list');

    const token  = localStorage.getItem('token');
    const url    = editId ? `${API_BASE_URL}/api/bookings/${editId}` : `${API_BASE_URL}/api/bookings`;
    const method = editId ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
      body: JSON.stringify({
        ...form,
        enquiry_id:  form.enquiry_id || null,
        guest_count: parseInt(form.guest_count),
        total_amount: parseFloat(form.total_amount),
      }),
    });

    if (!res.ok) {
      const err = await res.json();
      alert(err.error || 'Failed to save booking');
      return;
    }

    resetForm();
    fetchData();
  };

  // ── Status transition ──────────────────────────────────────────────────────
  const handleStatusChange = (booking, newStatus) => {
    const labels = { checked_in: 'Check In', checked_out: 'Check Out', cancelled: 'Cancel' };
    const isDanger = newStatus === 'cancelled';
    setConfirm({
      open:      true,
      title:     `${labels[newStatus]}: ${booking.guest_name}`,
      message:   newStatus === 'checked_in'
        ? `Confirm check-in for Room ${booking.room?.room_number}? This will mark the room as occupied.`
        : newStatus === 'checked_out'
        ? `Confirm check-out for ${booking.guest_name}? Room will be released.`
        : `Cancel booking BKG-${10000 + booking.id}? This cannot be undone.`,
      danger:    isDanger,
      label:     labels[newStatus],
      onConfirm: async () => {
        setConfirm(prev => ({ ...prev, open: false }));
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_BASE_URL}/api/bookings/${booking.id}/status`, {
          method:  'PATCH',
          headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
          body:    JSON.stringify({ status: newStatus }),
        });
        if (!res.ok) {
          const err = await res.json();
          alert(err.error || 'Status update failed');
          return;
        }
        fetchData();
      },
    });
  };

  const handleEdit = (bkg, viewOnly = false) => {
    setForm({
      booking_type:   bkg.booking_type || 'walk_in',
      guest_name:     bkg.guest_name   || '',
      guest_count:    bkg.guest_count  || 1,
      mobile_number:  bkg.mobile_number || '',
      place:          bkg.place || '',
      site_id:        bkg.site_id || '',
      check_in_date:  bkg.check_in_date  ? new Date(bkg.check_in_date).toISOString().split('T')[0]  : '',
      check_out_date: bkg.check_out_date ? new Date(bkg.check_out_date).toISOString().split('T')[0] : '',
      room_id:        bkg.room_id || '',
      rate_per_night: bkg.rate_per_night || '',
      total_amount:   bkg.total_amount || '',
      no_of_rooms:    1,
      remarks:        bkg.remarks || '',
      enquiry_id:     bkg.enquiry_id || '',
    });
    setEditId(bkg.id);
    setIsViewOnly(viewOnly);
    setViewMode('create');
  };

  const resetForm = () => {
    setForm({ booking_type: 'walk_in', guest_name: '', guest_count: 1, mobile_number: '', place: '', site_id: '', check_in_date: '', check_out_date: '', room_id: '', rate_per_night: '', total_amount: '', no_of_rooms: 1, remarks: '', enquiry_id: '' });
    setEditId(null);
    setIsViewOnly(false);
    setAvailRooms([]);
  };

  const filteredBookings = bookings.filter(b => {
    if (filterEmployee && b.employee?.name !== filterEmployee) return false;
    const bDate = new Date(b.booking_date || b.created_at);
    bDate.setHours(0, 0, 0, 0);
    if (filterDateFrom) { const f = new Date(filterDateFrom); f.setHours(0,0,0,0); if (bDate < f) return false; }
    if (filterDateTo)   { const f = new Date(filterDateTo);   f.setHours(0,0,0,0); if (bDate > f) return false; }
    return true;
  });

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-GB') : '-';

  // ── Action buttons per booking row ─────────────────────────────────────────
  const ActionButtons = ({ bkg }) => {
    const s = bkg.status;
    return (
      <div className="flex items-center justify-end gap-2">
        <button onClick={() => handleEdit(bkg, true)} className="p-1.5 text-gray-400 hover:text-blue-600 transition-colors" title="View"><Eye size={15}/></button>
        {(s === 'confirmed') && (
          <button onClick={() => handleEdit(bkg, false)} className="p-1.5 text-gray-400 hover:text-blue-600 transition-colors" title="Edit"><Edit2 size={15}/></button>
        )}
        {s === 'confirmed' && (
          <button onClick={() => handleStatusChange(bkg, 'checked_in')} className="px-2.5 py-1 bg-green-50 text-green-600 border border-green-100 rounded-lg text-[11px] font-bold hover:bg-green-100 transition-colors flex items-center gap-1">
            <LogIn size={11}/> Check In
          </button>
        )}
        {s === 'checked_in' && (
          <button onClick={() => handleStatusChange(bkg, 'checked_out')} className="px-2.5 py-1 bg-blue-50 text-blue-600 border border-blue-100 rounded-lg text-[11px] font-bold hover:bg-blue-100 transition-colors flex items-center gap-1">
            <LogOut size={11}/> Check Out
          </button>
        )}
        {(s === 'confirmed' || s === 'checked_in') && (
          <button onClick={() => handleStatusChange(bkg, 'cancelled')} className="p-1.5 text-gray-300 hover:text-red-500 transition-colors" title="Cancel booking">
            <XCircle size={15}/>
          </button>
        )}
      </div>
    );
  };

  // ────────────────────────────────────────────────────────────────────────────
  // CREATE / EDIT FORM VIEW
  // ────────────────────────────────────────────────────────────────────────────
  if (viewMode === 'create') {
    const nights = calcNights();
    const selectedRoom = rooms.find(r => r.id === parseInt(form.room_id));

    return (
      <div className="bg-[#F8FAFC] min-h-[calc(100vh-4rem)] p-4 md:p-8 md:-m-8 border-0 md:border-l border-[#E5E7EB]">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => { setViewMode('list'); resetForm(); }} className="p-2 bg-white border border-[#E5E7EB] rounded-lg text-gray-500 hover:bg-gray-50 shadow-sm transition-colors">
            <ArrowLeft size={18} strokeWidth={2.5} />
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-900 leading-tight">
              {isViewOnly ? 'Booking Manifest' : (editId ? 'Edit Booking' : 'New Booking')}
            </h1>
            <p className="text-sm font-medium text-gray-500">
              {isViewOnly ? `BKG-${10000 + editId}` : 'Fill in guest and room details below'}
            </p>
          </div>
          {isViewOnly && editId && (
            <div className="ml-auto">
              <StatusPill status={bookings.find(b => b.id === editId)?.status || 'confirmed'} />
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-[#E5E7EB] p-6 max-w-[1600px]">
          <fieldset disabled={isViewOnly} className="grid grid-cols-1 md:grid-cols-4 gap-x-6 gap-y-5">

            {/* Row 1: Booking type, Source Enquiry, Guest Name, Mobile */}
            <div>
              <label className="block text-[13px] font-bold text-[#4B5563] mb-1.5 flex items-center gap-1.5"><Tags size={13} className="text-[#3B82F6]"/> Booking Type *</label>
              <select required value={form.booking_type} onChange={e => setForm({...form, booking_type: e.target.value})} className="w-full px-3 py-2 bg-white border border-[#E5E7EB] rounded-lg text-sm font-medium text-gray-700 outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] disabled:bg-gray-50 disabled:text-gray-500">
                <option value="walk_in">Walk-In</option>
                <option value="online">Online</option>
                <option value="agent">Agent</option>
              </select>
            </div>
            <div>
              <label className="block text-[13px] font-bold text-[#4B5563] mb-1.5 flex items-center gap-1.5"><FileText size={13} className="text-[#3B82F6]"/> Source Enquiry</label>
              <select value={form.enquiry_id} onChange={e => setForm({...form, enquiry_id: e.target.value})} className="w-full px-3 py-2 bg-white border border-[#E5E7EB] rounded-lg text-sm font-medium text-gray-700 outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] disabled:bg-gray-50 disabled:text-gray-500">
                <option value="">No Linking (Direct)</option>
                {enquiries.filter(eq => eq.status !== 'converted').map(eq => (
                  <option key={eq.id} value={eq.id}>{eq.guest_name} — {eq.mobile_number}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[13px] font-bold text-[#4B5563] mb-1.5 flex items-center gap-1.5"><User size={13} className="text-[#3B82F6]"/> Guest Name *</label>
              <input required value={form.guest_name} onChange={e => setForm({...form, guest_name: e.target.value})} placeholder="Full name" className="w-full px-3 py-2 bg-white border border-[#E5E7EB] rounded-lg text-sm font-medium text-gray-900 outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] disabled:bg-gray-50 disabled:text-gray-500" />
            </div>
            <div>
              <label className="block text-[13px] font-bold text-[#4B5563] mb-1.5 flex items-center gap-1.5"><Phone size={13} className="text-[#3B82F6]"/> Mobile *</label>
              <input required type="tel" value={form.mobile_number} onChange={e => setForm({...form, mobile_number: e.target.value})} placeholder="Mobile number" className="w-full px-3 py-2 bg-white border border-[#E5E7EB] rounded-lg text-sm font-medium text-gray-900 outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] disabled:bg-gray-50 disabled:text-gray-500" />
            </div>

            {/* Row 2: Guests, Place, Site, Check-in */}
            <div>
              <label className="block text-[13px] font-bold text-[#4B5563] mb-1.5 flex items-center gap-1.5"><Users size={13} className="text-[#3B82F6]"/> No. of Guests *</label>
              <input required type="number" min="1" value={form.guest_count} onChange={e => setForm({...form, guest_count: e.target.value})} className="w-full px-3 py-2 bg-white border border-[#E5E7EB] rounded-lg text-sm font-medium text-gray-900 outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] disabled:bg-gray-50 disabled:text-gray-500" />
            </div>
            <div>
              <label className="block text-[13px] font-bold text-[#4B5563] mb-1.5 flex items-center gap-1.5"><MapPin size={13} className="text-[#3B82F6]"/> Place / City</label>
              <input value={form.place} onChange={e => setForm({...form, place: e.target.value})} placeholder="City" className="w-full px-3 py-2 bg-white border border-[#E5E7EB] rounded-lg text-sm font-medium text-gray-900 outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] disabled:bg-gray-50 disabled:text-gray-500" />
            </div>
            <div>
              <label className="block text-[13px] font-bold text-[#4B5563] mb-1.5 flex items-center gap-1.5"><Building2 size={13} className="text-[#3B82F6]"/> Property / Site *</label>
              <select required value={form.site_id} onChange={e => setForm({...form, site_id: e.target.value, room_id: '', rate_per_night: '', total_amount: ''})} className="w-full px-3 py-2 bg-white border border-[#E5E7EB] rounded-lg text-sm font-medium text-gray-700 outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] disabled:bg-gray-50 disabled:text-gray-500">
                <option value="">Select Site</option>
                {sites.map(s => <option key={s.id} value={s.id}>{s.site_name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[13px] font-bold text-[#4B5563] mb-1.5 flex items-center gap-1.5"><CalendarClock size={13} className="text-[#3B82F6]"/> Check-in Date *</label>
              <input required type="date" value={form.check_in_date} onChange={e => handleDateChange('check_in_date', e.target.value)} className="w-full px-3 py-2 bg-white border border-[#E5E7EB] rounded-lg text-sm font-medium text-gray-900 outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] disabled:bg-gray-50 disabled:text-gray-500" />
            </div>

            {/* Row 3: Check-out, Room (availability-aware), Rate, Total */}
            <div>
              <label className="block text-[13px] font-bold text-[#4B5563] mb-1.5 flex items-center gap-1.5"><CalendarCheck size={13} className="text-[#3B82F6]"/> Check-out Date *</label>
              <input required type="date" value={form.check_out_date} min={form.check_in_date} onChange={e => handleDateChange('check_out_date', e.target.value)} className="w-full px-3 py-2 bg-white border border-[#E5E7EB] rounded-lg text-sm font-medium text-gray-900 outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] disabled:bg-gray-50 disabled:text-gray-500" />
            </div>
            <div>
              <label className="block text-[13px] font-bold text-[#4B5563] mb-1.5 flex items-center gap-1.5">
                <BedDouble size={13} className="text-[#3B82F6]"/> Room / Unit *
                {loadingAvail && <span className="ml-1 text-[10px] font-normal text-gray-400 animate-pulse">checking availability…</span>}
                {!loadingAvail && form.site_id && form.check_in_date && form.check_out_date && (
                  <span className="ml-1 text-[10px] font-bold text-green-600">{availRooms.length} available</span>
                )}
              </label>
              <select
                required
                value={form.room_id}
                onChange={e => handleRoomSelect(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-[#E5E7EB] rounded-lg text-sm font-medium text-gray-700 outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] disabled:bg-gray-50 disabled:text-gray-500"
              >
                <option value="">
                  {!form.site_id || !form.check_in_date || !form.check_out_date
                    ? 'Select site & dates first'
                    : loadingAvail ? 'Checking availability…'
                    : availRooms.length === 0 ? 'No rooms available'
                    : 'Select available room'}
                </option>
                {(isViewOnly ? rooms.filter(r => r.id === parseInt(form.room_id)) : availRooms)
                  .map(r => (
                    <option key={r.id} value={r.id}>
                      {r.room_number} — {r.room_type}{r.rate_per_night ? ` (₹${parseFloat(r.rate_per_night).toLocaleString('en-IN')}/night)` : ''}
                    </option>
                  ))}
              </select>
            </div>
            <div>
              <label className="block text-[13px] font-bold text-[#4B5563] mb-1.5 flex items-center gap-1.5"><CreditCard size={13} className="text-[#3B82F6]"/> Rate / Night (₹)</label>
              <input
                type="number"
                value={form.rate_per_night}
                onChange={e => {
                  const rate = parseFloat(e.target.value) || '';
                  setForm(prev => ({ ...prev, rate_per_night: rate, total_amount: rate && nights ? rate * nights : '' }));
                }}
                placeholder="Auto from room"
                className="w-full px-3 py-2 bg-white border border-[#E5E7EB] rounded-lg text-sm font-medium text-gray-900 outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] disabled:bg-gray-50 disabled:text-gray-500"
              />
            </div>
            <div>
              <label className="block text-[13px] font-bold text-[#4B5563] mb-1.5 flex items-center gap-1.5"><CreditCard size={13} className="text-[#3B82F6]"/> Total Amount (₹)</label>
              <div className="relative">
                <input
                  required type="number"
                  value={form.total_amount}
                  onChange={e => setForm({...form, total_amount: e.target.value})}
                  className="w-full px-3 py-2 bg-white border border-[#2563EB] rounded-lg text-sm font-bold text-[#2563EB] outline-none focus:ring-1 focus:ring-[#2563EB] disabled:bg-gray-50 disabled:text-gray-500"
                  placeholder="0.00"
                />
                {nights > 0 && form.rate_per_night && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-gray-400">
                    {nights}N × ₹{parseFloat(form.rate_per_night).toLocaleString('en-IN')}
                  </span>
                )}
              </div>
            </div>

            {/* Remarks — full width */}
            <div className="md:col-span-4">
              <label className="block text-[13px] font-bold text-[#4B5563] mb-1.5 flex items-center gap-1.5"><FileText size={13} className="text-[#3B82F6]"/> Remarks / Notes</label>
              <input value={form.remarks} onChange={e => setForm({...form, remarks: e.target.value})} placeholder="Add a note…" className="w-full px-3 py-2 bg-white border border-[#E5E7EB] rounded-lg text-sm font-medium text-gray-900 outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] disabled:bg-gray-50 disabled:text-gray-500" />
            </div>
          </fieldset>

          {/* Summary strip */}
          {(nights > 0 || form.total_amount) && (
            <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-100 flex flex-wrap items-center gap-6 text-[13px] font-semibold text-blue-700">
              {nights > 0 && <span className="flex items-center gap-1.5"><Moon size={14}/> {nights} Night{nights > 1 ? 's' : ''}</span>}
              {selectedRoom && <span className="flex items-center gap-1.5"><BedDouble size={14}/> Room {selectedRoom.room_number}</span>}
              {form.total_amount && <span className="ml-auto text-[16px] font-black text-[#1D4ED8]">₹ {parseFloat(form.total_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>}
            </div>
          )}

          <div className="flex justify-end gap-3 mt-6 pt-5 border-t border-[#E5E7EB]">
            <button type="button" onClick={() => { setViewMode('list'); resetForm(); }} className="px-5 py-2.5 text-sm font-bold text-gray-700 bg-white border border-[#E5E7EB] rounded-lg hover:bg-gray-50 shadow-sm">
              {isViewOnly ? 'Close' : 'Cancel'}
            </button>
            {!isViewOnly && (
              <button type="submit" className="px-5 py-2.5 text-sm font-bold text-white bg-[#2563EB] rounded-lg hover:bg-blue-700 shadow-sm">
                {editId ? 'Save Changes' : 'Confirm Booking'}
              </button>
            )}
          </div>
        </form>
      </div>
    );
  }

  // ────────────────────────────────────────────────────────────────────────────
  // LIST VIEW
  // ────────────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 max-w-[1600px] mx-auto p-4 md:p-0">
      <ConfirmDialog
        open={confirm.open}
        title={confirm.title}
        message={confirm.message}
        onConfirm={confirm.onConfirm}
        onCancel={() => setConfirm(prev => ({ ...prev, open: false }))}
        confirmLabel={confirm.label}
        danger={confirm.danger}
      />

      <div className="flex justify-between items-center pb-4 border-b border-[#E5E7EB]">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900">Bookings & Sales</h1>
          <p className="text-sm text-gray-500 mt-0.5">{pagination.total} total bookings</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => exportToCSV(filteredBookings, 'bookings')} className="hidden md:flex bg-white border border-[#E5E7EB] text-gray-700 px-4 py-2 rounded-lg font-bold text-sm items-center gap-2 hover:bg-gray-50 shadow-sm">
            <Download size={16}/> Export
          </button>
          <button onClick={() => { resetForm(); setViewMode('create'); }} className="bg-[#1A56DB] text-white px-3 py-1.5 md:px-4 md:py-2 rounded-lg font-medium text-xs md:text-sm flex items-center gap-1.5 hover:bg-blue-700 shadow-sm">
            <Plus size={14}/> Add Booking
          </button>
        </div>
      </div>

      <div className="bg-white border border-[#E5E7EB] rounded-[12px] shadow-sm">
        {/* Filter Strip */}
        <div className="p-4 border-b border-[#E5E7EB] flex flex-col gap-3 bg-[#F8FAFC] rounded-t-[12px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16}/>
            <input type="text" placeholder="Search guest or mobile…" value={searchTerm} onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }} className="w-full pl-10 pr-4 py-2 bg-white border border-[#E5E7EB] rounded-lg text-sm outline-none focus:border-[#2563EB]" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">From</p>
              <input type="date" value={filterDateFrom} onChange={e => setFilterDateFrom(e.target.value)} className="w-full px-3 py-2 bg-white border border-[#E5E7EB] rounded-lg text-[13px] font-medium text-gray-700 outline-none focus:border-[#2563EB]"/>
            </div>
            <div>
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">To</p>
              <input type="date" value={filterDateTo} onChange={e => setFilterDateTo(e.target.value)} className="w-full px-3 py-2 bg-white border border-[#E5E7EB] rounded-lg text-[13px] font-medium text-gray-700 outline-none focus:border-[#2563EB]"/>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            {/* Status filter — NEW */}
            <select value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setCurrentPage(1); }} className="flex-1 md:w-40 md:flex-none px-3 py-2 bg-white border border-[#E5E7EB] rounded-lg text-[13px] font-medium text-gray-700 outline-none">
              <option value="">All Statuses</option>
              <option value="confirmed">Confirmed</option>
              <option value="checked_in">Checked In</option>
              <option value="checked_out">Checked Out</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <select value={filterSite} onChange={e => { setFilterSite(e.target.value); setCurrentPage(1); }} className="flex-1 md:w-40 md:flex-none px-3 py-2 bg-white border border-[#E5E7EB] rounded-lg text-[13px] font-medium text-gray-700 outline-none">
              <option value="">All Sites</option>
              {sites.map(s => <option key={s.id} value={s.id}>{s.site_name}</option>)}
            </select>
            <select value={filterEmployee} onChange={e => setFilterEmployee(e.target.value)} className="flex-1 md:w-40 md:flex-none px-3 py-2 bg-white border border-[#E5E7EB] rounded-lg text-[13px] font-medium text-gray-700 outline-none">
              <option value="">All Employees</option>
              {employees.map(emp => <option key={emp.id} value={emp.name}>{emp.name}</option>)}
            </select>
            <button onClick={() => { setFilterSite(''); setFilterEmployee(''); setFilterDateFrom(''); setFilterDateTo(''); setFilterStatus(''); setSearchTerm(''); setCurrentPage(1); }} className="px-4 py-2 text-[#2563EB] border border-[#BFDBFE] bg-blue-50 hover:bg-blue-100 rounded-lg text-[13px] font-bold">
              Reset
            </button>
          </div>
        </div>

        {/* Desktop Table */}
        <div className="overflow-x-auto hidden md:block">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="text-gray-500 border-b border-[#E5E7EB]">
              <tr>
                {['#','Booking ID','Date','Guest','Room','Check-in','Check-out','Nights','Amount (₹)','Status','By','Actions'].map(h => (
                  <th key={h} className="px-3 py-3.5 text-[11px] font-semibold tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E7EB] text-gray-800 font-medium">
              {loading ? (
                <tr><td colSpan={12} className="px-6 py-12 text-center text-gray-400">Loading…</td></tr>
              ) : filteredBookings.length === 0 ? (
                <tr><td colSpan={12} className="px-6 py-12 text-center text-gray-400">No bookings found.</td></tr>
              ) : filteredBookings.map((bkg, idx) => (
                <tr key={bkg.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-3 py-3.5 text-gray-400 text-[12px]">{(currentPage - 1) * limit + idx + 1}</td>
                  <td className="px-3 py-3.5 text-gray-500 font-bold text-[12px]">BKG-{10000 + bkg.id}</td>
                  <td className="px-3 py-3.5 text-gray-600 text-[12px]">{formatDate(bkg.booking_date || bkg.created_at)}</td>
                  <td className="px-3 py-3.5 font-bold text-gray-900">{bkg.guest_name}</td>
                  <td className="px-3 py-3.5 font-semibold text-gray-700">{bkg.room?.room_number || '-'}</td>
                  <td className="px-3 py-3.5 text-gray-600 text-[12px]">{formatDate(bkg.check_in_date)}</td>
                  <td className="px-3 py-3.5 text-gray-600 text-[12px]">{formatDate(bkg.check_out_date)}</td>
                  <td className="px-3 py-3.5 text-center text-gray-600 text-[12px]">{bkg.total_nights}</td>
                  <td className="px-3 py-3.5 font-bold text-gray-900 text-right">₹{parseFloat(bkg.total_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                  <td className="px-3 py-3.5"><StatusPill status={bkg.status}/></td>
                  <td className="px-3 py-3.5 text-gray-600 text-[12px]">{bkg.employee?.name || '—'}</td>
                  <td className="px-3 py-3.5"><ActionButtons bkg={bkg}/></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="md:hidden flex flex-col bg-[#F4F7FE] p-4 min-h-[300px]">
          {loading ? (
            <p className="text-center py-8 text-sm text-gray-400">Loading…</p>
          ) : filteredBookings.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Calendar size={40} className="text-gray-300 mb-3"/>
              <p className="text-gray-400 font-medium">No bookings found</p>
              <button onClick={() => { resetForm(); setViewMode('create'); }} className="mt-4 bg-[#1A56DB] text-white px-6 py-3 rounded-xl font-bold text-sm flex items-center gap-2">
                <Plus size={16}/> Create Booking
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-4 pb-16">
              {filteredBookings.map(bkg => (
                <div key={bkg.id} className="bg-white rounded-2xl p-4 shadow-sm border border-[#E5E7EB]">
                  <div className="flex justify-between items-start mb-3 pb-3 border-b border-gray-100">
                    <div>
                      <p className="text-[11px] font-bold text-gray-400">BKG-{10000 + bkg.id}</p>
                      <p className="text-[14px] font-extrabold text-gray-900 mt-0.5">{bkg.guest_name}</p>
                      <p className="text-[12px] text-gray-500 mt-0.5 flex items-center gap-1"><Building2 size={11}/> Room {bkg.room?.room_number || '-'}</p>
                    </div>
                    <StatusPill status={bkg.status}/>
                  </div>
                  <div className="flex items-center justify-between bg-gray-50 rounded-xl p-3 mb-3 border border-gray-100">
                    <div className="text-center flex-1 border-r border-gray-200">
                      <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Check-in</p>
                      <p className="text-[12px] font-bold text-gray-900">{formatDate(bkg.check_in_date)}</p>
                    </div>
                    <div className="text-center flex-1">
                      <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Check-out</p>
                      <p className="text-[12px] font-bold text-gray-900">{formatDate(bkg.check_out_date)}</p>
                    </div>
                    <div className="text-center flex-1 border-l border-gray-200">
                      <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Nights</p>
                      <p className="text-[12px] font-bold text-gray-900">{bkg.total_nights}</p>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <ActionButtons bkg={bkg}/>
                    <p className="text-[15px] font-black text-[#2563EB]">₹{parseFloat(bkg.total_amount).toLocaleString('en-IN')}</p>
                  </div>
                </div>
              ))}
              <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-40">
                <button onClick={() => exportToCSV(filteredBookings, 'bookings')} className="bg-white border border-[#E5E7EB] text-gray-700 px-6 py-2.5 rounded-full font-bold text-sm flex items-center gap-2 shadow-md">
                  <Download size={16}/> Export CSV
                </button>
              </div>
            </div>
          )}
        </div>

        <Pagination currentPage={currentPage} totalPages={pagination.totalPages} onPageChange={setCurrentPage}/>
      </div>
    </div>
  );
}