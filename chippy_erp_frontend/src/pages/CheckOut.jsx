import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, LogOut, BedDouble, User, Phone,
  CalendarDays, Moon, CreditCard, Clock, FileText,
  CheckCircle, AlertTriangle, RefreshCw, Building2,
  Users, Banknote, TrendingUp, Receipt, BadgeCheck,
  CircleDollarSign, ChevronDown, ChevronUp
} from 'lucide-react';
import API_BASE_URL from '../config';

// ── helpers ──────────────────────────────────────────────────────────────────

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

const fmtDateTime = (d) =>
  d ? new Date(d).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  }) : '—';

const fmtINR = (n) =>
  parseFloat(n || 0).toLocaleString('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 });

const nightsBetween = (a, b) => {
  if (!a || !b) return 0;
  return Math.max(0, Math.ceil((new Date(b) - new Date(a)) / (1000 * 60 * 60 * 24)));
};

const METHOD_LABELS = {
  cash: 'Cash', upi: 'UPI', bank: 'Bank Transfer',
  card: 'Card', cheque: 'Cheque', rtgs: 'RTGS',
};

// ── sub-components ────────────────────────────────────────────────────────────

function SectionCard({ title, icon, children, accent = '#2563EB' }) {
  return (
    <div className="bg-white border border-[#E5E7EB] rounded-2xl overflow-hidden shadow-sm">
      <div className="h-1" style={{ background: accent }} />
      <div className="p-5">
        <h3 className="flex items-center gap-2 text-[13px] font-extrabold text-gray-700 mb-4 uppercase tracking-wider">
          <span style={{ color: accent }}>{icon}</span>
          {title}
        </h3>
        {children}
      </div>
    </div>
  );
}

function InfoRow({ icon, label, value, bold }) {
  return (
    <div className="flex items-start gap-2.5 py-1.5 border-b border-dashed border-[#F3F4F6] last:border-0">
      <span className="mt-0.5 text-gray-400 shrink-0">{icon}</span>
      <span className="text-[12px] text-gray-500 flex-1">{label}</span>
      <span className={`text-[13px] ${bold ? 'font-extrabold text-gray-900' : 'font-semibold text-gray-700'}`}>
        {value || '—'}
      </span>
    </div>
  );
}

function AmountRow({ label, value, highlight, sub }) {
  return (
    <div className={`flex items-center justify-between py-2 ${highlight ? 'border-t-2 border-[#E5E7EB] mt-1 pt-3' : ''}`}>
      <span className={`text-[12px] ${highlight ? 'font-extrabold text-gray-900' : 'text-gray-600'} ${sub ? 'pl-3 text-gray-400' : ''}`}>
        {label}
      </span>
      <span className={`font-extrabold ${highlight ? 'text-[18px] text-gray-900' : 'text-[13px] text-gray-700'}`}>
        {value}
      </span>
    </div>
  );
}

function PaymentBadge({ method }) {
  const label = METHOD_LABELS[method] || method;
  const colors = {
    cash:   'bg-green-50 text-green-700',
    upi:    'bg-purple-50 text-purple-700',
    bank:   'bg-blue-50 text-blue-700',
    card:   'bg-indigo-50 text-indigo-700',
    cheque: 'bg-amber-50 text-amber-700',
    rtgs:   'bg-teal-50 text-teal-700',
  };
  return (
    <span className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold ${colors[method] || 'bg-gray-100 text-gray-600'}`}>
      {label}
    </span>
  );
}

// ── main component ────────────────────────────────────────────────────────────

export default function CheckOut() {
  const { bookingId } = useParams();
  const navigate      = useNavigate();
  const token         = localStorage.getItem('token');
  const headers       = { Authorization: `Bearer ${token}` };

  const [booking,  setBooking]  = useState(null);
  const [payments, setPayments] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);
  const [error,    setError]    = useState('');
  const [success,  setSuccess]  = useState(false);
  const [showPayments, setShowPayments] = useState(false);

  const [remarks, setRemarks] = useState('');

  // ── fetch booking + payments ────────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [bRes, pRes] = await Promise.all([
          fetch(`${API_BASE_URL}/api/bookings/${bookingId}`, { headers }),
          fetch(`${API_BASE_URL}/api/payments?booking_id=${bookingId}&limit=100`, { headers }),
        ]);
        if (!bRes.ok) throw new Error('Booking not found');
        const bData = await bRes.json();
        const pData = pRes.ok ? await pRes.json() : { data: [] };
        setBooking(bData);
        setPayments(pData.data || []);
        setRemarks(bData.remarks || '');
      } catch (e) {
        setError(e.message || 'Failed to load booking');
      } finally {
        setLoading(false);
      }
    };
    if (bookingId) load();
  }, [bookingId]);

  // ── computed amounts ────────────────────────────────────────────────────────
  const totalCharged   = booking ? parseFloat(booking.total_amount) : 0;
  const totalPaid      = payments
    .filter(p => p.transaction_type === 'credit' && p.is_active && !p.is_deleted)
    .reduce((s, p) => s + parseFloat(p.payment_amt_in_base || 0), 0);
  const outstanding    = Math.max(0, totalCharged - totalPaid);
  const actualNights   = booking
    ? nightsBetween(booking.actual_check_in || booking.check_in_date, new Date())
    : 0;

  // ── submit checkout ─────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const res = await fetch(`${API_BASE_URL}/api/bookings/${bookingId}/checkout`, {
        method:  'PATCH',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body:    JSON.stringify({ remarks: remarks || undefined }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Check-out failed');
      }
      setSuccess(true);
      setTimeout(() => navigate('/bookings'), 2500);
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  // ── guards ──────────────────────────────────────────────────────────────────

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
        <button onClick={() => navigate('/bookings')} className="mt-4 text-sm text-blue-600 underline">
          Back to Bookings
        </button>
      </div>
    );
  }

  if (booking?.status !== 'checked_in') {
    return (
      <div className="max-w-lg mx-auto mt-10 p-6 bg-amber-50 border border-amber-200 rounded-2xl text-center">
        <AlertTriangle size={28} className="text-amber-400 mx-auto mb-3" />
        <p className="font-bold text-amber-800">This booking cannot be checked out.</p>
        <p className="text-sm text-amber-700 mt-1">
          Current status is <strong>{booking?.status}</strong>. Only <strong>checked-in</strong> bookings can be checked out.
        </p>
        <button onClick={() => navigate('/bookings')} className="mt-4 text-sm text-blue-600 underline">
          Back to Bookings
        </button>
      </div>
    );
  }

  if (success) {
    return (
      <div className="max-w-lg mx-auto mt-10 p-8 bg-white border border-[#E5E7EB] rounded-2xl text-center shadow-sm">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <LogOut size={30} className="text-blue-600" />
        </div>
        <h2 className="text-xl font-extrabold text-gray-900 mb-1">Check-Out Successful!</h2>
        <p className="text-sm text-gray-500 mb-2">
          <strong>{booking.guest_name}</strong> has been checked out from Room{' '}
          <strong>{booking.room?.room_number}</strong>.
        </p>
        {outstanding > 0 && (
          <p className="text-sm font-bold text-red-600 bg-red-50 rounded-xl px-4 py-2 mt-2">
            ⚠ Outstanding balance: {fmtINR(outstanding)} — please collect before guest leaves.
          </p>
        )}
        <p className="text-xs text-gray-400 mt-4">Redirecting to bookings…</p>
      </div>
    );
  }

  const bookedNights  = booking.total_nights;
  const ratePerNight  = booking.rate_per_night ? parseFloat(booking.rate_per_night) : (totalCharged / (bookedNights || 1));

  return (
    <div className="max-w-5xl mx-auto p-4 space-y-5">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 pb-4 border-b border-[#E5E7EB]">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-xl border border-[#E5E7EB] bg-white hover:bg-gray-50 text-gray-500 shadow-sm"
        >
          <ArrowLeft size={16} />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-extrabold text-gray-900 flex items-center gap-2">
            <LogOut size={20} className="text-blue-600" /> Check Out Guest
          </h1>
          <p className="text-sm text-gray-500">Booking #{10000 + booking.id} · {booking.guest_name}</p>
        </div>
        {/* Outstanding badge */}
        {outstanding > 0 && (
          <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-red-50 border border-red-200 rounded-xl">
            <AlertTriangle size={15} className="text-red-500" />
            <span className="text-sm font-bold text-red-700">Outstanding: {fmtINR(outstanding)}</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* ── Left column (2/3) ──────────────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-5">

          {/* Stay summary */}
          <SectionCard title="Stay Summary" icon={<BedDouble size={14}/>} accent="#2563EB">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6">
              <div className="space-y-0.5">
                <InfoRow icon={<User size={13}/>}        label="Guest"        value={booking.guest_name} />
                <InfoRow icon={<Phone size={13}/>}       label="Mobile"       value={booking.mobile_number} />
                <InfoRow icon={<Building2 size={13}/>}   label="Site"         value={booking.site?.site_name} />
                <InfoRow icon={<BedDouble size={13}/>}   label="Room"         value={`${booking.room?.room_number} · ${booking.room?.room_type}`} />
                <InfoRow icon={<Users size={13}/>}       label="Guests"       value={booking.guest_count} />
              </div>
              <div className="space-y-0.5 mt-3 sm:mt-0">
                <InfoRow icon={<CalendarDays size={13}/>} label="Booked Check-in"   value={fmtDate(booking.check_in_date)} />
                <InfoRow icon={<CalendarDays size={13}/>} label="Booked Check-out"  value={fmtDate(booking.check_out_date)} />
                <InfoRow icon={<Clock size={13}/>}        label="Actual Arrival"    value={fmtDateTime(booking.actual_check_in)} />
                <InfoRow icon={<Clock size={13}/>}        label="Check-Out Now"     value={fmtDateTime(new Date())} />
                <InfoRow icon={<Moon size={13}/>}         label="Booked Nights"     value={`${bookedNights} night${bookedNights !== 1 ? 's' : ''}`} />
                <InfoRow icon={<Moon size={13}/>}         label="Actual Nights"     value={`${actualNights} night${actualNights !== 1 ? 's' : ''}`} bold />
              </div>
            </div>

            {/* ID info captured at check-in */}
            {(booking.id_type || booking.id_number) && (
              <div className="mt-4 p-3 bg-gray-50 rounded-xl border border-[#E5E7EB] flex items-center gap-3">
                <BadgeCheck size={16} className="text-blue-500 shrink-0" />
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">ID Verified at Check-In</p>
                  <p className="text-[13px] font-semibold text-gray-800">
                    {booking.id_type} · {booking.id_number}
                  </p>
                </div>
              </div>
            )}
          </SectionCard>

          {/* Payment summary */}
          <SectionCard title="Payment Summary" icon={<CreditCard size={14}/>} accent="#16A34A">
            <div className="mb-2">
              <AmountRow label={`Room rate (${fmtINR(ratePerNight)}/night × ${bookedNights} nights)`} value={fmtINR(totalCharged)} />
              <AmountRow label="Total Paid" value={fmtINR(totalPaid)} />
              <AmountRow label="Outstanding Balance" value={fmtINR(outstanding)} highlight />
            </div>

            {outstanding > 0 && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-100 rounded-xl mt-3">
                <AlertTriangle size={14} className="text-red-500 shrink-0" />
                <p className="text-[12px] font-bold text-red-700">
                  Collect {fmtINR(outstanding)} before guest leaves. Record it in Payments after check-out.
                </p>
              </div>
            )}

            {outstanding === 0 && totalPaid > 0 && (
              <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-100 rounded-xl mt-3">
                <CheckCircle size={14} className="text-green-600 shrink-0" />
                <p className="text-[12px] font-bold text-green-700">All payments settled. Good to go!</p>
              </div>
            )}

            {/* Payment history toggle */}
            {payments.length > 0 && (
              <div className="mt-4">
                <button
                  type="button"
                  onClick={() => setShowPayments(v => !v)}
                  className="flex items-center gap-1.5 text-[12px] font-bold text-blue-600 hover:text-blue-700"
                >
                  {showPayments ? <ChevronUp size={14}/> : <ChevronDown size={14}/>}
                  {showPayments ? 'Hide' : 'Show'} payment history ({payments.length} transaction{payments.length !== 1 ? 's' : ''})
                </button>

                {showPayments && (
                  <div className="mt-3 space-y-2">
                    {payments.map(p => (
                      <div key={p.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-[#F3F4F6]">
                        <div className="flex items-center gap-2.5">
                          <Receipt size={13} className="text-gray-400" />
                          <div>
                            <p className="text-[12px] font-bold text-gray-800">{p.payment_no}</p>
                            <p className="text-[10px] text-gray-400">
                              {fmtDate(p.payment_date)} · <PaymentBadge method={p.type_of_method} />
                            </p>
                          </div>
                        </div>
                        <span className={`text-[13px] font-extrabold ${p.transaction_type === 'credit' ? 'text-green-700' : 'text-red-600'}`}>
                          {p.transaction_type === 'credit' ? '+' : '−'}{fmtINR(p.payment_amt_in_base)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {payments.length === 0 && (
              <p className="text-[12px] text-gray-400 mt-3">No payments recorded for this booking.</p>
            )}
          </SectionCard>

        </div>

        {/* ── Right column (1/3) ─────────────────────────────────────────── */}
        <div className="space-y-5">

          {/* Quick stats */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Total Charged', value: fmtINR(totalCharged), icon: <CircleDollarSign size={16}/>, color: '#6B7280', bg: '#F9FAFB' },
              { label: 'Total Paid',    value: fmtINR(totalPaid),    icon: <Banknote size={16}/>,         color: '#16A34A', bg: '#F0FDF4' },
              { label: 'Outstanding',   value: fmtINR(outstanding),  icon: <TrendingUp size={16}/>,       color: outstanding > 0 ? '#DC2626' : '#16A34A', bg: outstanding > 0 ? '#FEF2F2' : '#F0FDF4' },
              { label: 'Nights Stayed', value: `${actualNights}N`,   icon: <Moon size={16}/>,             color: '#2563EB', bg: '#EFF6FF' },
            ].map(s => (
              <div key={s.label} className="rounded-xl border border-[#E5E7EB] p-3 flex flex-col gap-1" style={{ background: s.bg }}>
                <span style={{ color: s.color }}>{s.icon}</span>
                <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: s.color }}>{s.label}</p>
                <p className="text-[15px] font-extrabold text-gray-900">{s.value}</p>
              </div>
            ))}
          </div>

          {/* Check-out form */}
          <form onSubmit={handleSubmit} className="bg-white border border-[#E5E7EB] rounded-2xl overflow-hidden shadow-sm">
            <div className="h-1 bg-blue-600" />
            <div className="p-5 space-y-4">
              <h3 className="text-[14px] font-extrabold text-gray-900">Confirm Check-Out</h3>

              <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl space-y-1">
                <p className="text-[11px] font-bold text-blue-700 uppercase tracking-wider">Checking out</p>
                <p className="text-[15px] font-extrabold text-gray-900">{booking.guest_name}</p>
                <p className="text-[12px] text-blue-700">Room {booking.room?.room_number} · {actualNights} night{actualNights !== 1 ? 's' : ''}</p>
              </div>

              {/* Remarks */}
              <div>
                <label className="block text-[12px] font-bold text-gray-700 mb-1.5">
                  Final Remarks <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <div className="relative">
                  <FileText size={13} className="absolute left-3 top-3 text-gray-400 pointer-events-none" />
                  <textarea
                    value={remarks}
                    onChange={e => setRemarks(e.target.value)}
                    rows={3}
                    placeholder="Any notes about the stay, damages, or special requests…"
                    className="w-full pl-9 pr-3 py-2.5 border border-[#E5E7EB] rounded-xl text-sm text-gray-800 outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-blue-100 resize-none"
                  />
                </div>
              </div>

              {error && (
                <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-700">
                  <AlertTriangle size={14} className="mt-0.5 shrink-0" /> {error}
                </div>
              )}

              <div className="flex gap-3">
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
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors disabled:opacity-60 shadow-sm"
                >
                  {saving
                    ? <><RefreshCw size={14} className="animate-spin" /> Processing…</>
                    : <><LogOut size={14} /> Confirm Check-Out</>
                  }
                </button>
              </div>

              <p className="text-[10px] text-gray-400 text-center">
                This will mark the booking as <strong>Checked Out</strong> and free the room.
              </p>
            </div>
          </form>

        </div>
      </div>
    </div>
  );
}
