import React, { useState, useEffect } from 'react';
import { Plus, Eye, Edit2, Calendar, ArrowLeft, Download, FileText, User, Phone, MapPin, Building2, BedDouble, Users, Info, X, Tags, CalendarClock, CalendarCheck, Clock, CreditCard, Search } from 'lucide-react';
import Pagination from '../components/Pagination';
import { useLocation } from 'react-router-dom';
import { exportToCSV } from '../utils/exportCSV';
import API_BASE_URL from '../config';

export default function SalesBooking() {
  const location = useLocation();
  const [bookings, setBookings] = useState([]);
  const [sites, setSites] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [enquiries, setEnquiries] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [viewMode, setViewMode] = useState('list');
  const [editId, setEditId] = useState(null);
  const [isViewOnly, setIsViewOnly] = useState(false);

  const [form, setForm] = useState({
    booking_type: 'walk_in', guest_name: '', guest_count: 1, 
    mobile_number: '', place: '', site_id: '',
    check_in_date: '', check_out_date: '', total_amount: '',
    room_type: 'Room', room_unit: '', rate: '', no_of_rooms: 1, remarks: '',
    employee_id: '', enquiry_id: ''
  });

  const [filterSite, setFilterSite] = useState('');
  const [filterEmployee, setFilterEmployee] = useState('');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1 });
  const [limit] = useState(10);

  useEffect(() => {
    fetchData();
  }, [currentPage, searchTerm]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const headers = { 'Authorization': 'Bearer ' + token };
      
      const queryParams = new URLSearchParams({
        page: currentPage,
        limit,
        search: searchTerm
      });

      const [resBooks, resSites, resEmps, resEnqs, resRooms] = await Promise.all([
        fetch(`${API_BASE_URL}/api/bookings?${queryParams}`, { headers }),
        fetch(`${API_BASE_URL}/api/locations/sites`, { headers }),
        fetch(`${API_BASE_URL}/api/employees`, { headers }),
        fetch(`${API_BASE_URL}/api/enquiries`, { headers }),
        fetch(`${API_BASE_URL}/api/rooms`, { headers })
      ]);
      
      if (resBooks.ok) {
        const result = await resBooks.json();
        setBookings(result.data);
        setPagination({ total: result.total, totalPages: result.totalPages });
      }
      if (resSites.ok) setSites(await resSites.json());
      if (resEmps.ok) setEmployees(await resEmps.json());
      if (resEnqs.ok) {
        const enqData = await resEnqs.json();
        setEnquiries(Array.isArray(enqData) ? enqData : enqData.data || []);
      }
      if (resRooms.ok) {
         setRooms(await resRooms.json());
         if (location.state?.autoOpenCreate) {
            setViewMode('create');
            setForm(prev => ({...prev, site_id: location.state.prefilledSiteId, room_unit: location.state.prefilledRoomId, room_id: location.state.prefilledRoomId}));
            window.history.replaceState({}, document.title);
         }
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if(isViewOnly) return setViewMode('list');

    const token = localStorage.getItem('token');
    const url = editId ? `${API_BASE_URL}/api/bookings/${editId}` : `${API_BASE_URL}/api/bookings`;
    const method = editId ? 'PUT' : 'POST';

    await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
      body: JSON.stringify({
         ...form, 
         enquiry_id: form.enquiry_id || null,
         guest_count: parseInt(form.guest_count), 
         total_amount: parseFloat(form.total_amount)
      })
    });
    
    resetForm();
    fetchData();
  };

  const handleEdit = (bkg, viewOnly=false) => {
    setForm({
      booking_type: bkg.booking_type || 'walk_in',
      guest_name: bkg.guest_name || '',
      guest_count: bkg.guest_count || 1,
      mobile_number: bkg.mobile_number || '',
      place: bkg.place || '',
      site_id: bkg.site_id || '',
      check_in_date: bkg.check_in_date ? new Date(bkg.check_in_date).toISOString().split('T')[0] : '',
      check_out_date: bkg.check_out_date ? new Date(bkg.check_out_date).toISOString().split('T')[0] : '',
      total_amount: bkg.total_amount || '',
      room_type: bkg.room_type || 'standard',
      room_unit: bkg.room_id || '101',
      rate: bkg.rate || '',
      no_of_rooms: bkg.no_of_rooms || 1,
      remarks: bkg.remarks || ''
    });
    setEditId(bkg.id);
    setIsViewOnly(viewOnly);
    setViewMode('create');
  };

  const resetForm = () => {
    setForm({ booking_type: 'walk_in', guest_name: '', guest_count: 1, mobile_number: '', place: '', site_id: '', check_in_date: '', check_out_date: '', total_amount: '', room_type: 'Room', room_unit: '', rate: '', no_of_rooms: 1, remarks: '' });
    setEditId(null);
    setIsViewOnly(false);
  };

  const filteredBookings = bookings.filter(b => {
    if (filterSite && b.site_id != filterSite) return false;
    if (filterEmployee && b.employee?.name !== filterEmployee) return false;
    
    // Booking Date Validation
    const bDateStr = b.booking_date || b.created_at;
    if (bDateStr) {
      const bDate = new Date(bDateStr);
      bDate.setHours(0,0,0,0);
      if (filterDateFrom) {
         const fFrom = new Date(filterDateFrom);
         fFrom.setHours(0,0,0,0);
         if (bDate < fFrom) return false;
      }
      if (filterDateTo) {
         const fTo = new Date(filterDateTo);
         fTo.setHours(0,0,0,0);
         if (bDate > fTo) return false;
      }
    }
    return true;
  });

  const getPaymentPill = (amount) => {
    if(amount > 3000) return <span className="bg-green-50 text-green-600 px-3 py-1 rounded border border-green-100 text-[10px] font-bold uppercase tracking-wider">Paid</span>;
    if(amount > 0) return <span className="bg-orange-50 text-orange-600 px-3 py-1 rounded border border-orange-100 text-[10px] font-bold uppercase tracking-wider">Partial</span>;
    return <span className="bg-red-50 text-red-600 px-3 py-1 rounded border border-red-100 text-[10px] font-bold uppercase tracking-wider">Pending</span>;
  }

  const formatDate = (dateStr) => dateStr ? new Date(dateStr).toLocaleDateString('en-GB') : '-';
  const calculateNights = () => form.check_in_date && form.check_out_date ? Math.max(1, Math.ceil((new Date(form.check_out_date) - new Date(form.check_in_date))/(1000*60*60*24))) : 0;

  if (viewMode === 'create') {
    return (
      <div className="bg-[#F8FAFC] min-h-[calc(100vh-4rem)] p-4 md:p-8 md:-m-8 border-0 md:border-l border-[#E5E7EB]">
        
        <div className="flex items-center gap-3 mb-6">
           <button onClick={() => setViewMode('list')} className="p-2 bg-white border border-[#E5E7EB] rounded-lg text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-colors shadow-sm">
             <ArrowLeft size={18} strokeWidth={2.5} />
           </button>
           <div>
             <h1 className="text-xl font-bold text-gray-900 leading-tight">
               {isViewOnly ? 'Booking Manifest Ticket' : (editId ? 'Edit Booking' : 'Add New Booking')}
             </h1>
             <p className="text-sm font-medium text-gray-500">{isViewOnly ? 'Passenger and Room assignment manifest details' : 'Secure booking and assign units'}</p>
           </div>
        </div>

        {isViewOnly ? (
          <div className="bg-white rounded-[20px] shadow-[0_2px_15px_rgb(0,0,0,0.03)] border border-[#E5E7EB] p-8 max-w-[1200px] relative overflow-hidden">
            <div className="flex items-center gap-3 mb-8 text-[#2563EB]">
               <div className="p-2 bg-blue-50 rounded-full">
                  <FileText size={18} strokeWidth={2.5}/>
               </div>
               <h2 className="text-[15px] font-extrabold text-gray-900 tracking-wide">Booking Manifest <span className="text-gray-400 font-medium ml-1">#BKG-{10000 + editId}</span></h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-x-8 gap-y-8">
               {/* Guest Name */}
               <div>
                  <div className="flex items-center gap-2 mb-2.5 text-[#4B5563]">
                     <User size={15} strokeWidth={2.5} className="text-[#3B82F6]" />
                     <span className="text-[12px] font-bold">Primary Guest</span>
                  </div>
                  <div className="w-full px-4 py-3 bg-[#F9FAFB] border border-[#F3F4F6] rounded-xl text-[13px] font-semibold text-gray-900">
                     {form.guest_name || '--'}
                  </div>
               </div>

               {/* Mobile Number */}
               <div>
                  <div className="flex items-center gap-2 mb-2.5 text-[#4B5563]">
                     <Phone size={15} strokeWidth={2.5} className="text-[#3B82F6]" />
                     <span className="text-[12px] font-bold">Contact Number</span>
                  </div>
                  <div className="w-full px-4 py-3 bg-[#F9FAFB] border border-[#F3F4F6] rounded-xl text-[13px] font-semibold text-gray-900">
                     {form.mobile_number || '--'}
                  </div>
               </div>

               {/* Booking Type */}
               <div>
                  <div className="flex items-center gap-2 mb-2.5 text-[#4B5563]">
                     <Tags size={15} strokeWidth={2.5} className="text-[#3B82F6]" />
                     <span className="text-[12px] font-bold">Booking Type</span>
                  </div>
                  <div className="w-full px-4 py-3 bg-[#F9FAFB] border border-[#F3F4F6] rounded-xl text-[13px] font-medium text-gray-900">
                     {form.booking_type || '--'}
                  </div>
               </div>

               {/* Place */}
               <div>
                  <div className="flex items-center gap-2 mb-2.5 text-[#4B5563]">
                     <MapPin size={15} strokeWidth={2.5} className="text-[#3B82F6]" />
                     <span className="text-[12px] font-bold">City / Residence</span>
                  </div>
                  <div className="w-full px-4 py-3 bg-[#F9FAFB] border border-[#F3F4F6] rounded-xl text-[13px] font-medium text-gray-900">
                     {form.place || '--'}
                  </div>
               </div>

               {/* Site */}
               <div>
                  <div className="flex items-center gap-2 mb-2.5 text-[#4B5563]">
                     <Building2 size={15} strokeWidth={2.5} className="text-[#3B82F6]" />
                     <span className="text-[12px] font-bold">Site Placement</span>
                  </div>
                  <div className="w-full px-4 py-3 bg-[#F9FAFB] border border-[#F3F4F6] rounded-xl text-[13px] font-semibold text-gray-900">
                     {sites.find(s=>s.id == form.site_id)?.site_name || 'N/A'}
                  </div>
               </div>

               {/* Room Specs */}
               <div>
                  <div className="flex items-center gap-2 mb-2.5 text-[#4B5563]">
                     <BedDouble size={15} strokeWidth={2.5} className="text-[#3B82F6]" />
                     <span className="text-[12px] font-bold">Room Allocation</span>
                  </div>
                  <div className="w-full px-4 py-3 bg-[#EFF6FF] border border-[#BFDBFE] rounded-xl text-[13px] font-bold text-blue-700">
                     {rooms.find(r=>r.id == form.room_unit)?.room_number || 'TBD'} - {form.room_type}
                  </div>
               </div>

               {/* Occupancy */}
               <div>
                  <div className="flex items-center gap-2 mb-2.5 text-[#4B5563]">
                     <Users size={15} strokeWidth={2.5} className="text-[#3B82F6]" />
                     <span className="text-[12px] font-bold">Headcount Config</span>
                  </div>
                  <div className="w-full px-4 py-3 bg-[#F9FAFB] border border-[#F3F4F6] rounded-xl text-[13px] font-medium text-gray-600">
                     {form.no_of_rooms} Room(s) • {form.guest_count} Total
                  </div>
               </div>

               {/* Stay Duration / Check-ins */}
               <div>
                  <div className="flex items-center gap-2 mb-2.5 text-[#4B5563]">
                     <CalendarClock size={15} strokeWidth={2.5} className="text-[#3B82F6]" />
                     <span className="text-[12px] font-bold">Arrival Date</span>
                  </div>
                  <div className="w-full px-4 py-3 bg-[#F9FAFB] border border-[#F3F4F6] rounded-xl text-[13px] font-semibold text-gray-900">
                     {form.check_in_date ? form.check_in_date.split('-').reverse().join('-') : '--'}
                  </div>
               </div>

               <div>
                  <div className="flex items-center gap-2 mb-2.5 text-[#4B5563]">
                     <CalendarCheck size={15} strokeWidth={2.5} className="text-[#3B82F6]" />
                     <span className="text-[12px] font-bold">Departure Date</span>
                  </div>
                  <div className="w-full px-4 py-3 bg-[#F9FAFB] border border-[#F3F4F6] rounded-xl text-[13px] font-semibold text-gray-900">
                     {form.check_out_date ? form.check_out_date.split('-').reverse().join('-') : '--'}
                  </div>
               </div>

               {/* Rate */}
               <div>
                  <div className="flex items-center gap-2 mb-2.5 text-[#4B5563]">
                     <CreditCard size={15} strokeWidth={2.5} className="text-[#3B82F6]" />
                     <span className="text-[12px] font-bold">Attributed Rate</span>
                  </div>
                  <div className="w-full px-4 py-3 bg-[#F9FAFB] border border-[#F3F4F6] rounded-xl text-[13px] font-semibold text-gray-700">
                     ₹ {form.rate} / night
                  </div>
               </div>

               {/* Total Amount */}
               <div>
                  <div className="flex items-center gap-2 mb-2.5 text-[#4B5563]">
                     <CreditCard size={15} strokeWidth={2.5} className="text-[#3B82F6]" />
                     <span className="text-[12px] font-bold">Total Ledger</span>
                  </div>
                  <div className="w-full px-4 py-3 bg-[#F0FDF4] border border-[#BBF7D0] rounded-xl text-[14px] font-extrabold text-green-700">
                     ₹ {parseFloat(form.total_amount).toLocaleString('en-IN', {minimumFractionDigits: 2})}
                  </div>
               </div>

               {/* Remarks */}
               {form.remarks && (
                 <div className="md:col-span-4">
                    <div className="flex items-center gap-2 mb-2.5 text-[#4B5563]">
                       <FileText size={15} strokeWidth={2.5} className="text-[#3B82F6]" />
                       <span className="text-[12px] font-bold">Booking Remarks / Notes</span>
                    </div>
                    <div className="w-full px-4 py-4 bg-[#F9FAFB] border border-dashed border-gray-300 rounded-xl text-[13px] font-medium text-gray-600">
                       {form.remarks}
                    </div>
                 </div>
               )}
            </div>

            <div className="mt-12 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
               <div className="flex-1 bg-[#F5F3FF] rounded-xl p-4 flex items-center gap-3 border border-purple-100">
                 <div className="text-[#6D28D9] shrink-0">
                    <Info size={18} strokeWidth={2.5} />
                 </div>
                 <p className="text-[13px] font-semibold text-[#5B21B6]">Booking details frozen. Changes lock 24 hours prior to check-in.</p>
               </div>
               <button onClick={resetForm} className="px-6 py-4 text-[13px] font-bold text-white bg-[#4F46E5] rounded-xl hover:bg-[#4338CA] transition-all shadow-[0_4px_14px_rgba(79,70,229,0.25)] flex items-center justify-center gap-2 shrink-0">
                  <X size={16} strokeWidth={2.5}/> Close Manifest
               </button>
            </div>
          </div>
        ) : (
        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-[#E5E7EB] p-6 max-w-[1600px]">
           <fieldset disabled={isViewOnly} className="grid grid-cols-1 md:grid-cols-4 gap-x-6 gap-y-5">
               <div>
                  <label className="flex items-center gap-1.5 text-[13px] font-bold text-[#4B5563] mb-1.5"><Tags size={14} className="text-[#3B82F6]"/> Booking Type <span className="text-red-500">*</span></label>
                  <select required value={form.booking_type} onChange={e=>setForm({...form, booking_type: e.target.value})} className="w-full px-3 py-2 bg-white border border-[#E5E7EB] rounded-lg text-sm text-gray-700 font-medium outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] appearance-none disabled:bg-gray-50 disabled:text-gray-500 transition-all">
                    <option value="walk_in">Walk-In</option>
                    <option value="online">Online</option>
                    <option value="agent">Agent</option>
                  </select>
               </div>
               <div>
                  <label className="flex items-center gap-1.5 text-[13px] font-bold text-[#4B5563] mb-1.5"><FileText size={14} className="text-[#3B82F6]"/> Source Enquiry</label>
                  <select value={form.enquiry_id} onChange={e=>setForm({...form, enquiry_id: e.target.value})} className="w-full px-3 py-2 bg-white border border-[#E5E7EB] rounded-lg text-sm text-gray-700 font-medium outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] appearance-none disabled:bg-gray-50 disabled:text-gray-500 transition-all">
                    <option value="">No Linking (Direct)</option>
                    {enquiries.filter(e => e.status !== 'converted').map(eq => (
                        <option key={eq.id} value={eq.id}>{eq.guest_name} - {eq.mobile_number}</option>
                    ))}
                  </select>
               </div>
               <div>
                  <label className="flex items-center gap-1.5 text-[13px] font-bold text-[#4B5563] mb-1.5"><User size={14} className="text-[#3B82F6]"/> Guest Name <span className="text-red-500">*</span></label>
                  <input required value={form.guest_name} onChange={e=>setForm({...form, guest_name: e.target.value})} className="w-full px-3 py-2 bg-white border border-[#E5E7EB] rounded-lg text-sm text-gray-900 outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] placeholder:text-gray-400 disabled:bg-gray-50 disabled:text-gray-500 transition-all font-medium" placeholder="Guest name" />
               </div>
               <div>
                  <label className="flex items-center gap-1.5 text-[13px] font-bold text-[#4B5563] mb-1.5"><Phone size={14} className="text-[#3B82F6]"/> Mobile Number <span className="text-red-500">*</span></label>
                  <input required type="tel" value={form.mobile_number} onChange={e=>setForm({...form, mobile_number: e.target.value})} className="w-full px-3 py-2 bg-white border border-[#E5E7EB] rounded-lg text-sm text-gray-900 outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] placeholder:text-gray-400 disabled:bg-gray-50 disabled:text-gray-500 transition-all font-medium" placeholder="Mobile number" />
               </div>
               <div>
                  <label className="flex items-center gap-1.5 text-[13px] font-bold text-[#4B5563] mb-1.5"><Users size={14} className="text-[#3B82F6]"/> No. of Guests <span className="text-red-500">*</span></label>
                  <input required type="number" min="1" value={form.guest_count} onChange={e=>setForm({...form, guest_count: e.target.value})} className="w-full px-3 py-2 bg-white border border-[#E5E7EB] rounded-lg text-sm text-gray-900 outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] disabled:bg-gray-50 disabled:text-gray-500 transition-all font-medium" />
               </div>
               <div>
                  <label className="flex items-center gap-1.5 text-[13px] font-bold text-[#4B5563] mb-1.5"><MapPin size={14} className="text-[#3B82F6]"/> Place / City</label>
                  <input value={form.place} onChange={e=>setForm({...form, place: e.target.value})} className="w-full px-3 py-2 bg-white border border-[#E5E7EB] rounded-lg text-sm text-gray-900 outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] placeholder:text-gray-400 disabled:bg-gray-50 disabled:text-gray-500 transition-all font-medium" placeholder="City" />
               </div>
               <div>
                  <label className="flex items-center gap-1.5 text-[13px] font-bold text-[#4B5563] mb-1.5"><Building2 size={14} className="text-[#3B82F6]"/> Site <span className="text-red-500">*</span></label>
                  <select required value={form.site_id} onChange={e=>setForm({...form, site_id: e.target.value})} className="w-full px-3 py-2 bg-white border border-[#E5E7EB] rounded-lg text-sm text-gray-700 font-medium outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] appearance-none disabled:bg-gray-50 disabled:text-gray-500 transition-all">
                    <option value="">Select Site</option>
                    {sites.map(s => <option key={s.id} value={s.id}>{s.site_name}</option>)}
                  </select>
               </div>
               <div>
                  <label className="flex items-center gap-1.5 text-[13px] font-bold text-[#4B5563] mb-1.5"><CalendarClock size={14} className="text-[#3B82F6]"/> Check-in Date <span className="text-red-500">*</span></label>
                  <input required type="date" value={form.check_in_date} onChange={e=>setForm({...form, check_in_date: e.target.value})} className="w-full px-3 py-2 bg-white border border-[#E5E7EB] rounded-lg text-sm text-gray-900 outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] disabled:bg-gray-50 disabled:text-gray-500 transition-all font-medium" />
               </div>
               <div>
                  <label className="flex items-center gap-1.5 text-[13px] font-bold text-[#4B5563] mb-1.5"><CalendarCheck size={14} className="text-[#3B82F6]"/> Check-out Date <span className="text-red-500">*</span></label>
                  <input required type="date" value={form.check_out_date} onChange={e=>setForm({...form, check_out_date: e.target.value})} className="w-full px-3 py-2 bg-white border border-[#E5E7EB] rounded-lg text-sm text-gray-900 outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] disabled:bg-gray-50 disabled:text-gray-500 transition-all font-medium" />
               </div>
               <div>
                  <label className="flex items-center gap-1.5 text-[13px] font-bold text-[#4B5563] mb-1.5"><BedDouble size={14} className="text-[#3B82F6]"/> Room Type <span className="text-red-500">*</span></label>
                  <select required value={form.room_type} onChange={e=>setForm({...form, room_type: e.target.value})} className="w-full px-3 py-2 bg-white border border-[#E5E7EB] rounded-lg text-sm text-gray-700 font-medium outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] appearance-none disabled:bg-gray-50 disabled:text-gray-500 transition-all">
                    <option value="">Select Room Type</option>
                    <option value="Room">Room</option>
                    <option value="OneBHK">OneBHK</option>
                    <option value="TwoBHK">TwoBHK</option>
                    <option value="ThreeBHK">ThreeBHK</option>
                  </select>
               </div>
               <div>
                  <label className="flex items-center gap-1.5 text-[13px] font-bold text-[#4B5563] mb-1.5"><BedDouble size={14} className="text-[#3B82F6]"/> Room / Unit <span className="text-red-500">*</span></label>
                  <select required value={form.room_unit} onChange={e=>setForm({...form, room_unit: e.target.value, room_id: e.target.value})} className="w-full px-3 py-2 bg-white border border-[#E5E7EB] rounded-lg text-sm text-gray-700 font-medium outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] appearance-none disabled:bg-gray-50 disabled:text-gray-500 transition-all">
                    <option value="">Select Room / Unit</option>
                    {rooms.filter(r => r.site_id === parseInt(form.site_id)).map(r => (
                       <option key={r.id} value={r.id}>{r.room_number} - {r.room_type}</option>
                    ))}
                  </select>
               </div>
               <div>
                  <label className="flex items-center gap-1.5 text-[13px] font-bold text-[#4B5563] mb-1.5"><CreditCard size={14} className="text-[#3B82F6]"/> Rate (₹) <span className="text-red-500">*</span></label>
                  <input required type="number" value={form.rate} onChange={e=> { setForm({...form, rate: e.target.value, total_amount: e.target.value * form.no_of_rooms * (form.check_in_date && form.check_out_date ? calculateNights() : 1)})}} className="w-full px-3 py-2 bg-white border border-[#E5E7EB] rounded-lg text-sm text-gray-900 outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] placeholder:text-gray-400 disabled:bg-gray-50 disabled:text-gray-500 transition-all font-medium" placeholder="0.00" />
               </div>
               <div>
                  <label className="flex items-center gap-1.5 text-[13px] font-bold text-[#4B5563] mb-1.5"><BedDouble size={14} className="text-[#3B82F6]"/> No. of Rooms / Units <span className="text-red-500">*</span></label>
                  <input required type="number" min="1" value={form.no_of_rooms} onChange={e=> { setForm({...form, no_of_rooms: e.target.value, total_amount: form.rate * e.target.value * (form.check_in_date && form.check_out_date ? calculateNights() : 1)})}} className="w-full px-3 py-2 bg-white border border-[#E5E7EB] rounded-lg text-sm text-gray-900 outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] disabled:bg-gray-50 disabled:text-gray-500 transition-all font-medium" />
               </div>
               <div>
                  <label className="flex items-center gap-1.5 text-[13px] font-bold text-[#4B5563] mb-1.5"><CreditCard size={14} className="text-[#3B82F6]"/> Total Amount (₹)</label>
                  <input required type="number" value={form.total_amount} onChange={e=>setForm({...form, total_amount: e.target.value})} className="w-full px-3 py-2 bg-white border border-[#E5E7EB] rounded-lg text-sm text-[#2563EB] font-bold outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] placeholder:text-gray-400 disabled:bg-gray-50 disabled:text-gray-500 transition-all" placeholder="0.00" />
               </div>
               <div className="md:col-span-3">
                  <label className="flex items-center gap-1.5 text-[13px] font-bold text-[#4B5563] mb-1.5"><FileText size={14} className="text-[#3B82F6]"/> Remarks / Ledger Narration</label>
                  <input value={form.remarks} onChange={e=>setForm({...form, remarks: e.target.value})} className="w-full px-3 py-2 bg-white border border-[#E5E7EB] rounded-lg text-sm text-gray-900 outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] placeholder:text-gray-400 disabled:bg-gray-50 disabled:text-gray-500 transition-all font-medium" placeholder="Add note" />
               </div>
           </fieldset>

          <div className="flex justify-end gap-3 mt-8 pt-5 border-t border-[#E5E7EB]">
             <button type="button" onClick={() => setViewMode('list')} className="px-5 py-2.5 text-sm font-bold text-gray-700 bg-white border border-[#E5E7EB] rounded-lg hover:bg-gray-50 transition-colors shadow-sm">{isViewOnly ? 'Close View' : 'Cancel'}</button>
             {!isViewOnly && (
               <button type="submit" className="px-5 py-2.5 text-sm font-bold text-white bg-[#2563EB] rounded-lg hover:bg-blue-700 transition-colors shadow-sm">{editId ? 'Save Changes' : 'Confirm Bookings'}</button>
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
         <h1 className="text-xl md:text-2xl font-bold text-gray-900 leading-tight">Bookings & Sales</h1>
         <div className="flex items-center gap-3">
            <button onClick={() => exportToCSV(filteredBookings, 'bookings')} className="hidden md:flex bg-white border-[#E5E7EB] border text-gray-700 px-4 py-2 rounded-lg font-bold text-sm items-center gap-2 hover:bg-gray-50 transition-colors shadow-sm">
               <Download size={16} /> Export CSV
            </button>
            <button onClick={() => { resetForm(); setViewMode('create'); }} className="bg-[#1A56DB] text-white px-3 py-1.5 md:px-4 md:py-2 rounded-lg font-medium text-xs md:text-sm flex items-center gap-1.5 hover:bg-blue-700 transition-colors shadow-sm">
               <Plus size={14} md:size={16} /> Add Booking
            </button>
         </div>
      </div>

      <div className="bg-white border border-[#E5E7EB] rounded-[12px] shadow-sm flex flex-col">
         {/* Filter Strip */}
         <div className="p-4 border-b border-[#E5E7EB] flex flex-col gap-3 bg-[#F8FAFC] rounded-t-[12px]">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input 
                type="text" 
                placeholder="Search guest or mobile..." 
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                className="w-full pl-10 pr-4 py-2 bg-white border border-[#E5E7EB] rounded-lg text-sm text-gray-700 outline-none focus:border-[#2563EB]"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">From Date</p>
                <input type="date" value={filterDateFrom} onChange={e=>setFilterDateFrom(e.target.value)} className="w-full px-3 py-2 bg-white border border-[#E5E7EB] rounded-lg text-[13px] text-gray-700 font-medium outline-none focus:border-[#2563EB]" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">To Date</p>
                <input type="date" value={filterDateTo} onChange={e=>setFilterDateTo(e.target.value)} className="w-full px-3 py-2 bg-white border border-[#E5E7EB] rounded-lg text-[13px] text-gray-700 font-medium outline-none focus:border-[#2563EB]" />
              </div>
            </div>

            <div className="grid grid-cols-3 md:flex md:flex-row gap-3">
              <select value={filterEmployee} onChange={e=>setFilterEmployee(e.target.value)} className="w-full md:w-40 px-3 py-2 bg-white border border-[#E5E7EB] rounded-lg text-[13px] text-gray-700 font-medium outline-none">
                <option value="">All Employees</option>
                {employees.map(emp => <option key={emp.id} value={emp.name}>{emp.name}</option>)}
              </select>
              <select value={filterSite} onChange={e=>setFilterSite(e.target.value)} className="w-full md:w-40 px-3 py-2 bg-white border border-[#E5E7EB] rounded-lg text-[13px] text-gray-700 font-medium outline-none">
                <option value="">All Sites</option>
                {sites.map(s => <option key={s.id} value={s.id}>{s.site_name}</option>)}
              </select>
              <button onClick={() => {setFilterSite(''); setFilterEmployee(''); setFilterDateFrom(''); setFilterDateTo(''); setSearchTerm(''); setCurrentPage(1);}} className="w-full md:w-auto px-5 py-2 text-[#2563EB] border border-[#BFDBFE] bg-blue-50 hover:bg-blue-100 rounded-lg text-[13px] font-bold transition-colors">
                <span className="md:hidden">Reset</span>
                <span className="hidden md:inline">Reset Filters</span>
              </button>
            </div>
         </div>

         <div className="overflow-x-auto hidden md:block">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="text-gray-500 font-semibold border-b border-[#E5E7EB]">
                <tr>
                  <th className="px-2 py-3.5 font-medium text-[12px] tracking-wider">S.No</th>
                  <th className="px-2 py-3.5 font-medium text-[12px] tracking-wider">Booking ID</th>
                  <th className="px-2 py-3.5 font-medium text-[12px] tracking-wider">Booking Date</th>
                  <th className="px-2 py-3.5 font-medium text-[12px] tracking-wider">Guest Name</th>
                  <th className="px-2 py-3.5 font-medium text-[12px] tracking-wider">Room No</th>
                  <th className="px-2 py-3.5 font-medium text-[12px] tracking-wider">Check-in</th>
                  <th className="px-2 py-3.5 font-medium text-[12px] tracking-wider">Check-out</th>
                  <th className="px-2 py-3.5 font-medium text-[12px] tracking-wider text-right">Amount (₹)</th>
                  <th className="px-2 py-3.5 font-medium text-[12px] tracking-wider">Payment Status</th>
                  <th className="px-2 py-3.5 font-medium text-[12px] tracking-wider">Created By</th>
                  <th className="px-2 py-3.5 font-medium text-[12px] tracking-wider">Type</th>
                  <th className="px-2 py-3.5 font-medium text-[12px] tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB] text-gray-800 font-medium">
                {loading ? (
                   <tr><td colSpan={12} className="px-6 py-12 text-center text-gray-500">Loading records...</td></tr>
                ) : bookings.length === 0 ? (
                   <tr><td colSpan={12} className="px-6 py-12 text-center text-gray-500">No matching bookings found.</td></tr>
                ) : bookings.map((bkg, index) => (
                  <tr key={bkg.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-2 py-3.5 text-gray-500 font-bold">{(currentPage - 1) * limit + index + 1}</td>
                    <td className="px-2 py-3.5 text-gray-500 font-semibold">BKG-{10000 + bkg.id}</td>
                    <td className="px-2 py-3.5 text-gray-700">{formatDate(bkg.booking_date || bkg.created_at)}</td>
                    <td className="px-2 py-3.5 font-bold text-gray-900">{bkg.guest_name}</td>
                    <td className="px-2 py-3.5 font-bold text-gray-900">{bkg.room?.room_number || '-'}</td>
                    <td className="px-2 py-3.5">{formatDate(bkg.check_in_date)}</td>
                    <td className="px-2 py-3.5">{formatDate(bkg.check_out_date)}</td>
                    <td className="px-2 py-3.5 font-bold text-gray-900 text-right">₹ {parseFloat(bkg.total_amount).toLocaleString('en-IN', {minimumFractionDigits: 2})}</td>
                    <td className="px-2 py-3.5">{getPaymentPill(bkg.total_amount)}</td>
                    <td className="px-2 py-3.5 font-bold text-gray-800">{bkg.employee?.name || '--'}</td>
                    <td className="px-2 py-3.5 text-gray-600">{bkg.booking_type}</td>
                    <td className="px-2 py-3.5">
                       <div className="flex items-center justify-end gap-3 text-[#2563EB]">
                          <button onClick={() => handleEdit(bkg, true)} className="hover:text-blue-800"><Eye size={16}/></button>
                          <button onClick={() => handleEdit(bkg, false)} className="hover:text-blue-800"><Edit2 size={16}/></button>
                       </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
         </div>

         {/* MOBILE CARD VIEW OR EMPTY STATE */}
         <div className="md:hidden flex flex-col bg-[#F4F7FE] p-4 min-h-[400px]">
           {loading ? (
             <div className="text-center py-8 text-sm text-gray-500 font-medium">Loading records...</div>
           ) : bookings.length === 0 ? (
             <div className="flex-1 flex flex-col items-center justify-center text-center px-4 pt-10 pb-20 rounded-2xl border border-dashed border-[#BFDBFE] bg-blue-50/30">
               <div className="w-16 h-16 bg-[#DBEAFE] rounded-2xl flex items-center justify-center text-[#2563EB] mb-4 relative">
                 <Calendar size={32} strokeWidth={2} />
                 <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-white rounded-full border border-[#E5E7EB] flex items-center justify-center shadow-sm text-gray-400">
                   <Search size={14} strokeWidth={2.5} />
                 </div>
               </div>
               <h3 className="text-lg font-bold text-gray-900 mb-2">No bookings found</h3>
               <p className="text-sm text-gray-500 mb-8 max-w-xs">We couldn't find any bookings matching your current filter criteria. Try adjusting the dates or search terms.</p>
               
               <div className="w-full space-y-3">
                 <button onClick={() => { resetForm(); setViewMode('create'); }} className="w-full bg-[#1A56DB] text-white py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-blue-700 transition-all shadow-md shadow-blue-500/20 active:scale-[0.98]">
                   <Plus size={18} strokeWidth={2.5} /> Create New Booking
                 </button>
                 <button onClick={() => {setFilterSite(''); setFilterEmployee(''); setFilterDateFrom(''); setFilterDateTo(''); setSearchTerm(''); setCurrentPage(1);}} className="w-full bg-white border border-[#E5E7EB] text-gray-700 py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-gray-50 transition-all active:scale-[0.98]">
                   Clear All Filters
                 </button>
               </div>
             </div>
           ) : (
             <div className="flex flex-col gap-4 pb-16">
               {bookings.map(bkg => (
                 <div key={bkg.id} onClick={() => handleEdit(bkg, true)} className="bg-white rounded-[16px] p-4 shadow-[0_2px_10px_rgba(0,0,0,0.04)] border border-[#E5E7EB] cursor-pointer">
                   <div className="flex justify-between items-start mb-3 border-b border-[#F3F4F6] pb-3">
                     <div>
                       <p className="text-[12px] font-bold text-gray-400">BKG-{10000 + bkg.id}</p>
                       <p className="text-[14px] font-bold text-gray-900 mt-0.5">{formatDate(bkg.booking_date || bkg.created_at)}</p>
                     </div>
                     <div>{getPaymentPill(bkg.total_amount)}</div>
                   </div>
                   <div className="mb-4">
                     <p className="text-[15px] font-extrabold text-[#0D1537] mb-1">{bkg.guest_name}</p>
                     <p className="text-[12px] font-semibold text-gray-500 flex items-center gap-1.5"><Building2 size={12}/> Room {bkg.room?.room_number || '-'} • {bkg.booking_type}</p>
                   </div>
                   <div className="flex items-center justify-between bg-[#F8FAFC] rounded-xl p-3 mb-3 border border-[#F1F5F9]">
                     <div className="text-center flex-1 border-r border-[#E5E7EB]">
                       <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Check-in</p>
                       <p className="text-[12px] font-bold text-gray-900">{formatDate(bkg.check_in_date)}</p>
                     </div>
                     <div className="text-center flex-1">
                       <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Check-out</p>
                       <p className="text-[12px] font-bold text-gray-900">{formatDate(bkg.check_out_date)}</p>
                     </div>
                   </div>
                   <div className="flex justify-between items-center pt-1">
                     <p className="text-[11px] font-semibold text-gray-400 flex items-center gap-1"><User size={12}/> {bkg.employee?.name || 'System'}</p>
                     <p className="text-[16px] font-black text-[#2563EB]">₹ {parseFloat(bkg.total_amount).toLocaleString('en-IN', {minimumFractionDigits: 0})}</p>
                   </div>
                 </div>
               ))}
               
               {/* Export CSV Floating Button for Mobile */}
               <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-40">
                 <button onClick={() => exportToCSV(filteredBookings, 'bookings')} className="bg-white border border-[#E5E7EB] text-gray-700 px-6 py-2.5 rounded-full font-bold text-sm flex items-center gap-2 shadow-[0_4px_14px_rgba(0,0,0,0.05)] active:scale-95 transition-all">
                    <Download size={16} /> Export CSV Report
                 </button>
               </div>
             </div>
           )}
         </div>
         <Pagination 
            currentPage={currentPage}
            totalPages={pagination.totalPages}
            onPageChange={setCurrentPage}
         />
      </div>
    </div>
  );
}
