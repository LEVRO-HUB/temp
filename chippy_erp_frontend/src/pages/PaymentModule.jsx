import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Plus, Eye, Edit2, Download, Printer, ArrowLeft, Search } from 'lucide-react';
import Pagination from '../components/Pagination';
import { exportToCSV } from '../utils/exportCSV';
import API_BASE_URL from '../config';

const METHOD_LABELS = {
  cash: 'Cash',
  upi: 'UPI',
  bank: 'Bank Transfer',
  card: 'Card',
  cheque: 'Cheque',
  rtgs: 'RTGS',
};

export default function PaymentModule() {
  const location = useLocation();
  const navigate = useNavigate();
  const [payments, setPayments] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  const [viewMode, setViewMode] = useState('list');
  const [editId, setEditId] = useState(null);
  const [isViewOnly, setIsViewOnly] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1 });
  const [limit] = useState(10);
  const [filterMethod, setFilterMethod] = useState('All Methods');
  const [postSavePath, setPostSavePath] = useState('');

  const [form, setForm] = useState({
    booking_id: '', payment_amt_in_base: '', method: 'bank',
    transaction_type: 'credit', payment_type: 'advance', cheque_no: '',
    rtgs_ref_no: '', remarks: ''
  });

  useEffect(() => {
    fetchData();
  }, [currentPage, searchTerm, filterMethod]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const headers = { 'Authorization': 'Bearer ' + token };
      
      const queryParams = new URLSearchParams({
        page: currentPage,
        limit,
        search: searchTerm,
        method: filterMethod !== 'All Methods' ? filterMethod : ''
      });

      const [resPay, resBook] = await Promise.all([
        fetch(`${API_BASE_URL}/api/payments?${queryParams}`, { headers }),
        fetch(`${API_BASE_URL}/api/bookings`, { headers })
      ]);
      
      if (resPay.ok) {
        const result = await resPay.json();
        setPayments(result.data);
        setPagination({ total: result.total, totalPages: result.totalPages });
      }
      if (resBook.ok) {
        const result = await resBook.json();
        const bookingList = Array.isArray(result) ? result : result.data || [];
        setBookings(bookingList);

        if (location.state?.autoOpenCreate) {
          setForm(prev => ({
            ...prev,
            booking_id: location.state.prefilledBookingId?.toString() || '',
            payment_amt_in_base: location.state.prefilledAmount ? String(location.state.prefilledAmount) : '',
            method: 'cash',
            transaction_type: 'credit',
            payment_type: 'partial',
            remarks: location.state.prefilledRemarks || '',
          }));
          setEditId(null);
          setIsViewOnly(false);
          setPostSavePath(location.state.returnTo || '');
          setViewMode('create');
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
    const method = editId ? 'PUT' : 'POST';
    const url = editId ? `${API_BASE_URL}/api/payments/${editId}` : `${API_BASE_URL}/api/payments`;

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
      body: JSON.stringify({
        ...form,
        type_of_method: form.method,
        payment_amt_in_base: parseFloat(form.payment_amt_in_base)
      })
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      alert(err.error || 'Failed to save payment');
      return;
    }
    
    if (postSavePath) {
      navigate(postSavePath);
      return;
    }

    resetForm();
    fetchData();
  };

  const handleEdit = (p, viewOnly=false) => {
    setForm({
      booking_id: p.booking_id || '',
      payment_amt_in_base: p.payment_amt_in_base || '',
      method: p.type_of_method || 'bank',
      transaction_type: p.transaction_type || 'credit',
      payment_type: p.payment_type || 'advance',
      cheque_no: p.cheque_no || '',
      rtgs_ref_no: p.rtgs_ref_no || '',
      remarks: p.remarks || ''
    });
    setEditId(p.id);
    setIsViewOnly(viewOnly);
    setViewMode('create');
  };

  const resetForm = () => {
    setForm({ booking_id: '', payment_amt_in_base: '', method: 'bank', transaction_type: 'credit', payment_type: 'advance', cheque_no: '', rtgs_ref_no: '', remarks: '' });
    setEditId(null);
    setIsViewOnly(false);
    setPostSavePath('');
  };

  const filteredPayments = payments.filter(p => {
    const matchesSearch = (p.id?.toString() || '').includes(searchTerm) || 
                          (p.booking?.guest_name?.toLowerCase() || '').includes(searchTerm.toLowerCase());
    const actualMethod = p.type_of_method || p.method || 'bank';
    const matchesMethod = filterMethod === 'All Methods' || actualMethod === filterMethod;
    return matchesSearch && matchesMethod;
  });

  const getStatusPill = () => {
    return <span className="bg-green-50 text-green-600 px-3 py-1 rounded border border-green-100 text-[10px] font-bold uppercase tracking-wider">Success</span>;
  }

  if (viewMode === 'create') {
    return (
      <div className="bg-[#F8FAFC] min-h-[calc(100vh-4rem)] p-4 md:p-8 md:-m-8 border-0 md:border-l border-[#E5E7EB]">
        
        <div className="flex items-center gap-3 mb-6">
           <button onClick={() => setViewMode('list')} className="p-2 bg-white border border-[#E5E7EB] rounded-lg text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-colors shadow-sm">
             <ArrowLeft size={18} strokeWidth={2.5} />
           </button>
           <div>
             <h1 className="text-xl font-bold text-gray-900 leading-tight">
               {isViewOnly ? 'Payment Receipt Record' : (editId ? 'Edit Payment' : 'Capture Payment')}
             </h1>
             <p className="text-sm font-medium text-gray-500">{isViewOnly ? 'Official payment transaction record' : 'Register a new transaction against booking'}</p>
           </div>
        </div>

        {isViewOnly ? (
           <div className="bg-white rounded-xl shadow-sm border border-[#E5E7EB] p-8 max-w-[800px]">
              <div className="flex justify-between items-start border-b border-[#E5E7EB] pb-6 mb-6">
                 <div>
                    <div className="text-[10px] font-bold text-[#16A34A] tracking-widest uppercase mb-1 flex items-center gap-1.5"><Printer size={12}/> OFFICIAL RECEIPT</div>
                    <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">RCPT-{form.id || editId}</h2>
                    <p className="text-sm font-bold text-gray-500 mt-1">{new Date(form.payment_date || Date.now()).toLocaleDateString('en-GB')}</p>
                 </div>
                 <div className="text-right">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Received Amount</p>
                    <p className="text-2xl font-extrabold text-green-600">₹ {parseFloat(form.payment_amt_in_base).toLocaleString('en-IN', {minimumFractionDigits: 2})}</p>
                    <span className="bg-green-50 text-green-700 px-3 py-1 rounded border border-green-100 text-[10px] font-bold uppercase tracking-wider mt-2 inline-block">Successful</span>
                 </div>
              </div>
              
              <div className="grid grid-cols-2 gap-y-6 gap-x-12">
                 <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Booking Reference</p>
                    <p className="text-lg font-bold text-gray-900">{bookings.find(b=>b.id == form.booking_id)?.guest_name || 'N/A'} (BKG-{10000 + (form.booking_id||0)})</p>
                 </div>
                 <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Payment Method</p>
                    <p className="text-base font-semibold text-gray-900">{METHOD_LABELS[form.method] || form.method}</p>
                 </div>
              </div>

              {form.remarks && (
                 <div className="mt-8 pt-6 border-t border-dashed border-[#E5E7EB]">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Transaction Narrations / Remarks</p>
                    <p className="text-sm font-medium text-gray-700 bg-gray-50 p-4 rounded-lg">{form.remarks}</p>
                 </div>
              )}
              <div className="mt-8 flex justify-end">
                <button onClick={() => setViewMode('list')} className="px-5 py-2.5 text-sm font-bold text-gray-700 bg-white border border-[#E5E7EB] rounded-lg hover:bg-gray-50 transition-colors shadow-sm">Close View</button>
              </div>
           </div>
        ) : (
        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-[#E5E7EB] p-6 max-w-[1600px]">
           <fieldset disabled={isViewOnly} className="grid grid-cols-1 md:grid-cols-4 gap-x-6 gap-y-5">
               <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Booking ID <span className="text-red-500">*</span></label>
                  <select required value={form.booking_id} onChange={e=>setForm({...form, booking_id: e.target.value})} className="w-full px-3 py-2 bg-white border border-[#E5E7EB] rounded-lg text-sm text-gray-700 font-medium outline-none focus:border-[#2563EB] appearance-none disabled:bg-gray-50 disabled:text-gray-500">
                    <option value="">Select an active booking</option>
                    {bookings.map(b => <option key={b.id} value={b.id}>BKG-{10000 + b.id} - {b.guest_name}</option>)}
                  </select>
               </div>
               <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Payment No (Auto)</label>
                  <input disabled className="w-full px-3 py-2 bg-gray-50 border border-[#E5E7EB] rounded-lg text-sm text-gray-500 outline-none font-medium" value={editId ? `RCPT-${editId}` : "SYS-GEN"} />
               </div>
               <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Payment Date <span className="text-red-500">*</span></label>
                  <input type="date" disabled={isViewOnly || editId} className="w-full px-3 py-2 bg-white border border-[#E5E7EB] rounded-lg text-sm text-gray-900 outline-none focus:border-[#2563EB] disabled:bg-gray-50 disabled:text-gray-500" defaultValue={new Date().toISOString().split('T')[0]} />
               </div>
               <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Tran Type</label>
                  <select value={form.transaction_type} onChange={e=>setForm({...form, transaction_type: e.target.value})} className="w-full px-3 py-2 bg-white border border-[#E5E7EB] rounded-lg text-sm text-gray-700 font-medium outline-none focus:border-[#2563EB] appearance-none disabled:bg-gray-50 disabled:text-gray-500">
                    <option value="credit">Receipt</option>
                    <option value="debit">Refund</option>
                  </select>
               </div>
               <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Amount (₹) <span className="text-red-500">*</span></label>
                  <input required min="1" type="number" value={form.payment_amt_in_base} onChange={e=>setForm({...form, payment_amt_in_base: e.target.value})} className="w-full px-3 py-2 bg-white border border-[#E5E7EB] rounded-lg text-sm text-gray-900 outline-none focus:border-[#2563EB] placeholder:text-gray-400 disabled:bg-gray-50 disabled:text-gray-500" placeholder="0.00" />
               </div>
               <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Currency</label>
                  <select className="w-full px-3 py-2 bg-white border border-[#E5E7EB] rounded-lg text-sm text-gray-700 font-medium outline-none focus:border-[#2563EB] appearance-none disabled:bg-gray-50 disabled:text-gray-500">
                    <option>INR (₹)</option>
                    <option>USD ($)</option>
                  </select>
               </div>
               <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Payment Method <span className="text-red-500">*</span></label>
                  <select required value={form.method} onChange={e=>setForm({...form, method: e.target.value})} className="w-full px-3 py-2 bg-white border border-[#E5E7EB] rounded-lg text-sm text-gray-700 font-medium outline-none focus:border-[#2563EB] appearance-none disabled:bg-gray-50 disabled:text-gray-500">
                    <option value="cash">Cash</option>
                    <option value="bank">Bank Transfer / NEFT</option>
                    <option value="upi">UPI</option>
                    <option value="card">Credit/Debit Card</option>
                    <option value="cheque">Cheque</option>
                    <option value="rtgs">RTGS</option>
                  </select>
               </div>
               <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Transaction ID</label>
                  <input value={form.rtgs_ref_no} onChange={e=>setForm({...form, rtgs_ref_no: e.target.value})} className="w-full px-3 py-2 bg-white border border-[#E5E7EB] rounded-lg text-sm text-gray-900 outline-none focus:border-[#2563EB] placeholder:text-gray-400 disabled:bg-gray-50 disabled:text-gray-500" placeholder="Txn Ref No" />
               </div>
               <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Cheque No</label>
                  <input value={form.cheque_no} onChange={e=>setForm({...form, cheque_no: e.target.value})} className="w-full px-3 py-2 bg-white border border-[#E5E7EB] rounded-lg text-sm text-gray-900 outline-none focus:border-[#2563EB] placeholder:text-gray-400 disabled:bg-gray-50 disabled:text-gray-500" placeholder="Optional" />
               </div>
               <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Cheque Date</label>
                  <input type="date" className="w-full px-3 py-2 bg-white border border-[#E5E7EB] rounded-lg text-sm text-gray-900 outline-none focus:border-[#2563EB] disabled:bg-gray-50 disabled:text-gray-500" />
               </div>
               <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Bank / Network</label>
                  <input className="w-full px-3 py-2 bg-white border border-[#E5E7EB] rounded-lg text-sm text-gray-900 outline-none focus:border-[#2563EB] placeholder:text-gray-400 disabled:bg-gray-50 disabled:text-gray-500" placeholder="Name of network" />
               </div>
               <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Remarks / Ledger Narration</label>
                  <input value={form.remarks} onChange={e=>setForm({...form, remarks: e.target.value})} className="w-full px-3 py-2 bg-white border border-[#E5E7EB] rounded-lg text-sm text-gray-900 outline-none focus:border-[#2563EB] placeholder:text-gray-400 disabled:bg-gray-50 disabled:text-gray-500" placeholder="Add note" />
               </div>
           </fieldset>

          <div className="flex justify-end gap-3 mt-8 pt-5 border-t border-[#E5E7EB]">
             <button type="button" onClick={() => setViewMode('list')} className="px-5 py-2.5 text-sm font-bold text-gray-700 bg-white border border-[#E5E7EB] rounded-lg hover:bg-gray-50 transition-colors shadow-sm">Cancel</button>
             <button type="submit" className="px-5 py-2.5 text-sm font-bold text-white bg-[#2563EB] rounded-lg hover:bg-blue-700 transition-colors shadow-sm">{editId ? 'Save Changes' : 'Confirm Payment'}</button>
          </div>
        </form>
        )}
      </div>
    );
  }

  // LIST VIEW
  return (
    <div className="space-y-6 max-w-[1600px] mx-auto p-4 md:p-0">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 pb-4 border-b border-[#E5E7EB]">
         <div>
           <h1 className="text-2xl font-bold text-gray-900 leading-tight">Payment Receipts</h1>
         </div>
         <div className="flex items-center gap-3 w-full md:w-auto">
            <button onClick={() => exportToCSV(filteredPayments, 'payments')} className="flex-1 md:flex-none justify-center bg-white border-[#E5E7EB] border text-gray-700 px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 hover:bg-gray-50 transition-colors shadow-sm">
               <Download size={16} /> Export CSV
            </button>
            <button onClick={() => { resetForm(); setViewMode('create'); }} className="flex-1 md:flex-none justify-center bg-[#2563EB] text-white px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 hover:bg-blue-700 transition-colors shadow-sm">
               <Plus size={16} /> New Payment
            </button>
         </div>
      </div>

      <div className="bg-white border border-[#E5E7EB] rounded-[12px] shadow-sm flex flex-col">
         {/* Filter Strip */}
         <div className="p-4 border-b border-[#E5E7EB] flex flex-col md:flex-row flex-wrap md:items-center gap-3 bg-gray-50/50 rounded-t-[12px]">
            <div className="w-full md:flex-1 md:min-w-[250px] relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input 
                type="text" 
                placeholder="Search Receipt, Guest or Booking ID..." 
                value={searchTerm} 
                onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }} 
                className="w-full pl-10 pr-4 py-2 bg-white border border-[#E5E7EB] rounded-lg text-sm text-gray-700 outline-none focus:border-[#2563EB] placeholder:text-gray-400" 
              />
            </div>
            <div className="flex gap-3 w-full md:w-auto">
               <select value={filterMethod} onChange={e => { setFilterMethod(e.target.value); setCurrentPage(1); }} className="flex-1 md:w-40 px-3 py-2 bg-white border border-[#E5E7EB] rounded-lg text-sm text-gray-700 font-medium outline-none">
                 <option>All Methods</option>
                 <option value="bank">Bank Transfer</option>
                 <option value="cash">Cash</option>
                 <option value="upi">UPI</option>
                 <option value="card">Card</option>
                 <option value="cheque">Cheque</option>
                 <option value="rtgs">RTGS</option>
               </select>
               <button onClick={() => { setSearchTerm(''); setFilterMethod('All Methods'); setCurrentPage(1); }} className="px-5 py-2 text-[#2563EB] border border-blue-200 bg-blue-50 hover:bg-blue-100 rounded-lg text-sm font-semibold transition-colors">
                 Reset
               </button>
            </div>
         </div>

         <div className="overflow-x-auto hidden md:block">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="text-gray-500 font-semibold border-b border-[#E5E7EB]">
                <tr>
                  <th className="px-6 py-4 font-medium text-[12px] tracking-wider">S.No</th>
                  <th className="px-6 py-4 font-medium text-[12px] tracking-wider">Date</th>
                  <th className="px-6 py-4 font-medium text-[12px] tracking-wider">Receipt No</th>
                  <th className="px-6 py-4 font-medium text-[12px] tracking-wider">Booking / Guest</th>
                  <th className="px-6 py-4 font-medium text-[12px] tracking-wider">Method</th>
                  <th className="px-6 py-4 font-medium text-[12px] tracking-wider text-right">Amount (₹)</th>
                  <th className="px-6 py-4 font-medium text-[12px] tracking-wider">Status</th>
                  <th className="px-6 py-4 font-medium text-[12px] tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB] text-gray-800 font-medium">
                {loading ? (
                   <tr><td colSpan={8} className="px-6 py-12 text-center text-gray-500">Loading ledger...</td></tr>
                ) : payments.length === 0 ? (
                   <tr><td colSpan={8} className="px-6 py-12 text-center text-gray-500">No payment receipts found.</td></tr>
                ) : payments.map((p, index) => (
                  <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-gray-500 font-bold">{(currentPage - 1) * limit + index + 1}</td>
                    <td className="px-6 py-4 text-gray-500">{new Date(p.payment_date).toLocaleDateString()}</td>
                    <td className="px-6 py-4 font-bold text-gray-900">RCPT-{p.id}</td>
                    <td className="px-6 py-4 text-[#2563EB] font-bold">
                       {p.booking ? `BKG-${p.booking.id}` : 'Unknown'}
                       <span className="text-gray-500 font-medium ml-2 text-xs">{p.booking?.guest_name}</span>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{METHOD_LABELS[p.type_of_method || p.method] || p.type_of_method || p.method || '-'}</td>
                    <td className="px-6 py-4 font-bold text-gray-900 text-right">₹{parseFloat(p.payment_amt_in_base).toLocaleString('en-IN', {minimumFractionDigits:2})}</td>
                    <td className="px-6 py-4">{getStatusPill()}</td>
                    <td className="px-6 py-4">
                       <div className="flex items-center justify-end gap-3 text-[#2563EB]">
                          <button onClick={() => handleEdit(p, true)} className="hover:text-blue-800" title="View"><Eye size={16}/></button>
                          <button onClick={() => handleEdit(p, false)} className="hover:text-blue-800" title="Edit"><Edit2 size={16}/></button>
                          <button className="hover:text-blue-800" title="Print Receipt"><Printer size={16}/></button>
                       </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
         </div>

         {/* Mobile Card View */}
         <div className="block md:hidden bg-white">
            {loading ? (
               <div className="p-8 text-center text-gray-500 font-medium">Loading ledger...</div>
            ) : payments.length === 0 ? (
               <div className="p-8 text-center text-gray-500 flex flex-col items-center">
                 <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
                   <Printer className="text-gray-400" size={24} />
                 </div>
                 <p className="font-semibold text-gray-900 mb-1">No payment receipts found</p>
                 <p className="text-sm text-gray-500">Adjust filters or add a new payment.</p>
               </div>
            ) : (
               <div className="divide-y divide-[#E5E7EB]">
                 {payments.map((p, index) => (
                    <div key={p.id} className="p-4 flex flex-col gap-3">
                       <div className="flex justify-between items-start">
                          <div>
                             <h3 className="text-sm font-bold text-gray-900">RCPT-{p.id}</h3>
                             <p className="text-xs text-[#2563EB] font-bold mt-0.5">BKG-{p.booking?.id || 'N/A'}</p>
                          </div>
                          <div className="text-right">
                             <p className="text-sm font-extrabold text-gray-900">₹{parseFloat(p.payment_amt_in_base).toLocaleString('en-IN', {minimumFractionDigits:2})}</p>
                             <div className="mt-1 flex justify-end">{getStatusPill()}</div>
                          </div>
                       </div>
                       <div className="flex justify-between items-center text-xs">
                          <span className="text-gray-500 font-medium">{METHOD_LABELS[p.type_of_method || p.method] || p.type_of_method || p.method || '-'}</span>
                          <span className="text-gray-500 font-medium">{new Date(p.payment_date).toLocaleDateString()}</span>
                       </div>
                       <div className="flex justify-between items-center mt-2 pt-3 border-t border-[#E5E7EB]">
                          <span className="text-xs text-gray-500 truncate max-w-[150px]">{p.booking?.guest_name || 'Unknown Guest'}</span>
                          <div className="flex items-center gap-4 text-[#2563EB]">
                             <button onClick={() => handleEdit(p, true)} className="hover:text-blue-800 flex items-center gap-1 text-xs font-bold" title="View"><Eye size={14}/> View</button>
                             <button onClick={() => handleEdit(p, false)} className="hover:text-blue-800 flex items-center gap-1 text-xs font-bold" title="Edit"><Edit2 size={14}/> Edit</button>
                          </div>
                       </div>
                    </div>
                 ))}
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
