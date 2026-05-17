import React, { useState, useEffect } from 'react';
import { Plus, Eye, Edit2, Calendar, ArrowLeft, User, Phone, Mail, MapPin, Building2, BedDouble, Clock, PhoneCall, Clock3, Flag, FileText, Info, X, Search } from 'lucide-react';
import Pagination from '../components/Pagination';
import API_BASE_URL from '../config';

export default function SalesEnquiry() {
  const [enquiries, setEnquiries] = useState([]);
  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(true);

  const [viewMode, setViewMode] = useState('list');
  const [editId, setEditId] = useState(null);
  const [isViewOnly, setIsViewOnly] = useState(false);

  const [form, setForm] = useState({
    guest_name: '', mobile_number: '', place: '', site_id: '',
    room_type_requested: 'Room', check_in_date: '', check_out_date: '', no_of_days: '',
    enquiry_source: 'walk_in', remarks: '', status: 'new', time: ''
  });

  const [employees, setEmployees] = useState([]);
  const [filterSite, setFilterSite] = useState('All Sites');
  const [filterStatus, setFilterStatus] = useState('All Status');
  const [filterSource, setFilterSource] = useState('All Sources');
  const [filterEmployee, setFilterEmployee] = useState('');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1 });
  const [limit] = useState(10);

  useEffect(() => {
    fetchData();
  }, [currentPage, filterStatus, searchTerm]); // Refresh on page or major filter change

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const headers = { 'Authorization': 'Bearer ' + token };

      const queryParams = new URLSearchParams({
        page: currentPage,
        limit,
        status: filterStatus !== 'All Status' ? filterStatus : '',
        search: searchTerm
      });

      const [resEnq, resSites, resEmps] = await Promise.all([
        fetch(`${API_BASE_URL}/api/enquiries?${queryParams}`, { headers }),
        fetch(`${API_BASE_URL}/api/locations/sites`, { headers }),
        fetch(`${API_BASE_URL}/api/employees`, { headers })
      ]);

      if (resEnq.ok) {
        const result = await resEnq.json();
        setEnquiries(result.data);
        setPagination({ total: result.total, totalPages: result.totalPages });
      }
      if (resSites.ok) setSites(await resSites.json());
      if (resEmps.ok) setEmployees(await resEmps.json());
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isViewOnly) return setViewMode('list');

    const token = localStorage.getItem('token');
    const method = editId ? 'PUT' : 'POST';
    const url = editId ? `${API_BASE_URL}/api/enquiries/${editId}` : `${API_BASE_URL}/api/enquiries`;

    await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
      body: JSON.stringify({ ...form, no_of_days: parseInt(form.no_of_days) || 0 })
    });

    resetForm();
    fetchData();
  };

  const handleEdit = (enq, viewOnly = false) => {
    setForm({
      guest_name: enq.guest_name,
      mobile_number: enq.mobile_number,
      place: enq.place || '',
      site_id: enq.site_id || '',
      room_type_requested: enq.room_type_requested || 'Room',
      check_in_date: enq.check_in_date ? new Date(enq.check_in_date).toISOString().split('T')[0] : '',
      check_out_date: enq.check_out_date ? new Date(enq.check_out_date).toISOString().split('T')[0] : '',
      no_of_days: enq.no_of_days || '',
      enquiry_source: enq.enquiry_source || 'walk_in',
      remarks: enq.remarks || '',
      status: enq.status || 'new',
      time: ''
    });
    setEditId(enq.id);
    setIsViewOnly(viewOnly);
    setViewMode('create');
  };

  const resetForm = () => {
    setForm({ guest_name: '', mobile_number: '', place: '', site_id: '', room_type_requested: 'Room', check_in_date: '', check_out_date: '', no_of_days: '', enquiry_source: 'walk_in', remarks: '', status: 'new', time: '' });
    setEditId(null);
    setIsViewOnly(false);
    setViewMode('list');
  };

  const getStatusPill = (status) => {
    if (!status) return null;
    const lower = status.toLowerCase();
    if (lower === 'new') return <span className="bg-blue-50 text-blue-600 px-3 py-1 rounded border border-blue-100 text-[10px] font-bold uppercase tracking-wider">New</span>;
    if (lower === 'follow-up' || lower === 'follow up') return <span className="bg-orange-50 text-orange-600 px-3 py-1 rounded border border-orange-100 text-[10px] font-bold uppercase tracking-wider">Follow Up</span>;
    if (lower === 'converted') return <span className="bg-green-50 text-green-600 px-3 py-1 rounded border border-green-100 text-[10px] font-bold uppercase tracking-wider">Converted</span>;
    if (lower === 'lost') return <span className="bg-red-50 text-red-600 px-3 py-1 rounded border border-red-100 text-[10px] font-bold uppercase tracking-wider">Lost</span>;
    return <span className="bg-gray-50 text-gray-600 px-3 py-1 rounded border border-gray-200 text-[10px] font-bold uppercase tracking-wider">{status}</span>;
  }

  const filteredData = enquiries.filter(e => {
    if (filterSite !== 'All Sites' && e.site?.site_name !== filterSite) return false;
    if (filterStatus !== 'All Status' && (e.status || '').toLowerCase() !== filterStatus.toLowerCase()) return false;
    if (filterSource !== 'All Sources' && (e.enquiry_source || 'Walk-in') !== filterSource) return false;

    if (filterEmployee && e.employee?.name !== filterEmployee) return false;

    const eDateStr = e.enquiry_time || e.created_at;
    if (eDateStr) {
      const eDate = new Date(eDateStr);
      eDate.setHours(0, 0, 0, 0);
      if (filterDateFrom) {
        const fFrom = new Date(filterDateFrom);
        fFrom.setHours(0, 0, 0, 0);
        if (eDate < fFrom) return false;
      }
      if (filterDateTo) {
        const fTo = new Date(filterDateTo);
        fTo.setHours(0, 0, 0, 0);
        if (eDate > fTo) return false;
      }
    }
    return true;
  });

  if (viewMode === 'create') {
    return (
      <div className="bg-[#F8FAFC] min-h-[calc(100vh-4rem)] p-4 md:p-8 md:-m-8 border-0 md:border-l border-[#E5E7EB]">

        <div className="flex items-center gap-3 mb-6">
          <button onClick={resetForm} className="p-2 bg-white border border-[#E5E7EB] rounded-lg text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-colors shadow-sm">
            <ArrowLeft size={18} strokeWidth={2.5} />
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-900 leading-tight">
              {isViewOnly ? 'View Enquiry' : (editId ? 'Edit Enquiry' : 'Add Sales Enquiry')}
            </h1>
            <p className="text-sm font-medium text-gray-500">{isViewOnly ? 'Reviewing guest enquiry' : 'Record a new customer enquiry'}</p>
          </div>
        </div>

        {isViewOnly ? (
          <div className="bg-white rounded-[20px] shadow-[0_2px_15px_rgb(0,0,0,0.03)] border border-[#E5E7EB] p-8 max-w-[1200px] relative overflow-hidden">
            <div className="flex items-center gap-3 mb-8 text-[#2563EB]">
              <div className="p-2 bg-blue-50 rounded-full">
                <User size={18} strokeWidth={2.5} />
              </div>
              <h2 className="text-[15px] font-extrabold text-gray-900 tracking-wide">Guest Information</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-x-8 gap-y-8">
              {/* Guest Name */}
              <div>
                <div className="flex items-center gap-2 mb-2.5 text-[#4B5563]">
                  <User size={15} strokeWidth={2.5} className="text-[#3B82F6]" />
                  <span className="text-[12px] font-bold">Guest Name <span className="text-red-500">*</span></span>
                </div>
                <div className="w-full px-4 py-3 bg-[#F9FAFB] border border-[#F3F4F6] rounded-xl text-[13px] font-semibold text-gray-900">
                  {form.guest_name || '--'}
                </div>
              </div>

              {/* Mobile Number */}
              <div>
                <div className="flex items-center gap-2 mb-2.5 text-[#4B5563]">
                  <Phone size={15} strokeWidth={2.5} className="text-[#3B82F6]" />
                  <span className="text-[12px] font-bold">Mobile Number <span className="text-red-500">*</span></span>
                </div>
                <div className="w-full px-4 py-3 bg-[#F9FAFB] border border-[#F3F4F6] rounded-xl text-[13px] font-semibold text-gray-900">
                  {form.mobile_number || '--'}
                </div>
              </div>

              {/* Email Address */}
              <div>
                <div className="flex items-center gap-2 mb-2.5 text-[#4B5563]">
                  <Mail size={15} strokeWidth={2.5} className="text-[#3B82F6]" />
                  <span className="text-[12px] font-bold">Email Address</span>
                </div>
                <div className="w-full px-4 py-3 bg-[#F9FAFB] border border-[#F3F4F6] rounded-xl text-[13px] font-medium text-gray-500">
                  {form.email || 'Email address'}
                </div>
              </div>

              {/* Place / City */}
              <div>
                <div className="flex items-center gap-2 mb-2.5 text-[#4B5563]">
                  <MapPin size={15} strokeWidth={2.5} className="text-[#3B82F6]" />
                  <span className="text-[12px] font-bold">Place / City</span>
                </div>
                <div className="w-full px-4 py-3 bg-[#F9FAFB] border border-[#F3F4F6] rounded-xl text-[13px] font-medium text-gray-900">
                  {form.place || '--'}
                </div>
              </div>

              {/* Site */}
              <div>
                <div className="flex items-center gap-2 mb-2.5 text-[#4B5563]">
                  <Building2 size={15} strokeWidth={2.5} className="text-[#3B82F6]" />
                  <span className="text-[12px] font-bold">Site <span className="text-red-500">*</span></span>
                </div>
                <div className="w-full px-4 py-3 bg-[#F9FAFB] border border-[#F3F4F6] rounded-xl text-[13px] font-medium text-gray-900">
                  {sites.find(s => s.id == form.site_id)?.site_name || 'Alwarpet'}
                </div>
              </div>

              {/* Room Type */}
              <div>
                <div className="flex items-center gap-2 mb-2.5 text-[#4B5563]">
                  <BedDouble size={15} strokeWidth={2.5} className="text-[#3B82F6]" />
                  <span className="text-[12px] font-bold">Room Type Requested</span>
                </div>
                <div className="w-full px-4 py-3 bg-[#F9FAFB] border border-[#F3F4F6] rounded-xl text-[13px] font-medium text-gray-500">
                  {form.room_type_requested || 'Select Room Type'}
                </div>
              </div>

              {/* Check-in Date */}
              <div>
                <div className="flex items-center gap-2 mb-2.5 text-[#4B5563]">
                  <Calendar size={15} strokeWidth={2.5} className="text-[#3B82F6]" />
                  <span className="text-[12px] font-bold">Check-in Date</span>
                </div>
                <div className="w-full px-4 py-3 bg-[#F9FAFB] border border-[#F3F4F6] rounded-xl text-[13px] font-medium text-gray-900">
                  {form.check_in_date ? form.check_in_date.split('-').reverse().join('-') : '--'}
                </div>
              </div>

              {/* Check-out Date */}
              <div>
                <div className="flex items-center gap-2 mb-2.5 text-[#4B5563]">
                  <Calendar size={15} strokeWidth={2.5} className="text-[#3B82F6]" />
                  <span className="text-[12px] font-bold">Check-out Date</span>
                </div>
                <div className="w-full px-4 py-3 bg-[#F9FAFB] border border-[#F3F4F6] rounded-xl text-[13px] font-medium text-gray-900">
                  {form.check_out_date ? form.check_out_date.split('-').reverse().join('-') : '--'}
                </div>
              </div>

              {/* No. of Days */}
              <div>
                <div className="flex items-center gap-2 mb-2.5 text-[#4B5563]">
                  <Clock size={15} strokeWidth={2.5} className="text-[#3B82F6]" />
                  <span className="text-[12px] font-bold">No. of Days</span>
                </div>
                <div className="w-full px-4 py-3 bg-[#F9FAFB] border border-[#F3F4F6] rounded-xl text-[13px] font-medium text-gray-900">
                  {form.no_of_days || '--'}
                </div>
              </div>

              {/* Enquiry Source */}
              <div>
                <div className="flex items-center gap-2 mb-2.5 text-[#4B5563]">
                  <PhoneCall size={15} strokeWidth={2.5} className="text-[#3B82F6]" />
                  <span className="text-[12px] font-bold">Enquiry Source <span className="text-red-500">*</span></span>
                </div>
                <div className="w-full px-4 py-3 bg-[#F9FAFB] border border-[#F3F4F6] rounded-xl text-[13px] font-medium text-gray-900">
                  {form.enquiry_source || '--'}
                </div>
              </div>

              {/* Enquiry Time */}
              <div>
                <div className="flex items-center gap-2 mb-2.5 text-[#4B5563]">
                  <Clock3 size={15} strokeWidth={2.5} className="text-[#3B82F6]" />
                  <span className="text-[12px] font-bold">Enquiry Time</span>
                </div>
                <div className="w-full px-4 py-3 bg-[#F9FAFB] border border-[#F3F4F6] rounded-xl text-[13px] font-medium text-gray-500">
                  --:--
                </div>
              </div>

              {/* Status */}
              <div>
                <div className="flex items-center gap-2 mb-2.5 text-[#4B5563]">
                  <Flag size={15} strokeWidth={2.5} className="text-[#3B82F6]" />
                  <span className="text-[12px] font-bold">Status <span className="text-red-500">*</span></span>
                </div>
                <div className="flex items-center">
                  {getStatusPill(form.status)}
                </div>
              </div>

              {/* Remarks */}
              <div>
                <div className="flex items-center gap-2 mb-2.5 text-[#4B5563]">
                  <FileText size={15} strokeWidth={2.5} className="text-[#3B82F6]" />
                  <span className="text-[12px] font-bold">Remarks</span>
                </div>
                <div className="w-full px-4 py-3 bg-[#F9FAFB] border border-[#F3F4F6] rounded-xl text-[13px] font-medium text-gray-500">
                  {form.remarks || 'Additional remarks'}
                </div>
              </div>
            </div>

            <div className="mt-12 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
              <div className="flex-1 bg-[#F5F3FF] rounded-xl p-4 flex items-center gap-3 border border-purple-100">
                <div className="text-[#6D28D9] shrink-0">
                  <Info size={18} strokeWidth={2.5} />
                </div>
                <p className="text-[13px] font-semibold text-[#5B21B6]">This enquiry was created on 01-05-2026 21:50</p>
              </div>
              <button onClick={resetForm} className="px-6 py-4 text-[13px] font-bold text-white bg-[#4F46E5] rounded-xl hover:bg-[#4338CA] transition-all shadow-[0_4px_14px_rgba(79,70,229,0.25)] flex items-center justify-center gap-2 shrink-0">
                <X size={16} strokeWidth={2.5} /> Close View
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-[#E5E7EB] p-6 max-w-[1600px]">
            <fieldset disabled={isViewOnly} className="grid grid-cols-1 md:grid-cols-4 gap-x-6 gap-y-5">
              <div>
                <label className="flex items-center gap-1.5 text-[13px] font-bold text-[#4B5563] mb-1.5"><User size={14} className="text-[#3B82F6]" /> Guest Name <span className="text-red-500">*</span></label>
                <input required value={form.guest_name} onChange={e => setForm({ ...form, guest_name: e.target.value })} className="w-full px-3 py-2 bg-white border border-[#E5E7EB] rounded-lg text-sm text-gray-900 outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] placeholder:text-gray-400 disabled:bg-gray-50 disabled:text-gray-500 transition-all font-medium" placeholder="Guest name" />
              </div>
              <div>
                <label className="flex items-center gap-1.5 text-[13px] font-bold text-[#4B5563] mb-1.5"><Phone size={14} className="text-[#3B82F6]" /> Mobile Number <span className="text-red-500">*</span></label>
                <input required type="tel" value={form.mobile_number} onChange={e => setForm({ ...form, mobile_number: e.target.value })} className="w-full px-3 py-2 bg-white border border-[#E5E7EB] rounded-lg text-sm text-gray-900 outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] placeholder:text-gray-400 disabled:bg-gray-50 disabled:text-gray-500 transition-all font-medium" placeholder="Mobile number" />
              </div>
              <div>
                <label className="flex items-center gap-1.5 text-[13px] font-bold text-[#4B5563] mb-1.5"><MapPin size={14} className="text-[#3B82F6]" /> Place / City</label>
                <input value={form.place} onChange={e => setForm({ ...form, place: e.target.value })} className="w-full px-3 py-2 bg-white border border-[#E5E7EB] rounded-lg text-sm text-gray-900 outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] placeholder:text-gray-400 disabled:bg-gray-50 disabled:text-gray-500 transition-all font-medium" placeholder="Place or city" />
              </div>
              <div>
                <label className="flex items-center gap-1.5 text-[13px] font-bold text-[#4B5563] mb-1.5"><Building2 size={14} className="text-[#3B82F6]" /> Site <span className="text-red-500">*</span></label>
                <select required value={form.site_id} onChange={e => setForm({ ...form, site_id: e.target.value })} className="w-full px-3 py-2 bg-white border border-[#E5E7EB] rounded-lg text-sm text-gray-700 font-medium outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] appearance-none disabled:bg-gray-50 disabled:text-gray-500 transition-all">
                  <option value="">Select Site</option>
                  {sites.map(s => <option key={s.id} value={s.id}>{s.site_name}</option>)}
                </select>
              </div>
              <div>
                <label className="flex items-center gap-1.5 text-[13px] font-bold text-[#4B5563] mb-1.5"><BedDouble size={14} className="text-[#3B82F6]" /> Room Type Requested</label>
                <select value={form.room_type_requested} onChange={e => setForm({ ...form, room_type_requested: e.target.value })} className="w-full px-3 py-2 bg-white border border-[#E5E7EB] rounded-lg text-sm text-gray-700 font-medium outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] appearance-none disabled:bg-gray-50 disabled:text-gray-500 transition-all">
                  <option value="">Select Room Type</option>
                  <option value="OneBHK">1 BHK</option>
                  <option value="TwoBHK">2 BHK</option>
                  <option value="ThreeBHK">3 BHK</option>
                  <option value="Villa">Villa</option>
                  <option value="Room">Room</option>
                </select>
              </div>
              <div>
                <label className="flex items-center gap-1.5 text-[13px] font-bold text-[#4B5563] mb-1.5"><Calendar size={14} className="text-[#3B82F6]" /> Check-in Date</label>
                <input type="date" value={form.check_in_date} onChange={e => setForm({ ...form, check_in_date: e.target.value })} className="w-full px-3 py-2 bg-white border border-[#E5E7EB] rounded-lg text-sm text-gray-900 outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] disabled:bg-gray-50 disabled:text-gray-500 transition-all font-medium" />
              </div>
              <div>
                <label className="flex items-center gap-1.5 text-[13px] font-bold text-[#4B5563] mb-1.5"><Calendar size={14} className="text-[#3B82F6]" /> Check-out Date</label>
                <input type="date" value={form.check_out_date} onChange={e => setForm({ ...form, check_out_date: e.target.value })} className="w-full px-3 py-2 bg-white border border-[#E5E7EB] rounded-lg text-sm text-gray-900 outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] disabled:bg-gray-50 disabled:text-gray-500 transition-all font-medium" />
              </div>
              <div>
                <label className="flex items-center gap-1.5 text-[13px] font-bold text-[#4B5563] mb-1.5"><Clock size={14} className="text-[#3B82F6]" /> No. of Days</label>
                <input type="number" min="1" value={form.no_of_days} onChange={e => setForm({ ...form, no_of_days: e.target.value })} className="w-full px-3 py-2 bg-white border border-[#E5E7EB] rounded-lg text-sm text-gray-900 outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] placeholder:text-gray-400 disabled:bg-gray-50 disabled:text-gray-500 transition-all font-medium" placeholder="Number of days" />
              </div>
              <div>
                <label className="flex items-center gap-1.5 text-[13px] font-bold text-[#4B5563] mb-1.5"><PhoneCall size={14} className="text-[#3B82F6]" /> Enquiry Source <span className="text-red-500">*</span></label>
                <select required value={form.enquiry_source} onChange={e => setForm({ ...form, enquiry_source: e.target.value })} className="w-full px-3 py-2 bg-white border border-[#E5E7EB] rounded-lg text-sm text-gray-700 font-medium outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] appearance-none disabled:bg-gray-50 disabled:text-gray-500 transition-all">
                  <option value="">Select Source</option>
                  <option value="walk_in">Walk-in</option>
                  <option value="phone_call">Phone Call</option>
                  <option value="online_platforms">Online Platforms</option>
                  <option value="referral">Referral</option>
                </select>
              </div>
              <div>
                <label className="flex items-center gap-1.5 text-[13px] font-bold text-[#4B5563] mb-1.5"><Clock3 size={14} className="text-[#3B82F6]" /> Enquiry Time</label>
                <input type="time" className="w-full px-3 py-2 bg-white border border-[#E5E7EB] rounded-lg text-sm text-gray-900 outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] disabled:bg-gray-50 disabled:text-gray-500 transition-all font-medium" />
              </div>
              <div>
                <label className="flex items-center gap-1.5 text-[13px] font-bold text-[#4B5563] mb-1.5"><Flag size={14} className="text-[#3B82F6]" /> Status <span className="text-red-500">*</span></label>
                <select required value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} className="w-full px-3 py-2 bg-white border border-[#E5E7EB] rounded-lg text-sm text-gray-700 font-medium outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] appearance-none disabled:bg-gray-50 disabled:text-gray-500 transition-all">
                  <option value="new">New</option>
                  <option value="follow_up">Follow Up</option>
                  <option value="converted">Converted</option>
                  <option value="lost">Lost</option>
                </select>
              </div>
              <div>
                <label className="flex items-center gap-1.5 text-[13px] font-bold text-[#4B5563] mb-1.5"><FileText size={14} className="text-[#3B82F6]" /> Remarks</label>
                <input value={form.remarks} onChange={e => setForm({ ...form, remarks: e.target.value })} className="w-full px-3 py-2 bg-white border border-[#E5E7EB] rounded-lg text-sm text-gray-900 outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] placeholder:text-gray-400 disabled:bg-gray-50 disabled:text-gray-500 transition-all font-medium" placeholder="Additional remarks" />
              </div>
            </fieldset>

            <div className="flex justify-end gap-3 mt-8 pt-5 border-t border-[#E5E7EB]">
              <button type="button" onClick={resetForm} className="px-5 py-2.5 text-sm font-bold text-gray-700 bg-white border border-[#E5E7EB] rounded-lg hover:bg-gray-50 transition-colors shadow-sm">Cancel</button>
              {!isViewOnly && (
                <>
                  <button type="submit" className="px-5 py-2.5 text-sm font-bold text-[#2563EB] bg-white border border-[#BFDBFE] rounded-lg hover:bg-blue-50 transition-colors shadow-sm">{editId ? 'Apply Update' : 'Save Enquiry'}</button>
                  {!editId && <button type="submit" className="px-5 py-2.5 text-sm font-bold text-white bg-[#2563EB] rounded-lg hover:bg-blue-700 transition-colors shadow-sm">Save & New</button>}
                </>
              )}
            </div>
          </form>
        )}
      </div>
    );
  }

  // LIST VIEW
  return (
    <div className="space-y-6 max-w-[1600px] mx-auto p-4 md:p-0">
      <div className="flex justify-between items-center pb-4 border-b border-[#E5E7EB]">
        <h1 className="text-xl md:text-2xl font-bold text-gray-900 leading-tight">Sales Enquiries</h1>
        <button onClick={() => { setForm({ guest_name: '', mobile_number: '', place: '', site_id: '', room_type_requested: 'Room', check_in_date: '', check_out_date: '', no_of_days: '', enquiry_source: 'walk_in', remarks: '', status: 'new', time: '' }); setEditId(null); setIsViewOnly(false); setViewMode('create'); }} className="bg-[#1A56DB] text-white px-3 py-1.5 md:px-4 md:py-2 rounded-lg font-medium text-xs md:text-sm flex items-center gap-1.5 hover:bg-blue-700 transition-colors shadow-sm">
          <Plus size={16} /> Add Enquiry
        </button>
      </div>

      <div className="bg-white border border-[#E5E7EB] rounded-[12px] shadow-sm flex flex-col">
        <div className="p-4 border-b border-[#E5E7EB] bg-gray-50/50 rounded-t-[12px] space-y-4">
          {/* Top Row: Dates and Search */}
          <div className="flex flex-col gap-3">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input 
                type="text" 
                placeholder="Search guest or mobile..." 
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                className="w-full pl-10 pr-4 py-2 bg-[#F8FAFC] border border-[#E5E7EB] rounded-lg text-sm text-gray-700 outline-none focus:border-[#2563EB]"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <select value={filterSite} onChange={e => setFilterSite(e.target.value)} className="px-3 py-2 bg-white border border-[#E5E7EB] rounded-lg text-[13px] text-gray-700 font-medium outline-none">
                <option>All Sites</option>
                {sites.map(s => <option key={s.id} value={s.site_name}>{s.site_name}</option>)}
              </select>
              
              <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="px-3 py-2 bg-white border border-[#E5E7EB] rounded-lg text-[13px] text-gray-700 font-medium outline-none">
                <option>All Status</option>
                <option>New</option>
                <option>Follow-up</option>
                <option>Converted</option>
                <option>Lost</option>
              </select>
            </div>

            <div className="flex gap-2">
              <input type="date" value={filterDateFrom} onChange={e => setFilterDateFrom(e.target.value)} className="flex-1 px-3 py-2 bg-white border border-[#E5E7EB] rounded-lg text-[13px] text-gray-700 font-medium outline-none focus:border-[#2563EB]" />
              <button onClick={() => { setFilterSite('All Sites'); setFilterStatus('All Status'); setFilterSource('All Sources'); setFilterEmployee(''); setFilterDateFrom(''); setFilterDateTo(''); setSearchTerm(''); setCurrentPage(1); }} className="px-4 py-2 text-[#2563EB] border border-[#BFDBFE] bg-white hover:bg-blue-50 rounded-lg text-[13px] font-bold transition-colors shadow-sm">
                Reset
              </button>
            </div>
          </div>

          {/* Desktop Only: Additional Filters */}
          <div className="hidden lg:grid grid-cols-4 gap-3">
            <select value={filterEmployee} onChange={e => setFilterEmployee(e.target.value)} className="px-3 py-2 bg-white border border-[#E5E7EB] rounded-lg text-sm text-gray-700 font-medium outline-none">
              <option value="">All Employees</option>
              {employees.map(emp => <option key={emp.id} value={emp.name}>{emp.name}</option>)}
            </select>
            <select value={filterSource} onChange={e => setFilterSource(e.target.value)} className="px-3 py-2 bg-white border border-[#E5E7EB] rounded-lg text-sm text-gray-700 font-medium outline-none">
              <option>All Sources</option>
              <option>Walk-in</option>
              <option>Phone Call</option>
              <option>Online</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto hidden md:block">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="text-gray-500 font-semibold border-b border-[#E5E7EB]">
              <tr>
                <th className="px-6 py-4 font-medium text-[12px] tracking-wider">S.No</th>
                <th className="px-6 py-4 font-medium text-[12px] tracking-wider">Entry Date & Time</th>
                <th className="px-6 py-4 font-medium text-[12px] tracking-wider">Guest Name</th>
                <th className="px-6 py-4 font-medium text-[12px] tracking-wider">Mobile</th>
                <th className="px-6 py-4 font-medium text-[12px] tracking-wider">Site</th>
                <th className="px-6 py-4 font-medium text-[12px] tracking-wider">Room Type</th>
                <th className="px-6 py-4 font-medium text-[12px] tracking-wider">Check-in</th>
                <th className="px-6 py-4 font-medium text-[12px] tracking-wider">Check-out</th>
                <th className="px-6 py-4 font-medium text-[12px] tracking-wider">Source</th>
                <th className="px-6 py-4 font-medium text-[12px] tracking-wider">Entry By</th>
                <th className="px-6 py-4 font-medium text-[12px] tracking-wider">Status</th>
                <th className="px-6 py-4 font-medium text-[12px] tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E7EB] text-gray-800 font-medium">
              {loading ? (
                <tr><td colSpan={12} className="px-6 py-12 text-center text-gray-500">Loading records...</td></tr>
              ) : enquiries.length === 0 ? (
                <tr><td colSpan={12} className="px-6 py-12 text-center text-gray-500">No matching inquiries found.</td></tr>
              ) : enquiries.map((enq, index) => (
                <tr key={enq.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 text-gray-500 font-bold">{(currentPage - 1) * limit + index + 1}</td>
                  <td className="px-6 py-4 text-gray-500">
                    <div className="font-bold text-gray-900">{new Date(enq.enquiry_time || enq.created_at).toLocaleDateString('en-GB')}</div>
                    <div className="text-[11px]">{new Date(enq.enquiry_time || enq.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                  </td>
                  <td className="px-6 py-4 font-bold">{enq.guest_name}</td>
                  <td className="px-6 py-4 text-gray-600">{enq.mobile_number}</td>
                  <td className="px-6 py-4 text-gray-700">{enq.site?.site_name}</td>
                  <td className="px-6 py-4 text-gray-700">{enq.room_type_requested || '--'}</td>
                  <td className="px-6 py-4 text-gray-700">{enq.check_in_date ? new Date(enq.check_in_date).toLocaleDateString('en-GB') : '--'}</td>
                  <td className="px-6 py-4 text-gray-700">{enq.check_out_date ? new Date(enq.check_out_date).toLocaleDateString('en-GB') : '--'}</td>
                  <td className="px-6 py-4 text-gray-700">{enq.enquiry_source || 'Walk-in'}</td>
                  <td className="px-6 py-4 font-bold text-gray-800">{enq.employee?.name || '--'}</td>
                  <td className="px-6 py-4">{getStatusPill(enq.status)}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-3 text-blue-600">
                      <button onClick={() => handleEdit(enq, true)} className="hover:text-blue-800"><Eye size={16} /></button>
                      <button onClick={() => handleEdit(enq, false)} className="hover:text-blue-800"><Edit2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* MOBILE CARD LIST */}
        <div className="md:hidden flex flex-col gap-3 p-4 bg-[#F8FAFC]">
          {loading ? (
            <div className="text-center py-8 text-sm text-gray-500 font-medium">Loading records...</div>
          ) : enquiries.length === 0 ? (
            <div className="text-center py-12 text-gray-500 text-sm">No matching inquiries found.</div>
          ) : enquiries.map(enq => (
            <div key={enq.id} onClick={() => handleEdit(enq, true)} className="bg-white p-4 rounded-xl shadow-sm border border-[#E5E7EB] cursor-pointer hover:border-blue-300">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <p className="text-[10px] font-bold text-gray-400 tracking-wider uppercase mb-0.5">ENTRY DATE & TIME</p>
                  <p className="text-[13px] font-bold text-gray-900">
                    {new Date(enq.enquiry_time || enq.created_at).toLocaleDateString('en-GB')} {new Date(enq.enquiry_time || enq.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                <div>{getStatusPill(enq.status)}</div>
              </div>
              <div className="mb-3">
                <p className="text-base font-bold text-[#0D1537] leading-tight">{enq.guest_name}</p>
                <div className="flex items-center gap-1.5 text-gray-500 mt-1">
                  <Phone size={12} />
                  <span className="text-[12px] font-medium">{enq.mobile_number}</span>
                </div>
              </div>
              <div className="flex justify-between items-end border-t border-[#E5E7EB] pt-3">
                <div>
                  <p className="text-[10px] font-bold text-gray-400 tracking-wider">Site</p>
                  <p className="text-[13px] font-semibold text-gray-900">{enq.site?.site_name || '--'}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-bold text-gray-400 tracking-wider">Room Type</p>
                  <p className="text-[13px] font-semibold text-gray-900">{enq.room_type_requested || '--'}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Floating Add Button for Mobile */}
        <button 
          onClick={() => { setForm({ guest_name: '', mobile_number: '', place: '', site_id: '', room_type_requested: 'Room', check_in_date: '', check_out_date: '', no_of_days: '', enquiry_source: 'walk_in', remarks: '', status: 'new', time: '' }); setEditId(null); setIsViewOnly(false); setViewMode('create'); }}
          className="md:hidden fixed bottom-20 right-4 w-14 h-14 bg-[#2563EB] rounded-2xl shadow-lg shadow-blue-500/30 flex items-center justify-center text-white z-50 hover:bg-blue-700 active:scale-95 transition-all"
        >
          <Plus size={28} strokeWidth={2.5} />
        </button>

        <Pagination
          currentPage={currentPage}
          totalPages={pagination.totalPages}
          onPageChange={setCurrentPage}
        />
      </div>
    </div>
  );
}
