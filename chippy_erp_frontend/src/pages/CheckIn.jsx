import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, LogIn, BedDouble, User, Phone, MapPin,
  CalendarDays, Moon, CreditCard, Clock, Shield,
  Hash, Users, FileText, CheckCircle, AlertTriangle,
  RefreshCw, Building2
} from 'lucide-react';
import API_BASE_URL from '../config';

// ── helpers ──────────────────────────────────────────────────────────────────

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

const toLocalDateTimeInput = (d) => {
  if (!d) return '';
  const dt = new Date(d);
  const pad = (n) => String(n).padStart(2, '0');
  return `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}T${pad(dt.getHours())}:${pad(dt.getMinutes())}`;
};

const ID_TYPES = ['Aadhaar', 'Passport', 'Driving Licence', 'Voter ID', 'PAN Card', 'Other'];

// ── sub-components ────────────────────────────────────────────────────────────

function BookingSummaryCard({ booking }) {
  const nights = booking.total_nights;
  const total  = parseFloat(booking.total_amount).toLocaleString('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 });

  return (
    <div className="bg-white border border-[#E5E7EB] rounded-2xl overflow-hidden shadow-sm">
      {/* colour strip */}
      <div className="h-1 bg-[#2563EB]" />
      <div className="p-5">
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">
              Booking #{10000 + booking.id}
            </p>
            <h2 className="text-[20px] font-extrabold text-gray-900">{booking.guest_name}</h2>
          </div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-blue-50 text-blue-600 border border-blue-100">
            <CheckCircle size={11} /> Confirmed
          </span>
        </div>

        <div className="grid grid-cols-2 gap-x-4 gap-y-3">
          <SummaryRow icon={<Phone size={13}/>}      label="Mobile"     value={booking.mobile_number} />
          <SummaryRow icon={<Building2 size={13}/>}  label="Site"       value={booking.site?.site_name} />
          <SummaryRow icon={<BedDouble size={13}/>}  label="Room"       value={`${booking.room?.room_number} (${booking.room?.room_type})`} />
          <SummaryRow icon={<Users size={13}/>}      label="Guests"     value={booking.guest_count} />
          <SummaryRow icon={<CalendarDays size={13}/>} label="Check-in"  value={fmtDate(booking.check_in_date)} />
          <SummaryRow icon={<CalendarDays size={13}/>} label="Check-out" value={fmtDate(booking.check_out_date)} />
          <SummaryRow icon={<Moon size={13}/>}       label="Nights"     value={nights} />
          <SummaryRow icon={<CreditCard size={13}/>} label="Total"      value={total} />
        </div>

        {booking.remarks && (
          <p className="mt-3 text-[12px] text-gray-500 bg-gray-50 rounded-lg px-3 py-2">
            <span className="font-bold text-gray-700">Note: </span>{booking.remarks}
          </p>
        )}
      </div>
    </div>
  );
}

function SummaryRow({ icon, label, value }) {
  return (
    <div className="flex items-start gap-2">
      <span className="mt-0.5 text-gray-400 shrink-0">{icon}</span>
      <div>
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider leading-none mb-0.5">{label}</p>
        <p className="text-[13px] font-semibold text-gray-800">{value || '—'}</p>
      </div>
    </div>
  );
}

function FormField({ label, required, children, hint }) {
  return (
    <div>
      <label className="block text-[12px] font-bold text-gray-700 mb-1.5">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
      {hint && <p className="text-[11px] text-gray-400 mt-1">{hint}</p>}
    </div>
  );
}

// ── main component ────────────────────────────────────────────────────────────

export default function CheckIn() {
  const { bookingId } = useParams();
  const navigate      = useNavigate();
  const token         = localStorage.getItem('token');
  const headers       = { Authorization: `Bearer ${token}` };

  const [booking,  setBooking]  = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);
  const [error,    setError]    = useState('');
  const [success,  setSuccess]  = useState(false);

  const [form, setForm] = useState({
    arrival_time: toLocalDateTimeInput(new Date()),
    id_type:      '',
    id_number:    '',
    guest_count:  '',
    remarks:      '',
  });

  // ── fetch booking ───────────────────────────────────────────────────────────
  useEffect(() => {
    const fetchBooking = async () => {
      setLoading(true);
      try {
        const res  = await fetch(`${API_BASE_URL}/api/bookings/${bookingId}`, { headers });
        if (!res.ok) throw new Error('Booking not found');
        const data = await res.json();
        setBooking(data);
        setForm(f => ({ ...f, guest_count: String(data.guest_count || 1) }));
      } catch (e) {
        setError(e.message || 'Failed to load booking');
      } finally {
        setLoading(false);
      }
    };
    if (bookingId) fetchBooking();
  }, [bookingId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  };

  // ── submit check-in ─────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.id_type)   { setError('Please select an ID type.'); return; }
    if (!form.id_number.trim()) { setError('Please enter the ID number.'); return; }

    setSaving(true);
    setError('');

    try {
      const body = {
        arrival_time: form.arrival_time ? new Date(form.arrival_time).toISOString() : new Date().toISOString(),
        id_type:      form.id_type,
        id_number:    form.id_number.trim(),
        guest_count:  parseInt(form.guest_count) || booking.guest_count,
        remarks:      form.remarks || undefined,
      };

      const res = await fetch(`${API_BASE_URL}/api/bookings/${bookingId}/checkin`, {
        method:  'PATCH',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body:    JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Check-in failed');
      }

      setSuccess(true);
      // After 2s go back to bookings list
      setTimeout(() => navigate('/bookings'), 2000);
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  // ── render ──────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400 gap-2">
        <RefreshCw size={20} className="animate-spin" /> Loading booking…
      </div>
    );
  }

  if (error && !booking) {
    return (
      <div className="max-w-lg mx-auto mt-10 p-6 bg-red-50 border border-red-200 rounded-2xl text-center">
        <AlertTriangle size={28} className="text-red-400 mx-auto mb-3" />
        <p className="font-bold text-red-700">{error}</p>
        <button onClick={() => navigate('/bookings')} className="mt-4 text-sm text-blue-600 underline">Back to Bookings</button>
      </div>
    );
  }

  if (booking?.status !== 'confirmed') {
    return (
      <div className="max-w-lg mx-auto mt-10 p-6 bg-amber-50 border border-amber-200 rounded-2xl text-center">
        <AlertTriangle size={28} className="text-amber-400 mx-auto mb-3" />
        <p className="font-bold text-amber-800">This booking cannot be checked in.</p>
        <p className="text-sm text-amber-700 mt-1">
          Current status is <strong>{booking?.status}</strong>. Only <strong>confirmed</strong> bookings can be checked in.
        </p>
        <button onClick={() => navigate('/bookings')} className="mt-4 text-sm text-blue-600 underline">Back to Bookings</button>
      </div>
    );
  }

  if (success) {
    return (
      <div className="max-w-lg mx-auto mt-10 p-8 bg-white border border-[#E5E7EB] rounded-2xl text-center shadow-sm">
        <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle size={28} className="text-green-600" />
        </div>
        <h2 className="text-xl font-extrabold text-gray-900 mb-1">Check-In Successful!</h2>
        <p className="text-sm text-gray-500">
          <strong>{booking.guest_name}</strong> has been checked in to Room{' '}
          <strong>{booking.room?.room_number}</strong>.
        </p>
        <p className="text-xs text-gray-400 mt-3">Redirecting to bookings…</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-5">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 pb-4 border-b border-[#E5E7EB]">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-xl border border-[#E5E7EB] bg-white hover:bg-gray-50 text-gray-500 shadow-sm"
        >
          <ArrowLeft size={16} />
        </button>
        <div>
          <h1 className="text-xl font-extrabold text-gray-900 flex items-center gap-2">
            <LogIn size={20} className="text-green-600" /> Check In Guest
          </h1>
          <p className="text-sm text-gray-500">Complete the check-in for Booking #{10000 + booking.id}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* ── Left: booking summary ──────────────────────────────────────── */}
        <BookingSummaryCard booking={booking} />

        {/* ── Right: check-in form ───────────────────────────────────────── */}
        <form onSubmit={handleSubmit} className="bg-white border border-[#E5E7EB] rounded-2xl shadow-sm overflow-hidden">
          <div className="h-1 bg-green-500" />
          <div className="p-5 space-y-4">
            <h3 className="text-[15px] font-extrabold text-gray-900 mb-1">Check-In Details</h3>

            {/* Arrival time */}
            <FormField label="Actual Arrival Time" hint="Defaults to now — adjust if guest arrived earlier">
              <div className="relative">
                <Clock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                <input
                  type="datetime-local"
                  name="arrival_time"
                  value={form.arrival_time}
                  onChange={handleChange}
                  className="w-full pl-9 pr-3 py-2.5 border border-[#E5E7EB] rounded-xl text-sm text-gray-800 outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-blue-100"
                />
              </div>
            </FormField>

            {/* Guest count */}
            <FormField label="Number of Guests" hint="Update if different from booking">
              <div className="relative">
                <Users size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                <input
                  type="number"
                  name="guest_count"
                  min="1"
                  max="20"
                  value={form.guest_count}
                  onChange={handleChange}
                  className="w-full pl-9 pr-3 py-2.5 border border-[#E5E7EB] rounded-xl text-sm text-gray-800 outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-blue-100"
                />
              </div>
            </FormField>

            {/* ID type */}
            <FormField label="ID Type" required>
              <div className="relative">
                <Shield size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                <select
                  name="id_type"
                  value={form.id_type}
                  onChange={handleChange}
                  required
                  className="w-full pl-9 pr-3 py-2.5 border border-[#E5E7EB] rounded-xl text-sm text-gray-800 outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-blue-100 bg-white appearance-none"
                >
                  <option value="">Select ID type…</option>
                  {ID_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </FormField>

            {/* ID number */}
            <FormField label="ID Number" required hint="Enter the document number exactly as shown">
              <div className="relative">
                <Hash size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                <input
                  type="text"
                  name="id_number"
                  value={form.id_number}
                  onChange={handleChange}
                  required
                  placeholder="e.g. XXXX XXXX XXXX"
                  className="w-full pl-9 pr-3 py-2.5 border border-[#E5E7EB] rounded-xl text-sm text-gray-800 outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-blue-100"
                />
              </div>
            </FormField>

            {/* Remarks */}
            <FormField label="Additional Remarks" hint="Any notes about the guest or room at check-in">
              <div className="relative">
                <FileText size={14} className="absolute left-3 top-3 text-gray-400 pointer-events-none" />
                <textarea
                  name="remarks"
                  value={form.remarks}
                  onChange={handleChange}
                  rows={3}
                  placeholder="Optional notes…"
                  className="w-full pl-9 pr-3 py-2.5 border border-[#E5E7EB] rounded-xl text-sm text-gray-800 outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-blue-100 resize-none"
                />
              </div>
            </FormField>

            {/* Error */}
            {error && (
              <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-700">
                <AlertTriangle size={15} className="mt-0.5 shrink-0" /> {error}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-1">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="flex-1 px-4 py-2.5 text-sm font-bold text-gray-700 border border-[#E5E7EB] bg-white rounded-xl hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-bold text-white bg-green-600 hover:bg-green-700 rounded-xl transition-colors disabled:opacity-60 shadow-sm"
              >
                {saving
                  ? <><RefreshCw size={14} className="animate-spin" /> Processing…</>
                  : <><LogIn size={14} /> Confirm Check-In</>
                }
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
