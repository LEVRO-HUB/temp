import React, { useState, useEffect } from 'react';
import { 
  ShoppingBag, CheckCircle, Clock, Package, X, Search, 
  ArrowLeft, Building2, MapPin, Tags, CreditCard, 
  CalendarClock, FileText, LayoutDashboard, ClipboardList, 
  UserCheck, Users, BarChart3, Bell, Menu, Plus, 
  Trash2, ChevronRight, Check, AlertCircle, FileDown
} from 'lucide-react';
import '../styles/PurchaseOrderManagement.css';
import { useNavigate } from 'react-router-dom';
import API_BASE_URL from '../config';

export default function PurchaseOrderManagement({ tab }) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(tab || 'dashboard'); 
  
  useEffect(() => {
    if (tab) setActiveTab(tab);
  }, [tab]);
  
  // Data State
  const [pos, setPos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Form State for new PO
  const [formData, setFormData] = useState({
    department: '',
    vendor_name: '',
    po_date: new Date().toISOString().split('T')[0],
    expected_delivery: '',
    priority: 'Normal',
    payment_terms: 'Net 30 days',
    delivery_location: 'Loading Bay B, Ground Floor',
    contact_person: '',
    remarks: ''
  });
  
  const [lineItems, setLineItems] = useState([
    { id: 1, description: '', unit: 'Units', quantity: 1, unit_price: 0, total_price: 0 }
  ]);

  useEffect(() => {
    fetchPOs();
  }, [activeTab]);

  const fetchPOs = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/api/pos`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setPos(await res.json());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleLineItemChange = (id, field, value) => {
    const updated = lineItems.map(item => {
      if (item.id === id) {
        const newItem = { ...item, [field]: value };
        if (field === 'quantity' || field === 'unit_price') {
          const qty = field === 'quantity' ? value : item.quantity;
          const up = field === 'unit_price' ? value : item.unit_price;
          newItem.total_price = (qty || 0) * (up || 0);
        }
        return newItem;
      }
      return item;
    });
    setLineItems(updated);
  };

  const addLineItem = () => {
    setLineItems([
      ...lineItems, 
      { id: Date.now(), description: '', unit: 'Units', quantity: 1, unit_price: 0, total_price: 0 }
    ]);
  };

  const deleteLineItem = (id) => {
    if (lineItems.length > 1) {
      setLineItems(lineItems.filter(item => item.id !== id));
    }
  };

  const calculateTotals = () => {
    const subtotal = lineItems.reduce((acc, item) => acc + item.total_price, 0);
    const gst = subtotal * 0.18;
    return { subtotal, gst, grandTotal: subtotal + gst };
  };

  const submitPO = async (e) => {
    if (e) e.preventDefault();
    if (!formData.vendor_name || !formData.department) {
      alert("Please fill required fields (Department, Vendor)");
      return;
    }
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/api/pos`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...formData,
          site_id: 1, 
          items: lineItems,
          flag: 0 
        })
      });
      if (res.ok) {
        alert("Purchase Order submitted successfully!");
        setActiveTab('po-list');
        setLineItems([{ id: 1, description: '', unit: 'Units', quantity: 1, unit_price: 0, total_price: 0 }]);
        setFormData({
            department: '',
            vendor_name: '',
            po_date: new Date().toISOString().split('T')[0],
            expected_delivery: '',
            priority: 'Normal',
            payment_terms: 'Net 30 days',
            delivery_location: 'Loading Bay B, Ground Floor',
            contact_person: '',
            remarks: ''
          });
      }
    } catch (e) {
      console.error(e);
    }
  };

  const updatePOStatus = async (id, newFlag) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/api/pos/${id}/status`, {
        method: 'PUT',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ flag: newFlag })
      });
      if (res.ok) {
        fetchPOs();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const getStatusBadge = (flag) => {
    switch(flag) {
      case 0: return <span className="badge badge-pending">Pending</span>;
      case 1: return <span className="badge badge-approved">Approved</span>;
      case 2: return <span className="badge badge-rejected">Rejected</span>;
      case 3: return <span className="badge badge-draft">Draft</span>;
      default: return <span className="badge">Unknown</span>;
    }
  };

  const renderDashboard = () => (
    <section className={`page-section ${activeTab === 'dashboard' ? 'active' : ''}`}>
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Monthly Spend</div>
          <div className="stat-value">₹{(pos.reduce((acc, po) => acc + po.total_amount, 0) / 100000).toFixed(1)}L</div>
          <div className="stat-sub">{pos.length} POs this month</div>
          <div className="stat-icon"><CreditCard size={18} /></div>
        </div>
        <div className="stat-card blue">
          <div className="stat-label">Pending Approval</div>
          <div className="stat-value">{pos.filter(p => p.flag === 0).length}</div>
          <div className="stat-sub">Action required</div>
          <div className="stat-icon"><Clock size={18} /></div>
        </div>
        <div className="stat-card green">
          <div className="stat-label">Approved</div>
          <div className="stat-value">{pos.filter(p => p.flag === 1).length}</div>
          <div className="stat-sub">Ready for delivery</div>
          <div className="stat-icon"><CheckCircle size={18} /></div>
        </div>
        <div className="stat-card red">
          <div className="stat-label">Urgent POs</div>
          <div className="stat-value">{pos.filter(p => p.priority === 'Urgent' && p.flag === 0).length}</div>
          <div className="stat-sub">High priority</div>
          <div className="stat-icon"><AlertCircle size={18} /></div>
        </div>
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="card-header"><div className="card-title">Budget Utilization</div></div>
          <div className="card-body">
             <div className="flex flex-col gap-5">
                <div>
                   <div className="flex justify-between text-xs mb-1.5 font-medium"><span>F&B / Kitchen</span><span className="font-600">70%</span></div>
                   <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden"><div className="h-full bg-blue-600" style={{width:'70%'}}></div></div>
                </div>
                <div>
                   <div className="flex justify-between text-xs mb-1.5 font-medium"><span>Housekeeping</span><span className="font-600">45%</span></div>
                   <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden"><div className="h-full bg-blue-600" style={{width:'45%'}}></div></div>
                </div>
                <div>
                   <div className="flex justify-between text-xs mb-1.5 font-medium"><span>Maintenance</span><span className="font-600 text-red-600">92%</span></div>
                   <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden"><div className="h-full bg-red-600" style={{width:'92%'}}></div></div>
                </div>
             </div>
          </div>
        </div>
        <div className="card">
           <div className="card-header"><div className="card-title">Recent Activity</div></div>
           <div className="card-body flex flex-col gap-1">
              {pos.slice(0, 3).map(po => (
                <div key={po.id} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors p-2 rounded-lg">
                   <div className={`p-2 rounded-lg ${po.flag===1 ? 'bg-green-50 text-green-600' : 'bg-amber-50 text-amber-600'}`}>
                      {po.flag===1 ? <CheckCircle size={14}/> : <Clock size={14}/>}
                   </div>
                   <div className="flex-1">
                      <div className="text-xs font-bold text-gray-900">{po.po_number} - {po.vendor_name}</div>
                      <div className="text-[10px] text-gray-500">₹{Number(po.total_amount).toLocaleString()} · {new Date(po.created_at).toLocaleDateString()}</div>
                   </div>
                   <ChevronRight size={14} className="text-gray-300" />
                </div>
              ))}
              <button onClick={() => setActiveTab('po-list')} className="text-center text-[11px] font-bold text-blue-600 mt-2 mt-2 hover:underline">View All Activities</button>
           </div>
        </div>
      </div>
    </section>
  );

  const renderPOList = () => (
    <section className={`page-section ${activeTab === 'po-list' ? 'active' : ''}`}>
      <div className="flex flex-col md:flex-row gap-3 mb-6 items-stretch md:items-center">
         <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-all bg-white" 
              placeholder="Search by PO ID, Vendor, or Department..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
         </div>
         <button onClick={() => setActiveTab('create-po')} className="btn btn-blue rounded-xl px-6 py-2.5 shadow-sm">
            <Plus size={16} /> New Purchase Order
         </button>
      </div>

      <div className="card border-0 shadow-md">
         <div className="table-wrap">
            <table className="w-full">
               <thead>
                  <tr>
                     <th>PO Number</th>
                     <th>Vendor Details</th>
                     <th>Department</th>
                     <th>Items</th>
                     <th>Amount</th>
                     <th>Status</th>
                     <th>Priority</th>
                     <th>Action</th>
                  </tr>
               </thead>
               <tbody className="bg-white">
                  {pos.filter(p => 
                    p.vendor_name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                    p.po_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    (p.department && p.department.toLowerCase().includes(searchQuery.toLowerCase()))
                  ).map(po => (
                    <tr key={po.id} className="hover:bg-gray-50 transition-colors">
                       <td className="px-6 py-4"><span className="po-id">{po.po_number}</span></td>
                       <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                             <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 font-bold text-[10px]">{po.vendor_name?.charAt(0)}</div>
                             <div>
                                <div className="vendor-name text-sm">{po.vendor_name}</div>
                                <div className="text-[10px] text-gray-400 capitalize">{po.site?.site_name}</div>
                             </div>
                          </div>
                       </td>
                       <td className="px-6 py-4"><span className="text-xs text-gray-600">{po.department || '--'}</span></td>
                       <td className="px-6 py-4"><span className="text-xs font-medium text-gray-500">{po.items?.length || 0} items</span></td>
                       <td className="px-6 py-4"><div className="amount-cell text-sm">₹{Number(po.total_amount).toLocaleString('en-IN')}</div></td>
                       <td className="px-6 py-4">{getStatusBadge(po.flag)}</td>
                       <td className="px-6 py-4">
                          <span className={`badge ${po.priority === 'Urgent' ? 'badge-urgent' : ''}`} style={po.priority !== 'Urgent' ? {color:'#888', background:'#f5f5f5'} : {}}>
                            {po.priority}
                          </span>
                       </td>
                       <td className="px-6 py-4">
                          <button className="p-2 border border-gray-100 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-white hover:shadow-sm transition-all">
                             <FileText size={16} />
                          </button>
                       </td>
                    </tr>
                  ))}
               </tbody>
            </table>
            {pos.length === 0 && !loading && (
              <div className="py-20 text-center flex flex-col items-center gap-4 text-gray-400">
                 <ShoppingBag size={48} className="opacity-10" />
                 <p className="text-sm">No purchase orders found</p>
              </div>
            )}
         </div>
      </div>
    </section>
  );

  const renderCreatePO = () => {
    const { subtotal, gst, grandTotal } = calculateTotals();
    return (
      <section className={`page-section ${activeTab === 'create-po' ? 'active' : ''}`}>
        <div className="card max-w-[1000px] mx-auto border-0 shadow-lg">
          <div className="card-header bg-gray-50/50">
            <div className="card-title text-base">New Purchase Requisition</div>
            <div className="flex items-center gap-2 text-[10px] text-gray-400 bg-white px-2 py-1 rounded-md border border-gray-100"><CalendarClock size={12}/> PO Number generated on save</div>
          </div>
          <form className="card-body p-8" onSubmit={submitPO}>
             <div className="form-section">
                <div className="form-section-title">PO Header Information</div>
                <div className="form-grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div className="form-group">
                      <label className="form-label flex items-center gap-2"><MapPin size={12}/> Department <span>*</span></label>
                      <select className="form-control" required value={formData.department} onChange={e=>setFormData({...formData, department: e.target.value})}>
                         <option value="">Select Department</option>
                         <option>F&B / Kitchen</option>
                         <option>Housekeeping</option>
                         <option>Maintenance</option>
                         <option>Front Office</option>
                         <option>Engineering</option>
                      </select>
                   </div>
                   <div className="form-group">
                      <label className="form-label flex items-center gap-2"><Building2 size={12}/> Vendor <span>*</span></label>
                      <input type="text" className="form-control" required placeholder="Search or enter vendor name..." value={formData.vendor_name} onChange={e=>setFormData({...formData, vendor_name: e.target.value})} />
                   </div>
                   <div className="form-group">
                      <label className="form-label flex items-center gap-2"><CalendarClock size={12}/> Expected Delivery</label>
                      <input type="date" className="form-control" value={formData.expected_delivery} onChange={e=>setFormData({...formData, expected_delivery: e.target.value})} />
                   </div>
                   <div className="form-group">
                      <label className="form-label flex items-center gap-2"><AlertCircle size={12}/> Priority Level</label>
                      <select className="form-control" value={formData.priority} onChange={e=>setFormData({...formData, priority: e.target.value})}>
                         <option>Normal</option>
                         <option>Urgent</option>
                         <option>Low</option>
                      </select>
                   </div>
                </div>
             </div>

             <div className="form-section mt-8">
                <div className="form-section-title">Purchase Line Items</div>
                <div className="table-wrap mb-4 bg-gray-50 p-2 rounded-xl border border-gray-100">
                   <table className="line-items-table po-module-container">
                      <thead>
                         <tr>
                            <th>Item Description</th>
                            <th style={{width:'100px'}}>Unit</th>
                            <th style={{width:'80px'}}>Qty</th>
                            <th style={{width:'120px'}}>Unit Price (₹)</th>
                            <th style={{width:'130px'}}>Total (₹)</th>
                            <th style={{width:'40px'}}></th>
                         </tr>
                      </thead>
                      <tbody>
                         {lineItems.map(item => (
                           <tr key={item.id} className="bg-white">
                              <td><input type="text" className="text-xs" placeholder="e.g. Standard Guest Towels..." value={item.description} onChange={e=>handleLineItemChange(item.id, 'description', e.target.value)} /></td>
                              <td><select className="text-xs" value={item.unit} onChange={e=>handleLineItemChange(item.id, 'unit', e.target.value)}><option>Units</option><option>Kg</option><option>Litres</option><option>Bags</option><option>Boxes</option></select></td>
                              <td><input type="number" className="text-xs font-bold" min="1" value={item.quantity} onChange={e=>handleLineItemChange(item.id, 'quantity', parseInt(e.target.value) || 1)} /></td>
                              <td><input type="number" className="text-xs font-bold" placeholder="0" value={item.unit_price} onChange={e=>handleLineItemChange(item.id, 'unit_price', parseFloat(e.target.value) || 0)} /></td>
                              <td className="font-bold text-sm text-gray-900">₹{Number(item.total_price).toLocaleString()}</td>
                              <td><button type="button" onClick={() => deleteLineItem(item.id)} className="text-gray-300 hover:text-red-500 transition-colors"><Trash2 size={14}/></button></td>
                           </tr>
                         ))}
                      </tbody>
                   </table>
                </div>
                <button type="button" className="btn btn-outline btn-sm text-[11px] font-bold border-gray-200" onClick={addLineItem}>
                   <Plus size={14} /> Add Line Item
                </button>

                <div className="total-section mt-8 pt-8 border-t border-dashed border-gray-200">
                   <div className="total-box bg-blue-600 text-white p-6 rounded-2xl shadow-lg">
                      <div className="total-row text-white/70 mb-2 border-b border-white/10 pb-2"><span>Subtotal (Net)</span><span className="font-bold text-white">₹{subtotal.toLocaleString()}</span></div>
                      <div className="total-row text-white/70 mb-4"><span>GST Compliance (18%)</span><span className="font-bold text-white">₹{gst.toLocaleString()}</span></div>
                      <div className="total-row grand mt-2 pt-4 border-t border-white/20">
                         <div className="flex flex-col">
                            <span className="text-white/50 text-[10px] uppercase tracking-widest font-bold mb-1">Grand Payable</span>
                            <span className="text-2xl font-bold tracking-tighter text-white">₹{grandTotal.toLocaleString()}</span>
                         </div>
                      </div>
                   </div>
                </div>
             </div>

             <div className="flex items-center justify-between mt-10 pt-8 border-t border-gray-100">
                <button type="button" className="btn btn-ghost text-gray-500 font-bold" onClick={() => setActiveTab('po-list')}><ArrowLeft size={16}/> Discard Changes</button>
                <div className="flex gap-4">
                   <button type="button" className="btn btn-outline font-bold border-gray-200">Save as Draft</button>
                   <button type="submit" className="btn btn-blue px-8 py-3 rounded-xl font-bold text-sm shadow-md">Submit for Approval <ChevronRight size={16}/></button>
                </div>
             </div>
          </form>
        </div>
      </section>
    );
  };

  const subModules = [
    { id: 'dashboard', name: 'Dashboard', path: '/purchase-orders/dashboard', icon: LayoutDashboard },
    { id: 'po-list', name: 'Purchase Orders', path: '/purchase-orders/list', icon: ClipboardList },
    { id: 'approval', name: 'Approvals', path: '/purchase-orders/approvals', icon: UserCheck },
    { id: 'vendors', name: 'Vendor Network', path: '/purchase-orders/vendors', icon: Users },
    { id: 'budget', name: 'Financial Audit', path: '/purchase-orders/audit', icon: BarChart3 },
  ];

  return (
    <div className="po-module-container !bg-transparent !min-h-0 -m-8">
      {/* Sub-Module Navigation Bar */}
      <div className="bg-white border-b border-gray-100 px-8 py-0 flex items-center justify-between sticky top-0 z-[20] shadow-sm">
         <div className="flex">
            {subModules.map(mod => (
              <button 
                key={mod.id} 
                onClick={() => navigate(mod.path)}
                className={`flex items-center gap-2 px-6 py-4 text-[13px] font-bold transition-all relative ${
                  activeTab === mod.id || (activeTab === 'create-po' && mod.id === 'po-list') 
                    ? 'text-blue-600' 
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                <mod.icon size={16} />
                {mod.name}
                {(activeTab === mod.id || (activeTab === 'create-po' && mod.id === 'po-list')) && (
                   <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"></div>
                )}
              </button>
            ))}
         </div>
         <div className="hidden lg:flex items-center gap-3">
            <div className="text-right">
               <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest leading-none">Procurement Controller</div>
               <div className="text-gray-900 text-xs font-bold mt-1">Rajan M.</div>
            </div>
            <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 font-bold text-[10px] border border-blue-100">RM</div>
         </div>
      </div>

      {/* Content Area */}
      <div className="p-8 max-w-[1500px] mx-auto">
         {activeTab === 'dashboard' && renderDashboard()}
         {activeTab === 'po-list' && renderPOList()}
         {activeTab === 'create-po' && renderCreatePO()}
         
         {activeTab === 'approval' && (
           <div className="page-section active">
              <div className="flex items-center justify-between mb-6">
                 <h2 className="text-xl font-bold text-gray-900">Pending Approvals</h2>
                 <p className="text-xs text-gray-500">{pos.filter(p => p.flag === 0).length} requests require action</p>
              </div>
              <div className="card">
                 <div className="table-wrap">
                    <table className="w-full">
                       <thead>
                          <tr>
                             <th>PO Number</th>
                             <th>Vendor & Dept</th>
                             <th>Amount</th>
                             <th>Actions</th>
                          </tr>
                       </thead>
                       <tbody>
                          {pos.filter(p => p.flag === 0).map(po => (
                            <tr key={po.id}>
                               <td className="px-6 py-4 font-bold">{po.po_number}</td>
                               <td className="px-6 py-4">
                                  <div className="text-sm font-medium">{po.vendor_name}</div>
                                  <div className="text-[10px] text-gray-500">{po.department}</div>
                               </td>
                               <td className="px-6 py-4">₹{Number(po.total_amount).toLocaleString()}</td>
                               <td className="px-6 py-4">
                                  <div className="flex gap-2">
                                     <button onClick={() => updatePOStatus(po.id, 1)} className="p-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors"><Check size={16}/></button>
                                     <button onClick={() => updatePOStatus(po.id, 2)} className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"><X size={16}/></button>
                                  </div>
                               </td>
                            </tr>
                          ))}
                          {pos.filter(p => p.flag === 0).length === 0 && (
                            <tr><td colSpan="4" className="text-center py-20 text-gray-400">All caught up! No pending approvals.</td></tr>
                          )}
                       </tbody>
                    </table>
                 </div>
              </div>
           </div>
         )}
         
         {activeTab === 'vendors' && (
           <div className="page-section active">
              <div className="flex items-center justify-between mb-6">
                 <h2 className="text-xl font-bold text-gray-900">Vendor Network</h2>
                 <button className="btn btn-blue btn-sm"><Plus size={14}/> Add New Vendor</button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                 {Array.from(new Set(pos.map(p => p.vendor_name))).map(vName => {
                    const vendorPos = pos.filter(p => p.vendor_name === vName);
                    const totalSpent = vendorPos.reduce((sum, p) => sum + p.total_amount, 0);
                    return (
                      <div key={vName} className="card p-6 border-0 shadow-sm hover:shadow-md transition-all">
                         <div className="flex items-center gap-4 mb-4">
                            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center font-bold">{vName.charAt(0)}</div>
                            <div>
                               <div className="font-bold text-gray-900">{vName}</div>
                               <div className="text-[10px] text-gray-400">{vendorPos.length} Purchase Orders</div>
                            </div>
                         </div>
                         <div className="flex justify-between items-end">
                            <div>
                               <div className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">Total Spent</div>
                               <div className="text-lg font-bold text-gray-900">₹{totalSpent.toLocaleString()}</div>
                            </div>
                            <button className="text-blue-600 font-bold text-[11px] hover:underline">View History</button>
                         </div>
                      </div>
                    );
                 })}
              </div>
           </div>
         )}

         {activeTab === 'budget' && (
           <div className="page-section active">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Financial Audit & Insights</h2>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                 <div className="lg:col-span-2 card p-8">
                    <div className="flex items-center justify-between mb-8">
                       <div className="card-title">Department-wise Spend Analytics</div>
                       <BarChart3 size={18} className="text-gray-400" />
                    </div>
                    <div className="flex flex-col gap-8">
                       {['F&B / Kitchen', 'Housekeeping', 'Maintenance', 'Engineering'].map(dept => {
                          const deptPos = pos.filter(p => p.department === dept);
                          const deptTotal = deptPos.reduce((sum, p) => sum + p.total_amount, 0);
                          const maxTotal = Math.max(...['F&B / Kitchen', 'Housekeeping', 'Maintenance', 'Engineering'].map(d => 
                             pos.filter(p => p.department === d).reduce((s, p) => s + p.total_amount, 0)
                          )) || 1;
                          const percentage = (deptTotal / maxTotal) * 100;
                          return (
                            <div key={dept}>
                               <div className="flex justify-between mb-2">
                                  <span className="text-sm font-medium">{dept}</span>
                                  <span className="text-sm font-bold">₹{deptTotal.toLocaleString()}</span>
                               </div>
                               <div className="h-2 bg-gray-50 rounded-full overflow-hidden">
                                  <div className="h-full bg-blue-600 rounded-full" style={{width: `${percentage}%`}}></div>
                               </div>
                            </div>
                          );
                       })}
                    </div>
                 </div>
                 <div className="card p-8">
                    <div className="card-title mb-6">Summary Metrics</div>
                    <div className="flex flex-col gap-6">
                       <div>
                          <div className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">Total Liability</div>
                          <div className="text-2xl font-bold text-gray-900">₹{pos.reduce((s,p) => s+p.total_amount, 0).toLocaleString()}</div>
                       </div>
                       <div className="pt-6 border-t border-gray-50">
                          <div className="text-[10px] text-gray-400 uppercase tracking-widest font-bold text-green-600">Approved Payouts</div>
                          <div className="text-xl font-bold text-gray-900">₹{pos.filter(p=>p.flag===1).reduce((s,p) => s+p.total_amount, 0).toLocaleString()}</div>
                       </div>
                       <div className="pt-6 border-t border-gray-50">
                          <div className="text-[10px] text-gray-400 uppercase tracking-widest font-bold text-amber-600">Pending Authorization</div>
                          <div className="text-xl font-bold text-gray-900">₹{pos.filter(p=>p.flag===0).reduce((s,p) => s+p.total_amount, 0).toLocaleString()}</div>
                       </div>
                    </div>
                 </div>
              </div>
           </div>
         )}
      </div>
    </div>
  );
}
