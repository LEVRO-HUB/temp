import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronLeft, ChevronRight, RefreshCw, BedDouble, User,
  Phone, LogIn, LogOut, X, XCircle, AlertTriangle, Plus,
  Moon, CreditCard, CalendarDays, LayoutList
} from 'lucide-react';
import API_BASE_URL from '../config';

// ─── Layout constants ─────────────────────────────────────────────────────────
const ROOM_COL_W = 140;
const DAY_W      = 48;
const ROW_H      = 60;
const HEADER_H   = 72;

// ─── Status config ────────────────────────────────────────────────────────────
const STATUS = {
  confirmed:   { bg: '#2563EB', light: '#EFF6FF', text: '#1E40AF', label: 'Confirmed'   },
  checked_in:  { bg: '#16A34A', light: '#F0FDF4', text: '#14532D', label: 'Checked In'  },
  checked_out: { bg: '#6B7280', light: '#F9FAFB', text: '#374151', label: 'Checked Out' },
  cancelled:   { bg: '#DC2626', light: '#FEF2F2', text: '#991B1B', label: 'Cancelled'   },
};

const ROOM_TYPE_COLORS = {
  Room:     { bg: '#EFF6FF', text: '#1D4ED8' },
  OneBHK:   { bg: '#F0FDF4', text: '#15803D' },
  TwoBHK:   { bg: '#FFF7ED', text: '#C2410C' },
  ThreeBHK: { bg: '#FAF5FF', text: '#7E22CE' },
  Villa:    { bg: '#FFF1F2', text: '#BE123C' },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const toDateStr   = (d) => (typeof d === 'string' ? new Date(d) : d).toISOString().split('T')[0];
const addDays     = (s, n) => { const d = new Date(s); d.setDate(d.getDate() + n); return toDateStr(d); };
const daysBetween = (a, b) => Math.round((new Date(b) - new Date(a)) / 86400000);
const fmtDate     = (s) => new Date(s).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
const fmtShort    = (s) => new Date(s).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
const fmtINR      = (n) => `₹${parseFloat(n || 0).toLocaleString('en-IN')}`;

// ─── Booking detail popover ───────────────────────────────────────────────────
function BookingPopover({ booking, anchorRect, containerRect, onClose, onCheckIn, onCheckOut, onCancel }) {
  if (!booking || !anchorRect || !containerRect) return null;

  // Position: below the bar, clamp to screen
  let top  = anchorRect.bottom - containerRect.top + 8;
  let left = anchorRect.left   - containerRect.left;
  if (left + 288 > containerRect.width) left = containerRect.width - 296;
  if (left < 0) left = 4;

  const s = STATUS[booking.status] || STATUS.confirmed;

  return (
    <div
      className="absolute z-50 bg-white rounded-2xl shadow-2xl border border-gray-100 w-72 overflow-hidden"
      style={{ top, left }}
      onClick={e => e.stopPropagation()}
    >
      {/* colour accent top bar */}
      <div className="h-1.5 w-full" style={{ background: s.bg }} />

      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">BKG-{10000 + booking.id}</p>
            <p className="text-[16px] font-black text-gray-900 mt-0.5 leading-tight">{booking.guest_name}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ background: s.light, color: s.text }}>
              <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: s.bg }} />
              {s.label}
            </span>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-0.5 rounded-lg hover:bg-gray-100">
              <X size={14} />
            </button>
          </div>
        </div>

        {/* Info grid */}
        <div className="grid grid-cols-2 gap-2 mb-3">
          {[
            { icon: <CalendarDays size={11}/>, label: 'Check-in',  val: fmtDate(booking.check_in_date)  },
            { icon: <CalendarDays size={11}/>, label: 'Check-out', val: fmtDate(booking.check_out_date) },
            { icon: <Moon size={11}/>,         label: 'Nights',    val: booking.total_nights            },
            { icon: <CreditCard size={11}/>,   label: 'Amount',    val: fmtINR(booking.total_amount)    },
          ].map(({ icon, label, val }) => (
            <div key={label} className="bg-gray-50 rounded-xl p-2.5">
              <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1">{icon}{label}</p>
              <p className="text-[12px] font-bold text-gray-800 mt-0.5">{val}</p>
            </div>
          ))}
        </div>

        {booking.mobile_number && (
          <div className="flex items-center gap-1.5 text-[12px] text-gray-500 mb-3">
            <Phone size={11} className="text-gray-400" />{booking.mobile_number}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          {booking.status === 'confirmed' && (
            <>
              <button
                onClick={() => onCheckIn(booking)}
                className="flex-1 flex items-center justify-center gap-1.5 bg-green-600 hover:bg-green-700 text-white text-[11px] font-bold py-2.5 rounded-xl transition-colors"
              >
                <LogIn size={12} /> Check In
              </button>
              <button
                onClick={() => onCancel(booking)}
                className="flex items-center justify-center px-3 py-2.5 bg-red-50 hover:bg-red-100 text-red-500 rounded-xl transition-colors"
              >
                <XCircle size={14} />
              </button>
            </>
          )}
          {booking.status === 'checked_in' && (
            <>
              <button
                onClick={() => onCheckOut(booking)}
                className="flex-1 flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold py-2.5 rounded-xl transition-colors"
              >
                <LogOut size={12} /> Check Out
              </button>
              <button
                onClick={() => onCancel(booking)}
                className="flex items-center justify-center px-3 py-2.5 bg-red-50 hover:bg-red-100 text-red-500 rounded-xl transition-colors"
              >
                <XCircle size={14} />
              </button>
            </>
          )}
          {(booking.status === 'checked_out' || booking.status === 'cancelled') && (
            <p className="text-[11px] text-gray-400 italic text-center w-full py-1">No further actions</p>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Cancel confirm modal ─────────────────────────────────────────────────────
function CancelModal({ booking, onConfirm, onClose }) {
  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full">
        <div className="w-10 h-10 bg-red-50 rounded-full flex items-center justify-center mb-4">
          <AlertTriangle size={20} className="text-red-500" />
        </div>
        <h3 className="text-[15px] font-bold text-gray-900 mb-1">Cancel Booking?</h3>
        <p className="text-[13px] text-gray-500 mb-6">
          Cancel booking for <strong>{booking.guest_name}</strong>? This cannot be undone and the room will be freed.
        </p>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 text-sm font-bold text-gray-700 border border-gray-200 rounded-xl hover:bg-gray-50">Keep</button>
          <button onClick={onConfirm} className="flex-1 px-4 py-2.5 text-sm font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl">Yes, Cancel</button>
        </div>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function BookingGantt({ sites = [], onCreateBooking }) {
  const navigate     = useNavigate();
  const containerRef = useRef(null);
  const scrollRef    = useRef(null);
  const today        = toDateStr(new Date());

  const [fromDate, setFromDate] = useState(addDays(today, -3));
  const [numDays,  setNumDays]  = useState(28);
  const [siteId,   setSiteId]   = useState(sites[0]?.id || '');
  const [gantt,    setGantt]    = useState({ rooms: [] });
  const [loading,  setLoading]  = useState(false);
  const [toast,    setToast]    = useState(null);

  // Popover state: { booking, anchorRect }
  const [popover,  setPopover]  = useState(null);
  // Cancel modal
  const [cancelling, setCancelling] = useState(null);

  const toDate = addDays(fromDate, numDays);
  const dates  = Array.from({ length: numDays }, (_, i) => addDays(fromDate, i));

  // sync siteId when sites load
  useEffect(() => {
    if (sites.length > 0 && !siteId) setSiteId(sites[0].id);
  }, [sites]);

  // ── Fetch gantt data ────────────────────────────────────────────────────────
  const fetchGantt = useCallback(async () => {
    if (!siteId) return;
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(
        `${API_BASE_URL}/api/bookings/gantt?site_id=${siteId}&from=${fromDate}&to=${toDate}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.ok) setGantt(await res.json());
      else console.error('Gantt fetch failed', res.status);
    } catch (e) {
      console.error('Gantt error', e);
    } finally {
      setLoading(false);
    }
  }, [siteId, fromDate, toDate]);

  useEffect(() => { fetchGantt(); }, [fetchGantt]);

  // Auto-scroll to today on first load
  useEffect(() => {
    if (!scrollRef.current || gantt.rooms.length === 0) return;
    const todayOff = daysBetween(fromDate, today);
    if (todayOff >= 0 && todayOff < numDays) {
      scrollRef.current.scrollLeft = Math.max(0, todayOff * DAY_W - 100);
    }
  }, [gantt.rooms.length]);

  // ── Date navigation ─────────────────────────────────────────────────────────
  const shiftWindow = (n) => { setFromDate(d => addDays(d, n)); setPopover(null); };
  const goToday     = ()  => { setFromDate(addDays(today, -3)); setPopover(null); };

  // ── Cancel booking ──────────────────────────────────────────────────────────
  const handleCancel = async (booking) => {
    setCancelling(null);
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_BASE_URL}/api/bookings/${booking.id}/status`, {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body:    JSON.stringify({ status: 'cancelled' }),
    });
    if (res.ok) {
      showToast('Booking cancelled', 'error');
      fetchGantt();
    } else {
      const err = await res.json().catch(() => ({}));
      showToast(err.error || 'Failed to cancel', 'error');
    }
  };

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  // ── Bar geometry ────────────────────────────────────────────────────────────
  const getBar = (booking) => {
    const ci = toDateStr(booking.check_in_date);
    const co = toDateStr(booking.check_out_date);
    const startOff = Math.max(0, daysBetween(fromDate, ci));
    const endOff   = Math.min(numDays, daysBetween(fromDate, co));
    if (endOff <= startOff) return null;
    return {
      left:          startOff * DAY_W,
      width:         (endOff - startOff) * DAY_W,
      clippedLeft:   daysBetween(fromDate, ci) < 0,
      clippedRight:  daysBetween(fromDate, co) > numDays,
    };
  };

  // ── Click empty cell ────────────────────────────────────────────────────────
  const handleCellClick = (room, dateStr) => {
    setPopover(null);
    const covered = room.bookings.some(b => {
      const ci = toDateStr(b.check_in_date);
      const co = toDateStr(b.check_out_date);
      return dateStr >= ci && dateStr < co && b.status !== 'cancelled';
    });
    if (covered) return;
    if (onCreateBooking) onCreateBooking({ room, check_in_date: dateStr, site_id: siteId });
  };

  // ── Month grouping ──────────────────────────────────────────────────────────
  const months = [];
  dates.forEach((d, i) => {
    const dt  = new Date(d);
    const key = `${dt.getFullYear()}-${dt.getMonth()}`;
    if (!months.length || months[months.length - 1].key !== key) {
      months.push({ key, label: dt.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }), start: i, count: 1 });
    } else {
      months[months.length - 1].count++;
    }
  });

  // ── Room stats ──────────────────────────────────────────────────────────────
  const totalRooms     = gantt.rooms.length;
  const occupiedToday  = gantt.rooms.filter(r =>
    r.bookings.some(b => {
      const ci = toDateStr(b.check_in_date);
      const co = toDateStr(b.check_out_date);
      return today >= ci && today < co && (b.status === 'confirmed' || b.status === 'checked_in');
    })
  ).length;
  const availableToday = totalRooms - occupiedToday;

  return (
    <div className="flex flex-col h-full bg-white rounded-2xl border border-[#E5E7EB] overflow-hidden shadow-sm" ref={containerRef}>

      {/* ── Toast ──────────────────────────────────────────────────────────── */}
      {toast && (
        <div className={`fixed top-5 right-5 z-[200] px-4 py-3 rounded-xl shadow-lg text-sm font-bold text-white ${toast.type === 'error' ? 'bg-red-600' : 'bg-green-600'}`}>
          {toast.msg}
        </div>
      )}

      {/* ── Cancel modal ────────────────────────────────────────────────────── */}
      {cancelling && (
        <CancelModal
          booking={cancelling}
          onConfirm={() => handleCancel(cancelling)}
          onClose={() => setCancelling(null)}
        />
      )}

      {/* ── Toolbar ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-[#E5E7EB] bg-[#FAFAFA] flex-shrink-0 flex-wrap">

        {/* Site selector */}
        <select
          value={siteId}
          onChange={e => { setSiteId(e.target.value); setPopover(null); }}
          className="text-[13px] font-semibold border border-[#E5E7EB] rounded-lg px-3 py-2 bg-white outline-none focus:border-blue-500 min-w-[160px]"
        >
          {sites.map(s => <option key={s.id} value={s.id}>{s.site_name}</option>)}
        </select>

        {/* Date nav */}
        <div className="flex items-center gap-1 bg-white border border-[#E5E7EB] rounded-xl overflow-hidden">
          <button onClick={() => shiftWindow(-7)}  className="px-2.5 py-2 hover:bg-gray-50 text-gray-600 border-r border-[#E5E7EB]"><ChevronLeft size={15}/></button>
          <button onClick={goToday}                className="px-3 py-2 text-[12px] font-bold text-blue-600 hover:bg-blue-50">Today</button>
          <button onClick={() => shiftWindow(7)}   className="px-2.5 py-2 hover:bg-gray-50 text-gray-600 border-l border-[#E5E7EB]"><ChevronRight size={15}/></button>
        </div>

        {/* Range */}
        <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1">
          {[14, 28, 42, 60].map(d => (
            <button
              key={d}
              onClick={() => setNumDays(d)}
              className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-colors ${numDays === d ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              {d === 14 ? '2W' : d === 28 ? '1M' : d === 42 ? '6W' : '2M'}
            </button>
          ))}
        </div>

        {/* Refresh */}
        <button
          onClick={fetchGantt}
          className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin text-blue-500' : ''} />
        </button>

        {/* Stats strip */}
        <div className="hidden lg:flex items-center gap-3 ml-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 rounded-xl border border-blue-100">
            <BedDouble size={13} className="text-blue-600" />
            <span className="text-[11px] font-bold text-blue-700">{totalRooms} Rooms</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 rounded-xl border border-green-100">
            <span className="w-2 h-2 rounded-full bg-green-500" />
            <span className="text-[11px] font-bold text-green-700">{availableToday} Available today</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-50 rounded-xl border border-orange-100">
            <span className="w-2 h-2 rounded-full bg-orange-500" />
            <span className="text-[11px] font-bold text-orange-700">{occupiedToday} Occupied today</span>
          </div>
        </div>

        {/* Legend */}
        <div className="hidden xl:flex items-center gap-3 ml-auto">
          {Object.entries(STATUS).filter(([k]) => k !== 'cancelled').map(([k, s]) => (
            <div key={k} className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-sm" style={{ background: s.bg }} />
              <span className="text-[10px] font-semibold text-gray-500">{s.label}</span>
            </div>
          ))}
        </div>

        {/* New booking button */}
        <button
          onClick={() => onCreateBooking && onCreateBooking({})}
          className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-[12px] font-bold rounded-xl transition-colors ml-auto xl:ml-2"
        >
          <Plus size={14} /> New Booking
        </button>

        {/* List view */}
        <button
          onClick={() => navigate('/bookings')}
          className="flex items-center gap-1.5 px-3 py-2 bg-white border border-[#E5E7EB] text-gray-600 text-[12px] font-bold rounded-xl hover:bg-gray-50 transition-colors"
        >
          <LayoutList size={14} /> List
        </button>
      </div>

      {/* Loading bar */}
      {loading && (
        <div className="h-0.5 bg-blue-100 flex-shrink-0">
          <div className="h-full bg-blue-500 animate-pulse" style={{ width: '60%' }} />
        </div>
      )}

      {/* ── Gantt body ──────────────────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden relative" onClick={() => setPopover(null)}>

        {/* ── Fixed left: room labels ───────────────────────────────────────── */}
        <div className="flex-shrink-0 bg-white border-r border-[#E5E7EB] z-20" style={{ width: ROOM_COL_W }}>
          {/* top-left corner */}
          <div
            style={{ height: HEADER_H }}
            className="border-b-2 border-[#E5E7EB] flex items-end pb-2 px-3"
          >
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Rooms</span>
          </div>

          {/* room rows */}
          {gantt.rooms.map(room => {
            const rtc = ROOM_TYPE_COLORS[room.room_type] || ROOM_TYPE_COLORS.Room;
            const isOccupied = room.bookings.some(b => {
              const ci = toDateStr(b.check_in_date);
              const co = toDateStr(b.check_out_date);
              return today >= ci && today < co && (b.status === 'confirmed' || b.status === 'checked_in');
            });
            return (
              <div
                key={room.id}
                style={{ height: ROW_H }}
                className="border-b border-[#F3F4F6] flex flex-col justify-center px-3 bg-[#FAFAFA] hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ background: isOccupied ? '#F97316' : '#22C55E' }}
                    title={isOccupied ? 'Occupied today' : 'Available today'}
                  />
                  <span className="text-[13px] font-extrabold text-gray-900 truncate">{room.room_number}</span>
                </div>
                <span
                  className="self-start text-[9px] font-bold px-1.5 py-0.5 rounded-md"
                  style={{ background: rtc.bg, color: rtc.text }}
                >
                  {room.room_type}
                </span>
                {room.rate_per_night && (
                  <span className="text-[9px] text-gray-400 mt-0.5">
                    {fmtINR(room.rate_per_night)}/night
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* ── Scrollable grid ───────────────────────────────────────────────── */}
        <div ref={scrollRef} className="flex-1 overflow-x-auto overflow-y-auto relative">
          <div style={{ width: dates.length * DAY_W, minWidth: '100%' }}>

            {/* Month sub-header */}
            <div className="flex sticky top-0 z-10 bg-white" style={{ height: 24 }}>
              {months.map(m => (
                <div
                  key={m.key}
                  style={{ width: m.count * DAY_W, minWidth: m.count * DAY_W }}
                  className="flex-shrink-0 flex items-center px-2 border-r border-b border-dashed border-[#E5E7EB] bg-[#FAFAFA]"
                >
                  <span className="text-[10px] font-bold text-gray-500 truncate">{m.label}</span>
                </div>
              ))}
            </div>

            {/* Day header */}
            <div className="flex sticky z-10 bg-white border-b-2 border-[#E5E7EB]" style={{ top: 24, height: HEADER_H - 24 }}>
              {dates.map(d => {
                const dt         = new Date(d);
                const dow        = ['Su','Mo','Tu','We','Th','Fr','Sa'][dt.getDay()];
                const isToday    = d === today;
                const isWeekend  = [0, 6].includes(dt.getDay());
                return (
                  <div
                    key={d}
                    style={{ width: DAY_W, minWidth: DAY_W }}
                    className={`flex-shrink-0 flex flex-col items-center justify-center border-r border-[#F3F4F6] ${isWeekend ? 'bg-gray-50' : ''} ${isToday ? 'bg-blue-50' : ''}`}
                  >
                    <span className={`text-[9px] font-bold uppercase tracking-wider ${isToday ? 'text-blue-600' : 'text-gray-400'}`}>{dow}</span>
                    <div className={`mt-1 w-7 h-7 flex items-center justify-center rounded-full text-[14px] font-black ${isToday ? 'bg-blue-600 text-white' : 'text-gray-800'}`}>
                      {dt.getDate()}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* ── Room rows ────────────────────────────────────────────────── */}
            {gantt.rooms.map(room => (
              <div key={room.id} className="relative border-b border-[#F3F4F6]" style={{ height: ROW_H }}>

                {/* Day cells — background + click target */}
                <div className="absolute inset-0 flex">
                  {dates.map(d => {
                    const dt        = new Date(d);
                    const isWeekend = [0, 6].includes(dt.getDay());
                    const isToday   = d === today;
                    const isCovered = room.bookings.some(b => {
                      const ci = toDateStr(b.check_in_date);
                      const co = toDateStr(b.check_out_date);
                      return d >= ci && d < co && b.status !== 'cancelled';
                    });
                    return (
                      <div
                        key={d}
                        style={{ width: DAY_W, minWidth: DAY_W }}
                        title={!isCovered ? `Book ${room.room_number} from ${fmtShort(d)}` : ''}
                        className={`flex-shrink-0 h-full border-r border-[#F3F4F6] transition-colors
                          ${isWeekend ? 'bg-gray-50/50' : ''}
                          ${isToday   ? 'bg-blue-50/40' : ''}
                          ${!isCovered ? 'cursor-pointer hover:bg-green-50/60' : 'cursor-default'}
                        `}
                        onClick={() => handleCellClick(room, d)}
                      />
                    );
                  })}
                </div>

                {/* Today vertical line */}
                {daysBetween(fromDate, today) >= 0 && daysBetween(fromDate, today) < numDays && (
                  <div
                    className="absolute top-0 bottom-0 pointer-events-none z-10"
                    style={{
                      left:    daysBetween(fromDate, today) * DAY_W + DAY_W / 2 - 1,
                      width:   2,
                      background: 'rgba(37,99,235,0.35)',
                    }}
                  />
                )}

                {/* Booking bars */}
                {room.bookings.map(booking => {
                  const bar = getBar(booking);
                  if (!bar) return null;
                  const s = STATUS[booking.status] || STATUS.confirmed;
                  return (
                    <div
                      key={booking.id}
                      className="absolute z-20 flex items-center gap-1.5 px-2 cursor-pointer select-none overflow-hidden transition-all hover:brightness-95 hover:shadow-md"
                      style={{
                        top:                8,
                        bottom:             8,
                        left:               bar.left + 2,
                        width:              bar.width - 4,
                        background:         s.bg,
                        borderRadius:       `${bar.clippedLeft ? 0 : 8}px ${bar.clippedRight ? 0 : 8}px ${bar.clippedRight ? 0 : 8}px ${bar.clippedLeft ? 0 : 8}px`,
                        boxShadow:          '0 1px 4px rgba(0,0,0,0.15)',
                      }}
                      onClick={e => {
                        e.stopPropagation();
                        const gridEl = scrollRef.current;
                        if (!gridEl) return;
                        const anchorRect    = e.currentTarget.getBoundingClientRect();
                        const containerRect = gridEl.getBoundingClientRect();
                        setPopover({ booking, anchorRect, containerRect });
                      }}
                    >
                      <User size={10} className="flex-shrink-0 text-white opacity-80" />
                      <span className="text-[10px] font-bold text-white truncate leading-none">
                        {booking.guest_name}
                      </span>
                      {bar.width > 90 && (
                        <span className="text-[9px] text-white/70 flex-shrink-0">
                          {booking.total_nights}n
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}

            {/* Empty state */}
            {gantt.rooms.length === 0 && !loading && (
              <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                <BedDouble size={40} className="mb-3 opacity-30" />
                <p className="text-[14px] font-semibold">No rooms found for this site</p>
                <p className="text-[12px] mt-1 text-gray-400">Add rooms in Room Management first</p>
              </div>
            )}
          </div>
        </div>

        {/* ── Floating popover ─────────────────────────────────────────────── */}
        {popover && (
          <div className="absolute inset-0 pointer-events-none z-40" style={{ left: ROOM_COL_W }}>
            <div className="pointer-events-auto h-full relative">
              <BookingPopover
                booking={popover.booking}
                anchorRect={popover.anchorRect}
                containerRect={popover.containerRect}
                onClose={() => setPopover(null)}
                onCheckIn={b  => { setPopover(null); navigate(`/check-in/${b.id}`);  }}
                onCheckOut={b => { setPopover(null); navigate(`/check-out/${b.id}`); }}
                onCancel={b   => { setPopover(null); setCancelling(b);               }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
