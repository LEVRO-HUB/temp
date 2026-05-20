import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronLeft, ChevronRight, CalendarDays, RefreshCw,
  User, Phone, BedDouble, LogIn, LogOut, CheckCircle, XCircle, AlertTriangle, X, Maximize2
} from 'lucide-react';
import API_BASE_URL from '../config';

// ─── Constants ────────────────────────────────────────────────────────────────
const ROOM_COL_W  = 120;   // px — fixed left column width
const DAY_W       = 44;    // px — width per day cell
const ROW_H       = 52;    // px — height per room row
const HEADER_H    = 64;    // px — date header height

const STATUS_STYLES = {
  confirmed:   { bar: 'bg-blue-500',   border: 'border-blue-600',   text: 'text-white', dot: 'bg-blue-400'  },
  checked_in:  { bar: 'bg-emerald-500',border: 'border-emerald-600',text: 'text-white', dot: 'bg-emerald-400'},
  checked_out: { bar: 'bg-gray-400',   border: 'border-gray-500',   text: 'text-white', dot: 'bg-gray-300'  },
  cancelled:   { bar: 'bg-red-400',    border: 'border-red-500',    text: 'text-white', dot: 'bg-red-300'   },
};

const ROOM_TYPE_BADGE = {
  Room:      'bg-slate-100 text-slate-600',
  OneBHK:    'bg-violet-100 text-violet-600',
  TwoBHK:    'bg-amber-100 text-amber-700',
  ThreeBHK:  'bg-rose-100 text-rose-600',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const toDateStr = (d) => {
  const dt = typeof d === 'string' ? new Date(d) : d;
  return dt.toISOString().split('T')[0];
};

const addDays = (dateStr, n) => {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + n);
  return toDateStr(d);
};

const daysBetween = (a, b) => {
  const ms = new Date(b) - new Date(a);
  return Math.round(ms / 86400000);
};

const fmtDisplay = (dateStr) => {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
};

const fmtFull = (dateStr) => {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

const getDayLabel = (dateStr) => {
  const d = new Date(dateStr);
  return { day: d.getDate(), dow: ['Su','Mo','Tu','We','Th','Fr','Sa'][d.getDay()], isWeekend: [0,6].includes(d.getDay()) };
};

// ─── Booking Tooltip / Popover ────────────────────────────────────────────────
const BookingPopover = ({ booking, onClose, onCheckIn, onCheckOut, onCancel, style }) => {
  if (!booking) return null;
  const s = STATUS_STYLES[booking.status] || STATUS_STYLES.confirmed;

  return (
    <div
      className="absolute z-50 bg-white rounded-2xl shadow-2xl border border-gray-100 w-72 p-4"
      style={style}
      onClick={e => e.stopPropagation()}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">BKG-{10000 + booking.id}</p>
          <p className="text-[15px] font-black text-gray-900 mt-0.5">{booking.guest_name}</p>
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-0.5"><X size={16}/></button>
      </div>

      {/* Status badge */}
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider mb-3 ${
        booking.status === 'confirmed'   ? 'bg-blue-50 text-blue-600' :
        booking.status === 'checked_in'  ? 'bg-emerald-50 text-emerald-700' :
        booking.status === 'checked_out' ? 'bg-gray-100 text-gray-500' :
                                           'bg-red-50 text-red-500'
      }`}>
        <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`}/>
        {booking.status.replace('_', ' ')}
      </span>

      {/* Details grid */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        <div className="bg-gray-50 rounded-xl p-2.5">
          <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Check-in</p>
          <p className="text-[12px] font-bold text-gray-800 mt-0.5">{fmtFull(booking.check_in_date)}</p>
        </div>
        <div className="bg-gray-50 rounded-xl p-2.5">
          <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Check-out</p>
          <p className="text-[12px] font-bold text-gray-800 mt-0.5">{fmtFull(booking.check_out_date)}</p>
        </div>
        <div className="bg-gray-50 rounded-xl p-2.5">
          <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Nights</p>
          <p className="text-[12px] font-bold text-gray-800 mt-0.5">{booking.total_nights}</p>
        </div>
        <div className="bg-gray-50 rounded-xl p-2.5">
          <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Amount</p>
          <p className="text-[12px] font-bold text-gray-800 mt-0.5">₹{parseFloat(booking.total_amount).toLocaleString('en-IN')}</p>
        </div>
      </div>

      {/* Phone */}
      {booking.mobile_number && (
        <div className="flex items-center gap-2 text-[12px] text-gray-600 mb-4">
          <Phone size={12} className="text-gray-400"/>
          {booking.mobile_number}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        {booking.status === 'confirmed' && (
          <>
            <button onClick={() => onCheckIn(booking)} className="flex-1 flex items-center justify-center gap-1.5 bg-emerald-500 text-white text-[11px] font-bold py-2 rounded-xl hover:bg-emerald-600 transition-colors">
              <LogIn size={12}/> Check In
            </button>
            <button onClick={() => onCancel(booking)} className="flex items-center justify-center gap-1.5 bg-red-50 text-red-500 text-[11px] font-bold px-3 py-2 rounded-xl hover:bg-red-100 transition-colors">
              <XCircle size={12}/>
            </button>
          </>
        )}
        {booking.status === 'checked_in' && (
          <>
            <button onClick={() => onCheckOut(booking)} className="flex-1 flex items-center justify-center gap-1.5 bg-blue-500 text-white text-[11px] font-bold py-2 rounded-xl hover:bg-blue-600 transition-colors">
              <LogOut size={12}/> Check Out
            </button>
            <button onClick={() => onCancel(booking)} className="flex items-center justify-center gap-1.5 bg-red-50 text-red-500 text-[11px] font-bold px-3 py-2 rounded-xl hover:bg-red-100 transition-colors">
              <XCircle size={12}/>
            </button>
          </>
        )}
        {(booking.status === 'checked_out' || booking.status === 'cancelled') && (
          <p className="text-[11px] text-gray-400 italic text-center w-full">No actions available</p>
        )}
      </div>
    </div>
  );
};

// ─── Confirm Dialog ────────────────────────────────────────────────────────────
const ConfirmDialog = ({ open, title, message, onConfirm, onCancel, confirmLabel = 'Confirm', danger = false }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full border border-gray-100">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-4 ${danger ? 'bg-red-50' : 'bg-blue-50'}`}>
          <AlertTriangle size={20} className={danger ? 'text-red-500' : 'text-blue-500'}/>
        </div>
        <h3 className="text-[15px] font-bold text-gray-900 mb-1">{title}</h3>
        <p className="text-[13px] text-gray-500 mb-6">{message}</p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 px-4 py-2.5 text-sm font-bold text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50">Cancel</button>
          <button onClick={onConfirm} className={`flex-1 px-4 py-2.5 text-sm font-bold text-white rounded-xl ${danger ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-600 hover:bg-blue-700'}`}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
};

// ─── Main Gantt Component ──────────────────────────────────────────────────────
export default function BookingGantt({ sites = [], onCreateBooking }) {
  const navigate    = useNavigate();
  const today       = toDateStr(new Date());
  const [fromDate,  setFromDate]  = useState(addDays(today, -3));
  const [days,      setDays]      = useState(28);
  const [siteId,    setSiteId]    = useState(sites[0]?.id || '');
  const [gantt,     setGantt]     = useState({ rooms: [] });
  const [loading,   setLoading]   = useState(false);
  const [popover,   setPopover]   = useState(null);   // { booking, x, y }
  const [confirm,   setConfirm]   = useState(null);   // { action, booking }
  const scrollRef   = useRef(null);

  const toDate = addDays(fromDate, days);

  // Generate date array
  const dates = Array.from({ length: days }, (_, i) => addDays(fromDate, i));

  // ── Fetch ──────────────────────────────────────────────────────────────────
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
    } finally {
      setLoading(false);
    }
  }, [siteId, fromDate, toDate]);

  useEffect(() => { fetchGantt(); }, [fetchGantt]);

  // Auto-scroll to today on mount
  useEffect(() => {
    if (scrollRef.current) {
      const todayOffset = daysBetween(fromDate, today);
      if (todayOffset >= 0 && todayOffset < days) {
        scrollRef.current.scrollLeft = todayOffset * DAY_W - 120;
      }
    }
  }, [gantt]);

  // ── Navigation ─────────────────────────────────────────────────────────────
  const navigate = (n) => setFromDate(prev => addDays(prev, n));
  const goToToday = () => setFromDate(addDays(today, -3));

  // ── Status action ──────────────────────────────────────────────────────────
  const handleStatusChange = async (bookingId, status) => {
    const token = localStorage.getItem('token');
    await fetch(`${API_BASE_URL}/api/bookings/${bookingId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ status }),
    });
    setPopover(null);
    setConfirm(null);
    fetchGantt();
  };

  const askConfirm = (action, booking) => {
    setPopover(null);
    setConfirm({ action, booking });
  };

  // ── Booking bar geometry ────────────────────────────────────────────────────
  const getBarGeometry = (booking) => {
    const ciStr = toDateStr(booking.check_in_date);
    const coStr = toDateStr(booking.check_out_date);
    const startOff = Math.max(0, daysBetween(fromDate, ciStr));
    const endOff   = Math.min(days, daysBetween(fromDate, coStr));
    const width    = (endOff - startOff) * DAY_W;
    const left     = startOff * DAY_W;
    if (width <= 0) return null;
    return { left, width, startOff, endOff };
  };

  // ── Click on empty cell → create booking ───────────────────────────────────
  const handleCellClick = (room, dateStr) => {
    // Check if this cell is covered by a booking
    const covered = (gantt.rooms.find(r => r.id === room.id)?.bookings || []).some(b => {
      const ci = toDateStr(b.check_in_date);
      const co = toDateStr(b.check_out_date);
      return dateStr >= ci && dateStr < co;
    });
    if (covered) return;
    if (onCreateBooking) onCreateBooking({ room, check_in_date: dateStr, site_id: siteId });
  };

  // ── Months for header grouping ──────────────────────────────────────────────
  const months = [];
  let cur = null;
  dates.forEach((d, i) => {
    const dt = new Date(d);
    const key = `${dt.getFullYear()}-${dt.getMonth()}`;
    if (key !== cur) { months.push({ label: dt.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }), startIdx: i, count: 1 }); cur = key; }
    else months[months.length - 1].count++;
  });

  const totalGridW = dates.length * DAY_W;

  return (
    <div className="flex flex-col h-full bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">

      {/* ── Toolbar ─────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 px-5 py-3.5 border-b border-gray-100 bg-gray-50 flex-shrink-0 flex-wrap">
        {/* Site selector */}
        <select
          value={siteId}
          onChange={e => setSiteId(e.target.value)}
          className="text-[13px] font-semibold border border-gray-200 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-blue-500 outline-none min-w-[160px]"
        >
          {sites.map(s => <option key={s.id} value={s.id}>{s.site_name}</option>)}
        </select>

        {/* Nav arrows */}
        <div className="flex items-center gap-1">
          <button onClick={() => navigate(-7)}  className="p-1.5 rounded-lg hover:bg-gray-200 text-gray-600 transition-colors"><ChevronLeft size={16}/></button>
          <button onClick={() => navigate(-1)}  className="p-1.5 rounded-lg hover:bg-gray-200 text-gray-600 transition-colors text-[11px] font-bold px-2">‹1d</button>
          <button onClick={goToToday}           className="px-3 py-1.5 text-[12px] font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors">Today</button>
          <button onClick={() => navigate(1)}   className="p-1.5 rounded-lg hover:bg-gray-200 text-gray-600 transition-colors text-[11px] font-bold px-2">1d›</button>
          <button onClick={() => navigate(7)}   className="p-1.5 rounded-lg hover:bg-gray-200 text-gray-600 transition-colors"><ChevronRight size={16}/></button>
        </div>

        {/* Range selector */}
        <div className="flex items-center gap-1 bg-gray-200 rounded-lg p-0.5">
          {[14, 28, 42].map(d => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className={`px-2.5 py-1 text-[11px] font-bold rounded-md transition-colors ${days === d ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-800'}`}
            >
              {d}d
            </button>
          ))}
        </div>

        {/* Refresh */}
        <button onClick={fetchGantt} className={`p-1.5 rounded-lg hover:bg-gray-200 text-gray-500 transition-colors ml-auto ${loading ? 'animate-spin' : ''}`}>
          <RefreshCw size={15}/>
        </button>

        {/* Legend */}
        <div className="hidden lg:flex items-center gap-3">
          {Object.entries({ confirmed: 'Confirmed', checked_in: 'Checked In', checked_out: 'Checked Out' }).map(([k, label]) => (
            <div key={k} className="flex items-center gap-1.5">
              <div className={`w-3 h-3 rounded-sm ${STATUS_STYLES[k].bar}`}/>
              <span className="text-[10px] font-semibold text-gray-500">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Loading bar ─────────────────────────────────────────────── */}
      {loading && <div className="h-0.5 bg-blue-100"><div className="h-full bg-blue-500 animate-pulse w-1/2"/></div>}

      {/* ── Gantt body ──────────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden" onClick={() => setPopover(null)}>

        {/* Fixed left room column */}
        <div className="flex-shrink-0 border-r border-gray-200 bg-white z-10" style={{ width: ROOM_COL_W }}>
          {/* Header placeholder */}
          <div style={{ height: HEADER_H }} className="border-b border-gray-200 flex items-end pb-2 px-3">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Rooms</span>
          </div>
          {/* Room rows */}
          {gantt.rooms.map(room => (
            <div
              key={room.id}
              style={{ height: ROW_H }}
              className="border-b border-gray-100 flex flex-col justify-center px-3 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-1.5 mb-0.5">
                <BedDouble size={11} className="text-gray-400 flex-shrink-0"/>
                <span className="text-[12px] font-extrabold text-gray-900 truncate">{room.room_number}</span>
              </div>
              <span className={`self-start text-[9px] font-bold px-1.5 py-0.5 rounded-md ${ROOM_TYPE_BADGE[room.room_type] || 'bg-gray-100 text-gray-500'}`}>
                {room.room_type}
              </span>
              {room.rate_per_night && (
                <span className="text-[9px] text-gray-400 mt-0.5">₹{parseFloat(room.rate_per_night).toLocaleString('en-IN')}/n</span>
              )}
            </div>
          ))}
        </div>

        {/* Scrollable Gantt grid */}
        <div ref={scrollRef} className="flex-1 overflow-x-auto overflow-y-hidden">
          <div style={{ width: totalGridW, minWidth: '100%' }}>

            {/* Date header — month row */}
            <div className="flex border-b border-gray-100" style={{ height: 24 }}>
              {months.map((m, i) => (
                <div
                  key={i}
                  style={{ width: m.count * DAY_W }}
                  className="flex-shrink-0 flex items-center px-2 border-r border-gray-100"
                >
                  <span className="text-[10px] font-bold text-gray-500 truncate">{m.label}</span>
                </div>
              ))}
            </div>

            {/* Date header — day row */}
            <div className="flex border-b border-gray-200" style={{ height: HEADER_H - 24 }}>
              {dates.map(d => {
                const { day, dow, isWeekend } = getDayLabel(d);
                const isToday = d === today;
                return (
                  <div
                    key={d}
                    style={{ width: DAY_W }}
                    className={`flex-shrink-0 flex flex-col items-center justify-center border-r border-gray-100 ${isWeekend ? 'bg-gray-50' : ''}`}
                  >
                    <span className={`text-[9px] font-bold uppercase ${isToday ? 'text-blue-600' : 'text-gray-400'}`}>{dow}</span>
                    <span className={`text-[13px] font-black mt-0.5 w-7 h-7 flex items-center justify-center rounded-full ${isToday ? 'bg-blue-600 text-white' : 'text-gray-700'}`}>{day}</span>
                  </div>
                );
              })}
            </div>

            {/* Room rows */}
            {gantt.rooms.map(room => (
              <div key={room.id} className="relative border-b border-gray-100" style={{ height: ROW_H }}>

                {/* Background day cells (clickable for new booking) */}
                <div className="absolute inset-0 flex">
                  {dates.map(d => {
                    const isWeekend = [0, 6].includes(new Date(d).getDay());
                    const isToday   = d === today;
                    return (
                      <div
                        key={d}
                        style={{ width: DAY_W }}
                        className={`flex-shrink-0 h-full border-r border-gray-100 cursor-pointer hover:bg-blue-50/40 transition-colors ${isWeekend ? 'bg-gray-50/60' : ''} ${isToday ? 'bg-blue-50/30' : ''}`}
                        onClick={() => handleCellClick(room, d)}
                      />
                    );
                  })}
                </div>

                {/* Today line */}
                {daysBetween(fromDate, today) >= 0 && daysBetween(fromDate, today) < days && (
                  <div
                    className="absolute top-0 bottom-0 w-0.5 bg-blue-400/60 z-10 pointer-events-none"
                    style={{ left: daysBetween(fromDate, today) * DAY_W + DAY_W / 2 }}
                  />
                )}

                {/* Booking bars */}
                {room.bookings.map(booking => {
                  const geo = getBarGeometry(booking);
                  if (!geo) return null;
                  const s = STATUS_STYLES[booking.status] || STATUS_STYLES.confirmed;
                  return (
                    <div
                      key={booking.id}
                      className={`absolute top-3 bottom-3 rounded-lg ${s.bar} ${s.border} border cursor-pointer select-none overflow-hidden flex items-center px-2 gap-1.5 shadow-sm hover:brightness-110 hover:shadow-md transition-all z-20`}
                      style={{ left: geo.left + 2, width: geo.width - 4 }}
                      onClick={e => {
                        e.stopPropagation();
                        // Compute popover position
                        const rect = e.currentTarget.closest('.overflow-x-auto').getBoundingClientRect();
                        const barRect = e.currentTarget.getBoundingClientRect();
                        setPopover({ booking, x: barRect.left - rect.left, y: barRect.top - rect.top + ROW_H - 6 });
                      }}
                    >
                      <User size={10} className={`flex-shrink-0 ${s.text} opacity-80`}/>
                      <span className={`text-[10px] font-bold truncate ${s.text}`}>{booking.guest_name}</span>
                      {geo.width > 100 && (
                        <span className={`text-[9px] ${s.text} opacity-70 flex-shrink-0`}>
                          {booking.total_nights}n
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}

            {gantt.rooms.length === 0 && !loading && (
              <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                <CalendarDays size={40} className="mb-3 opacity-40"/>
                <p className="text-sm font-medium">No rooms found for this site</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Popover ──────────────────────────────────────────────────── */}
      {popover && (
        <div className="absolute inset-0 pointer-events-none z-40" style={{ position: 'absolute' }}>
          {/* We render it fixed so it floats correctly */}
        </div>
      )}
      {popover && (() => {
        const scrollEl = scrollRef.current;
        if (!scrollEl) return null;
        const containerRect = scrollEl.getBoundingClientRect();
        const left = Math.min(containerRect.left + popover.x + ROOM_COL_W, window.innerWidth - 300);
        const top  = containerRect.top + popover.y;
        return (
          <BookingPopover
            booking={popover.booking}
            style={{ position: 'fixed', top, left }}
            onClose={() => setPopover(null)}
            onCheckIn={b => navigate(`/check-in/${b.id}`)}
            onCheckOut={b => askConfirm('checked_out', b)}
            onCancel={b => askConfirm('cancelled', b)}
          />
        );
      })()}

      {/* ── Confirm dialog ───────────────────────────────────────────── */}
      {confirm && (
        <ConfirmDialog
          open
          title={
            confirm.action === 'checked_in'  ? 'Check In Guest?' :
            confirm.action === 'checked_out' ? 'Check Out Guest?' : 'Cancel Booking?'
          }
          message={
            confirm.action === 'checked_in'  ? `Check in ${confirm.booking.guest_name} now?` :
            confirm.action === 'checked_out' ? `Mark ${confirm.booking.guest_name} as checked out?` :
                                               `Cancel booking for ${confirm.booking.guest_name}? This cannot be undone.`
          }
          confirmLabel={
            confirm.action === 'checked_in'  ? 'Check In' :
            confirm.action === 'checked_out' ? 'Check Out' : 'Cancel Booking'
          }
          danger={confirm.action === 'cancelled'}
          onConfirm={() => handleStatusChange(confirm.booking.id, confirm.action)}
          onCancel={() => setConfirm(null)}
        />
      )}
    </div>
  );
}
