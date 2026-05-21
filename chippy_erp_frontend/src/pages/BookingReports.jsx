import React, { useEffect, useMemo, useState } from 'react';
import { BarChart3, CalendarDays, Download, FileText, Printer, RefreshCw, Search } from 'lucide-react';
import API_BASE_URL from '../config';
import { exportToCSV } from '../utils/exportCSV';

const todayStr = () => new Date().toISOString().split('T')[0];
const monthStartStr = () => {
  const d = new Date();
  d.setDate(1);
  return d.toISOString().split('T')[0];
};

const emptyReport = {
  from: monthStartStr(),
  to: todayStr(),
  days: 1,
  summary: {
    totalBookings: 0,
    totalRevenue: 0,
    activeRooms: 0,
    totalRoomNights: 0,
    occupiedRoomNights: 0,
    occupancyRate: 0,
  },
  statusCounts: {
    confirmed: 0,
    checked_in: 0,
    checked_out: 0,
    cancelled: 0,
  },
  revenueBySite: [],
  occupancyBySite: [],
  bookings: [],
};

const fmtINR = (n) =>
  `Rs. ${Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '-';

const statusLabel = (status) => String(status || '').replace('_', ' ');

export default function BookingReports() {
  const [sites, setSites] = useState([]);
  const [filters, setFilters] = useState({
    from: monthStartStr(),
    to: todayStr(),
    site_id: '',
  });
  const [report, setReport] = useState(emptyReport);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const token = localStorage.getItem('token');
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    const loadSites = async () => {
      const res = await fetch(`${API_BASE_URL}/api/locations/sites`, { headers });
      if (res.ok) setSites(await res.json());
    };
    loadSites();
  }, []);

  const fetchReport = async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({
        from: filters.from,
        to: filters.to,
        ...(filters.site_id && { site_id: filters.site_id }),
      });
      const res = await fetch(`${API_BASE_URL}/api/bookings/report?${params}`, { headers });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to load booking report');
      }
      const data = await res.json();
      setReport({
        ...emptyReport,
        ...data,
        summary: { ...emptyReport.summary, ...(data.summary || {}) },
        statusCounts: { ...emptyReport.statusCounts, ...(data.statusCounts || {}) },
        revenueBySite: data.revenueBySite || [],
        occupancyBySite: data.occupancyBySite || [],
        bookings: data.bookings || [],
      });
    } catch (e) {
      setError(e.message || 'Failed to load report');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, []);

  const csvRows = useMemo(() => report.bookings.map(b => ({
    Booking: b.booking_no,
    Guest: b.guest_name,
    Mobile: b.mobile_number,
    Site: b.site,
    Room: b.room,
    RoomType: b.room_type,
    CheckIn: fmtDate(b.check_in_date),
    CheckOut: fmtDate(b.check_out_date),
    Nights: b.total_nights,
    Status: statusLabel(b.status),
    Amount: b.total_amount,
  })), [report.bookings]);

  const printSummary = () => {
    const html = `
      <html>
        <head>
          <title>Booking Report</title>
          <style>
            body { font-family: Arial, sans-serif; color: #111827; padding: 24px; }
            h1 { margin: 0 0 4px; font-size: 22px; }
            .muted { color: #6b7280; font-size: 12px; margin-bottom: 20px; }
            .grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 20px; }
            .card { border: 1px solid #e5e7eb; border-radius: 8px; padding: 12px; }
            .label { color: #6b7280; font-size: 11px; font-weight: 700; text-transform: uppercase; }
            .value { font-size: 20px; font-weight: 800; margin-top: 6px; }
            table { width: 100%; border-collapse: collapse; margin-top: 16px; font-size: 12px; }
            th, td { border-bottom: 1px solid #e5e7eb; text-align: left; padding: 8px; }
            th { color: #4b5563; text-transform: uppercase; font-size: 10px; }
            .right { text-align: right; }
          </style>
        </head>
        <body>
          <h1>Booking Report</h1>
          <div class="muted">${fmtDate(report.from)} to ${fmtDate(report.to)}</div>
          <div class="grid">
            <div class="card"><div class="label">Bookings</div><div class="value">${report.summary.totalBookings}</div></div>
            <div class="card"><div class="label">Revenue</div><div class="value">${fmtINR(report.summary.totalRevenue)}</div></div>
            <div class="card"><div class="label">Occupancy</div><div class="value">${report.summary.occupancyRate}%</div></div>
            <div class="card"><div class="label">Room Nights</div><div class="value">${report.summary.occupiedRoomNights}/${report.summary.totalRoomNights}</div></div>
          </div>
          <h2>Revenue By Site</h2>
          <table>
            <thead><tr><th>Site</th><th class="right">Bookings</th><th class="right">Revenue</th></tr></thead>
            <tbody>${report.revenueBySite.map(s => `<tr><td>${s.site}</td><td class="right">${s.bookings}</td><td class="right">${fmtINR(s.revenue)}</td></tr>`).join('')}</tbody>
          </table>
          <h2>Bookings By Status</h2>
          <table>
            <thead><tr><th>Status</th><th class="right">Count</th></tr></thead>
            <tbody>${Object.entries(report.statusCounts).map(([k, v]) => `<tr><td>${statusLabel(k)}</td><td class="right">${v}</td></tr>`).join('')}</tbody>
          </table>
        </body>
      </html>
    `;
    const win = window.open('', '_blank');
    win.document.write(html);
    win.document.close();
    win.focus();
    win.print();
  };

  const summaryCards = [
    { label: 'Bookings', value: report.summary.totalBookings, note: `${report.days} day range` },
    { label: 'Occupancy', value: `${report.summary.occupancyRate}%`, note: `${report.summary.occupiedRoomNights}/${report.summary.totalRoomNights} room nights` },
    { label: 'Revenue', value: fmtINR(report.summary.totalRevenue), note: 'Excludes cancelled bookings' },
    { label: 'Active Rooms', value: report.summary.activeRooms, note: 'Rooms in selected scope' },
  ];

  return (
    <div className="max-w-[1600px] mx-auto p-4 md:p-0 space-y-5">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 border-b border-[#E5E7EB]">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900 flex items-center gap-2">
            <BarChart3 size={22} className="text-[#2563EB]" /> Booking Reports
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">Occupancy, revenue, status mix, export, and printable summaries.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => exportToCSV(csvRows, 'booking_report')} className="bg-white border border-[#E5E7EB] text-gray-700 px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 hover:bg-gray-50 shadow-sm">
            <Download size={15} /> CSV
          </button>
          <button onClick={printSummary} className="bg-white border border-[#E5E7EB] text-gray-700 px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 hover:bg-gray-50 shadow-sm">
            <Printer size={15} /> Print
          </button>
        </div>
      </div>

      <div className="bg-white border border-[#E5E7EB] rounded-[12px] p-4 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <div>
            <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1">From</label>
            <input type="date" value={filters.from} onChange={e => setFilters({ ...filters, from: e.target.value })} className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg text-sm outline-none focus:border-[#2563EB]" />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1">To</label>
            <input type="date" value={filters.to} onChange={e => setFilters({ ...filters, to: e.target.value })} className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg text-sm outline-none focus:border-[#2563EB]" />
          </div>
          <div className="md:col-span-2">
            <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1">Site</label>
            <select value={filters.site_id} onChange={e => setFilters({ ...filters, site_id: e.target.value })} className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg text-sm outline-none focus:border-[#2563EB] bg-white">
              <option value="">All Sites</option>
              {sites.map(s => <option key={s.id} value={s.id}>{s.site_name}</option>)}
            </select>
          </div>
          <div className="flex items-end">
            <button onClick={fetchReport} disabled={loading} className="w-full bg-[#2563EB] text-white px-4 py-2 rounded-lg font-bold text-sm flex items-center justify-center gap-2 hover:bg-blue-700 disabled:opacity-60">
              {loading ? <RefreshCw size={15} className="animate-spin" /> : <Search size={15} />} Run Report
            </button>
          </div>
        </div>
        {error && <p className="mt-3 text-sm font-bold text-red-600">{error}</p>}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
        {summaryCards.map(card => (
          <div key={card.label} className="bg-white border border-[#E5E7EB] rounded-[12px] p-4 shadow-sm">
            <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500">{card.label}</p>
            <p className="text-2xl font-extrabold text-gray-900 mt-2">{card.value}</p>
            <p className="text-[12px] font-semibold text-gray-400 mt-1">{card.note}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="bg-white border border-[#E5E7EB] rounded-[12px] p-4 shadow-sm">
          <h2 className="text-[14px] font-extrabold text-gray-900 mb-3">Bookings By Status</h2>
          <div className="space-y-2">
            {Object.entries(report.statusCounts).map(([status, count]) => (
              <div key={status} className="flex items-center justify-between rounded-lg bg-[#F8FAFC] border border-[#F3F4F6] px-3 py-2">
                <span className="text-[12px] font-bold text-gray-700 capitalize">{statusLabel(status)}</span>
                <span className="text-[13px] font-extrabold text-gray-900">{count}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="xl:col-span-2 bg-white border border-[#E5E7EB] rounded-[12px] p-4 shadow-sm">
          <h2 className="text-[14px] font-extrabold text-gray-900 mb-3">Revenue By Site</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm whitespace-nowrap">
              <thead className="text-left text-[11px] uppercase text-gray-500 border-b border-[#E5E7EB]">
                <tr>
                  <th className="py-2">Site</th>
                  <th className="py-2 text-right">Bookings</th>
                  <th className="py-2 text-right">Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F3F4F6]">
                {report.revenueBySite.length === 0 ? (
                  <tr><td colSpan={3} className="py-8 text-center text-gray-400">No revenue in this range.</td></tr>
                ) : report.revenueBySite.map(site => (
                  <tr key={site.site_id}>
                    <td className="py-3 font-bold text-gray-900">{site.site}</td>
                    <td className="py-3 text-right text-gray-600">{site.bookings}</td>
                    <td className="py-3 text-right font-extrabold text-gray-900">{fmtINR(site.revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="bg-white border border-[#E5E7EB] rounded-[12px] p-4 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[14px] font-extrabold text-gray-900 flex items-center gap-2">
            <FileText size={15} className="text-[#2563EB]" /> Booking Detail
          </h2>
          <p className="text-[12px] font-semibold text-gray-400">{report.bookings.length} rows</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="text-[11px] uppercase text-gray-500 border-b border-[#E5E7EB]">
              <tr>
                {['Booking', 'Guest', 'Site', 'Room', 'Check-in', 'Check-out', 'Nights', 'Status', 'Amount'].map(h => (
                  <th key={h} className="py-2 px-2">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F3F4F6]">
              {report.bookings.length === 0 ? (
                <tr><td colSpan={9} className="py-10 text-center text-gray-400">No bookings found for this range.</td></tr>
              ) : report.bookings.map(b => (
                <tr key={b.id} className="hover:bg-gray-50">
                  <td className="py-3 px-2 font-bold text-gray-600">{b.booking_no}</td>
                  <td className="py-3 px-2 font-extrabold text-gray-900">{b.guest_name}</td>
                  <td className="py-3 px-2 text-gray-600">{b.site}</td>
                  <td className="py-3 px-2 text-gray-600">{b.room}</td>
                  <td className="py-3 px-2 text-gray-600">{fmtDate(b.check_in_date)}</td>
                  <td className="py-3 px-2 text-gray-600">{fmtDate(b.check_out_date)}</td>
                  <td className="py-3 px-2 text-gray-600">{b.total_nights}</td>
                  <td className="py-3 px-2 capitalize text-gray-600">{statusLabel(b.status)}</td>
                  <td className="py-3 px-2 text-right font-extrabold text-gray-900">{fmtINR(b.total_amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
