import React, { useState, useEffect } from 'react';
import { Plus, Eye, Edit2, Map, Building2, ArrowLeft, Download, DoorOpen } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { exportToCSV } from '../utils/exportCSV';
import API_BASE_URL from '../config';

export default function ZoneSiteManagement() {
  const navigate = useNavigate();
  const [zones, setZones] = useState([]);
  const [sites, setSites] = useState([]);
  const [viewMode, setViewMode] = useState('list'); // list | createZone | createSite
  const [activeTab, setActiveTab] = useState('zones'); // zones | sites
  const [loading, setLoading] = useState(true);

  // Edit and View states
  const [editId, setEditId] = useState(null);
  const [isViewOnly, setIsViewOnly] = useState(false);

  const [zoneName, setZoneName] = useState('');
  const [zoneCode, setZoneCode] = useState('');
  const [siteForm, setSiteForm] = useState({ 
    site_name: '', zone_id: '', site_type: 'hotel', location: '', full_address: '', 
    unit_code: '', total_rooms: ''
  });
  const [employees, setEmployees] = useState([]);

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { 'Authorization': 'Bearer ' + token };
      
      const resEmps = await fetch(`${API_BASE_URL}/api/employees`, { headers });
      if(resEmps.ok) setEmployees(await resEmps.json());

      if(activeTab === 'zones') {
        const res = await fetch(`${API_BASE_URL}/api/locations/zones`, { headers });
        if(res.ok) setZones(await res.json());
      } else {
        const res = await fetch(`${API_BASE_URL}/api/locations/sites`, { headers });
        if(res.ok) setSites(await res.json());
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCreateZone = async (e) => {
    e.preventDefault();
    if(isViewOnly) return setViewMode('list');
    const token = localStorage.getItem('token');
    const url = editId ? `${API_BASE_URL}/api/locations/zones/${editId}` : `${API_BASE_URL}/api/locations/zones`;
    const method = editId ? 'PUT' : 'POST';
    await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
      body: JSON.stringify({ zone_name: zoneName, zone_code: zoneCode })
    });
    setZoneName('');
    setZoneCode('');
    setEditId(null);
    setViewMode('list');
    fetchData();
  };

  const handleCreateSite = async (e) => {
    e.preventDefault();
    if(isViewOnly) return setViewMode('list');
    const token = localStorage.getItem('token');
    const url = editId ? `${API_BASE_URL}/api/locations/sites/${editId}` : `${API_BASE_URL}/api/locations/sites`;
    const method = editId ? 'PUT' : 'POST';
    await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
      body: JSON.stringify({...siteForm, zone_id: parseInt(siteForm.zone_id), total_rooms: parseInt(siteForm.total_rooms)})
    });
    setSiteForm({ site_name: '', zone_id: '', site_type: 'hotel', location: '', full_address: '', unit_code: '', total_rooms: '' });
    setEditId(null);
    setViewMode('list');
    fetchData();
  };

  const handleEditZone = (z, viewOnly=false) => {
    setZoneName(z.zone_name);
    setZoneCode(z.zone_code || '');
    setEditId(z.id);
    setIsViewOnly(viewOnly);
    setViewMode('createZone');
  };

  const handleEditSite = (s, viewOnly=false) => {
    setSiteForm({
      site_name: s.site_name, zone_id: s.zone_id, site_type: s.site_type, 
      location: s.location || '', full_address: s.full_address || '', 
      unit_code: s.unit_code || '', total_rooms: s.total_rooms || ''
    });
    setEditId(s.id);
    setIsViewOnly(viewOnly);
    setViewMode('createSite');
  };

  const resetZoneForm = () => { setEditId(null); setIsViewOnly(false); setZoneName(''); setZoneCode(''); setViewMode('createZone'); };
  const resetSiteForm = () => { setEditId(null); setIsViewOnly(false); setSiteForm({ site_name: '', zone_id: '', site_type: 'hotel', location: '', full_address: '', unit_code: '', total_rooms: '' }); setViewMode('createSite'); };

  if (viewMode === 'createZone') {
    return (
      <div className="bg-[#F8FAFC] min-h-[calc(100vh-4rem)] p-4 md:p-8 md:-m-8 border-0 md:border-l border-[#E5E7EB]">
        
        <div className="flex items-center gap-3 mb-6">
           <button onClick={() => setViewMode('list')} className="p-2 bg-white border border-[#E5E7EB] rounded-lg text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-colors shadow-sm">
             <ArrowLeft size={18} strokeWidth={2.5} />
           </button>
           <div>
             <h1 className="text-xl font-bold text-gray-900 leading-tight">
               {isViewOnly ? 'View Zone' : (editId ? 'Edit Zone' : 'Add New Zone')}
             </h1>
             <p className="text-sm font-medium text-gray-500">{isViewOnly ? 'Reviewing zone records' : 'Enter zone details below'}</p>
           </div>
        </div>

        <form onSubmit={handleCreateZone} className="bg-white rounded-xl shadow-sm border border-[#E5E7EB] p-6 max-w-[1600px]">
           <fieldset disabled={isViewOnly} className="grid grid-cols-1 md:grid-cols-4 gap-x-6 gap-y-5">
               <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Zone Name <span className="text-red-500">*</span></label>
                  <input required value={zoneName} onChange={e=>setZoneName(e.target.value)} className="w-full px-3 py-2 bg-white border border-[#E5E7EB] rounded-lg text-sm text-gray-900 outline-none focus:border-[#2563EB] placeholder:text-gray-400 disabled:bg-gray-50 disabled:text-gray-500" placeholder="Enter zone name" />
               </div>
               <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Zone Code</label>
                  <input value={zoneCode} onChange={e=>setZoneCode(e.target.value)} className="w-full px-3 py-2 bg-white border border-[#E5E7EB] rounded-lg text-sm text-gray-900 outline-none focus:border-[#2563EB] placeholder:text-gray-400 disabled:bg-gray-50 disabled:text-gray-500" placeholder="Enter zone code" />
               </div>
               <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Region / State</label>
                  <select className="w-full px-3 py-2 bg-white border border-[#E5E7EB] rounded-lg text-sm text-gray-700 font-medium outline-none focus:border-[#2563EB] appearance-none disabled:bg-gray-50 disabled:text-gray-500">
                    <option value="">Select State</option>
                    <option value="tn">Tamil Nadu</option>
                  </select>
               </div>
               <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Description</label>
                  <input className="w-full px-3 py-2 bg-white border border-[#E5E7EB] rounded-lg text-sm text-gray-900 outline-none focus:border-[#2563EB] placeholder:text-gray-400 disabled:bg-gray-50 disabled:text-gray-500" placeholder="Description about zone" />
               </div>
               <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Select Managers</label>
                  <select className="w-full px-3 py-2 bg-white border border-[#E5E7EB] rounded-lg text-sm text-gray-700 font-medium outline-none focus:border-[#2563EB] appearance-none disabled:bg-gray-50 disabled:text-gray-500">
                    <option value="">Select Managers</option>
                    {employees.filter(e => e.role === 'manager' || e.role === 'admin').map(e => (
                      <option key={e.id} value={e.id}>{e.name}</option>
                    ))}
                  </select>
               </div>
           </fieldset>

          <div className="flex justify-end gap-3 mt-8 pt-5 border-t border-[#E5E7EB]">
             <button type="button" onClick={() => setViewMode('list')} className="px-5 py-2.5 text-sm font-bold text-gray-700 bg-white border border-[#E5E7EB] rounded-lg hover:bg-gray-50 transition-colors shadow-sm">{isViewOnly ? 'Close View' : 'Cancel'}</button>
             {!isViewOnly && (
               <button type="submit" className="px-5 py-2.5 text-sm font-bold text-white bg-[#2563EB] rounded-lg hover:bg-blue-700 transition-colors shadow-sm">{editId ? 'Save Changes' : 'Save Zone'}</button>
             )}
          </div>
        </form>
      </div>
    );
  }

  if (viewMode === 'createSite') {
    return (
      <div className="bg-[#F8FAFC] min-h-[calc(100vh-4rem)] p-4 md:p-8 md:-m-8 border-0 md:border-l border-[#E5E7EB]">
        
        <div className="flex items-center gap-3 mb-6">
           <button onClick={() => setViewMode('list')} className="p-2 bg-white border border-[#E5E7EB] rounded-lg text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-colors shadow-sm">
             <ArrowLeft size={18} strokeWidth={2.5} />
           </button>
           <div>
             <h1 className="text-xl font-bold text-gray-900 leading-tight">
               {isViewOnly ? 'View Site' : (editId ? 'Edit Site' : 'Add New Site')}
             </h1>
             <p className="text-sm font-medium text-gray-500">{isViewOnly ? 'Reviewing site records' : 'Enter site details below'}</p>
           </div>
        </div>

        <form onSubmit={handleCreateSite} className="bg-white rounded-xl shadow-sm border border-[#E5E7EB] p-6 max-w-[1600px]">
           <fieldset disabled={isViewOnly} className="grid grid-cols-1 md:grid-cols-4 gap-x-6 gap-y-5">
               <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Site Name <span className="text-red-500">*</span></label>
                  <input required value={siteForm.site_name} onChange={e=>setSiteForm({...siteForm, site_name: e.target.value})} className="w-full px-3 py-2 bg-white border border-[#E5E7EB] rounded-lg text-sm text-gray-900 outline-none focus:border-[#2563EB] placeholder:text-gray-400 disabled:bg-gray-50 disabled:text-gray-500" placeholder="Site name" />
               </div>
               <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Site Code</label>
                  <input className="w-full px-3 py-2 bg-white border border-[#E5E7EB] rounded-lg text-sm text-gray-900 outline-none focus:border-[#2563EB] placeholder:text-gray-400 disabled:bg-gray-50 disabled:text-gray-500" placeholder="Site code" />
               </div>
               <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Select Zone <span className="text-red-500">*</span></label>
                  <select required value={siteForm.zone_id} onChange={e=>setSiteForm({...siteForm, zone_id: e.target.value})} className="w-full px-3 py-2 bg-white border border-[#E5E7EB] rounded-lg text-sm text-gray-700 font-medium outline-none focus:border-[#2563EB] appearance-none disabled:bg-gray-50 disabled:text-gray-500">
                    <option value="">Select Zone</option>
                    {zones.map(z => <option key={z.id} value={z.id}>{z.zone_name}</option>)}
                  </select>
               </div>
               <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Property Type</label>
                  <select value={siteForm.site_type} onChange={e=>setSiteForm({...siteForm, site_type: e.target.value})} className="w-full px-3 py-2 bg-white border border-[#E5E7EB] rounded-lg text-sm text-gray-700 font-medium outline-none focus:border-[#2563EB] appearance-none disabled:bg-gray-50 disabled:text-gray-500">
                    <option value="hotel">Hotel</option>
                    <option value="service_apartment">Service Apartment</option>
                  </select>
               </div>
               <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Location</label>
                  <input value={siteForm.location} onChange={e=>setSiteForm({...siteForm, location: e.target.value})} className="w-full px-3 py-2 bg-white border border-[#E5E7EB] rounded-lg text-sm text-gray-900 outline-none focus:border-[#2563EB] placeholder:text-gray-400 disabled:bg-gray-50 disabled:text-gray-500" placeholder="City / Area" />
               </div>
               <div className="md:col-span-3">
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Full Address</label>
                  <input value={siteForm.full_address} onChange={e=>setSiteForm({...siteForm, full_address: e.target.value})} className="w-full px-3 py-2 bg-white border border-[#E5E7EB] rounded-lg text-sm text-gray-900 outline-none focus:border-[#2563EB] placeholder:text-gray-400 disabled:bg-gray-50 disabled:text-gray-500" placeholder="Complete address" />
               </div>
               <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Flat/Room Prefix</label>
                  <input value={siteForm.unit_code} onChange={e=>setSiteForm({...siteForm, unit_code: e.target.value})} className="w-full px-3 py-2 bg-white border border-[#E5E7EB] rounded-lg text-sm text-gray-900 outline-none focus:border-[#2563EB] placeholder:text-gray-400 disabled:bg-gray-50 disabled:text-gray-500" placeholder="e.g. A-" />
               </div>
               <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Total Rooms</label>
                  <input type="number" min="1" value={siteForm.total_rooms} onChange={e=>setSiteForm({...siteForm, total_rooms: e.target.value})} className="w-full px-3 py-2 bg-white border border-[#E5E7EB] rounded-lg text-sm text-gray-900 outline-none focus:border-[#2563EB] placeholder:text-gray-400 disabled:bg-gray-50 disabled:text-gray-500" placeholder="Total expected" />
               </div>
               <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Phone Number</label>
                  <input className="w-full px-3 py-2 bg-white border border-[#E5E7EB] rounded-lg text-sm text-gray-900 outline-none focus:border-[#2563EB] placeholder:text-gray-400 disabled:bg-gray-50 disabled:text-gray-500" placeholder="Contact number" />
               </div>
               <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Primary Email</label>
                  <input className="w-full px-3 py-2 bg-white border border-[#E5E7EB] rounded-lg text-sm text-gray-900 outline-none focus:border-[#2563EB] placeholder:text-gray-400 disabled:bg-gray-50 disabled:text-gray-500" placeholder="Email address" />
               </div>
           </fieldset>

          <div className="flex justify-end gap-3 mt-8 pt-5 border-t border-[#E5E7EB]">
             <button type="button" onClick={() => setViewMode('list')} className="px-5 py-2.5 text-sm font-bold text-gray-700 bg-white border border-[#E5E7EB] rounded-lg hover:bg-gray-50 transition-colors shadow-sm">{isViewOnly ? 'Close View' : 'Cancel'}</button>
             {!isViewOnly && (
               <button type="submit" className="px-5 py-2.5 text-sm font-bold text-white bg-[#2563EB] rounded-lg hover:bg-blue-700 transition-colors shadow-sm">{editId ? 'Save Changes' : 'Save Site'}</button>
             )}
          </div>
        </form>
      </div>
    );
  }

  // LIST VIEW
  return (
    <div className="space-y-6 max-w-[1600px] mx-auto p-4 md:p-0">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 pb-4 border-b border-[#E5E7EB]">
         <div>
           <h1 className="text-2xl font-bold text-gray-900 leading-tight">Zones & Sites</h1>
         </div>
         <div className="flex flex-wrap md:flex-nowrap items-center gap-3 w-full md:w-auto">
            <button onClick={() => exportToCSV(activeTab === 'zones' ? zones : sites, activeTab)} className="flex-1 md:flex-none justify-center bg-white border-[#E5E7EB] border text-gray-700 px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 hover:bg-gray-50 transition-colors shadow-sm">
               <Download size={16} /> Export CSV
            </button>
            <button onClick={resetZoneForm} className="flex-1 md:flex-none justify-center bg-white border-[#E5E7EB] border text-gray-700 px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 hover:bg-gray-50 transition-colors shadow-sm">
               <Map size={16} /> Add Zone
            </button>
            <button onClick={resetSiteForm} className="w-full md:w-auto justify-center bg-[#2563EB] text-white px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 hover:bg-blue-700 transition-colors shadow-sm">
               <Building2 size={16} /> Add Site
            </button>
         </div>
      </div>

      <div className="bg-white border border-[#E5E7EB] rounded-[12px] shadow-sm flex flex-col">
         {/* Custom Tabs */}
         <div className="flex border-b border-[#E5E7EB]">
            <button 
               onClick={() => setActiveTab('zones')}
               className={`flex-1 py-4 text-sm font-bold text-center border-b-2 transition-colors ${activeTab === 'zones' ? 'border-[#2563EB] text-[#2563EB]' : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}
            >
               Managed Zones
            </button>
            <button 
               onClick={() => setActiveTab('sites')}
               className={`flex-1 py-4 text-sm font-bold text-center border-b-2 transition-colors ${activeTab === 'sites' ? 'border-[#2563EB] text-[#2563EB]' : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}
            >
               Properties & Sites
            </button>
         </div>

         <div className="overflow-x-auto hidden md:block">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="text-gray-500 font-semibold border-b border-[#E5E7EB] bg-gray-50/50">
                {activeTab === 'zones' ? (
                   <tr>
                     <th className="px-6 py-4 font-medium text-[12px] tracking-wider">Ref ID</th>
                     <th className="px-6 py-4 font-medium text-[12px] tracking-wider">Zone Name</th>
                     <th className="px-6 py-4 font-medium text-[12px] tracking-wider">Code</th>
                     <th className="px-6 py-4 font-medium text-[12px] tracking-wider">Sites Count</th>
                     <th className="px-6 py-4 font-medium text-[12px] tracking-wider">Status</th>
                     <th className="px-6 py-4 font-medium text-[12px] tracking-wider text-right">Actions</th>
                   </tr>
                ) : (
                   <tr>
                     <th className="px-6 py-4 font-medium text-[12px] tracking-wider">Site Name</th>
                     <th className="px-6 py-4 font-medium text-[12px] tracking-wider">Location</th>
                     <th className="px-6 py-4 font-medium text-[12px] tracking-wider">Type</th>
                     <th className="px-6 py-4 font-medium text-[12px] tracking-wider">Zone</th>
                     <th className="px-6 py-4 font-medium text-[12px] tracking-wider">Rooms</th>
                     <th className="px-6 py-4 font-medium text-[12px] tracking-wider text-right">Actions</th>
                   </tr>
                )}
              </thead>
              <tbody className="divide-y divide-[#E5E7EB] text-gray-800 font-medium">
                {loading ? (
                   <tr><td colSpan={6} className="px-6 py-12 text-center text-gray-500">Loading {activeTab}...</td></tr>
                ) : activeTab === 'zones' ? (
                   zones.length === 0 ? <tr><td colSpan={6} className="px-6 py-12 text-center text-gray-500">No zones defined.</td></tr> :
                   zones.map(z => (
                     <tr key={z.id} className="hover:bg-gray-50 transition-colors">
                       <td className="px-6 py-4 text-gray-500 text-xs font-bold">#ZN-{String(z.id).padStart(3,'0')}</td>
                       <td className="px-6 py-4 font-bold text-gray-900">{z.zone_name}</td>
                       <td className="px-6 py-4 text-gray-600 uppercase font-bold text-xs">{z.zone_code || z.zone_name.slice(0,3)}</td>
                       <td className="px-6 py-4 text-gray-700">--</td>
                       <td className="px-6 py-4">
                          <span className="bg-green-50 text-green-600 px-3 py-1 rounded border border-green-100 text-[10px] font-bold uppercase tracking-wider">Active</span>
                       </td>
                       <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-3 text-[#2563EB]">
                             <button onClick={() => handleEditZone(z, true)} className="hover:text-blue-800"><Eye size={16}/></button>
                             <button onClick={() => handleEditZone(z, false)} className="hover:text-blue-800"><Edit2 size={16}/></button>
                          </div>
                       </td>
                     </tr>
                   ))
                ) : (
                   sites.length === 0 ? <tr><td colSpan={6} className="px-6 py-12 text-center text-gray-500">No sites mapped.</td></tr> :
                   sites.map(s => (
                     <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                       <td className="px-6 py-4 font-bold text-gray-900">{s.site_name}</td>
                       <td className="px-6 py-4 text-gray-600">{s.location || 'N/A'}</td>
                       <td className="px-6 py-4 text-gray-600 capitalize">{s.site_type}</td>
                       <td className="px-6 py-4 text-gray-700">{s.zone?.zone_name}</td>
                       <td className="px-6 py-4 text-gray-700 font-bold">{s.total_rooms}</td>
                       <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-3 text-[#2563EB]">
                             {/* QUICK ACTION: ADD ROOM */}
                             <button onClick={() => navigate('/rooms', { state: { autoOpenCreate: true, prefilledSiteId: s.id, prefilledZoneId: s.zone_id } })} title="Add Room/Unit to Site" className="text-emerald-600 hover:text-emerald-800 bg-emerald-50 p-1.5 rounded-full hover:bg-emerald-100 transition-colors"><DoorOpen size={16}/></button>
                             <button onClick={() => handleEditSite(s, true)} title="View Site" className="hover:text-blue-800"><Eye size={16}/></button>
                             <button onClick={() => handleEditSite(s, false)} title="Edit Site" className="hover:text-blue-800"><Edit2 size={16}/></button>
                          </div>
                       </td>
                     </tr>
                   ))
                )}
              </tbody>
            </table>
         </div>

         {/* Mobile Card View */}
         <div className="block md:hidden divide-y divide-[#E5E7EB] bg-white">
             {loading ? (
                 <div className="p-8 text-center text-gray-500 font-medium">Loading {activeTab}...</div>
             ) : activeTab === 'zones' ? (
                 zones.length === 0 ? <div className="p-8 text-center text-gray-500">No zones defined.</div> :
                 zones.map(z => (
                     <div key={z.id} className="p-4 flex flex-col gap-3">
                         <div className="flex justify-between items-start">
                             <div>
                                 <h3 className="font-bold text-gray-900">{z.zone_name}</h3>
                                 <p className="text-xs text-gray-500 font-bold mt-0.5">#ZN-{String(z.id).padStart(3,'0')} • {z.zone_code || z.zone_name.slice(0,3)}</p>
                             </div>
                             <span className="bg-green-50 text-green-600 px-2 py-1 rounded border border-green-100 text-[9px] font-bold uppercase tracking-wider">Active</span>
                         </div>
                         <div className="flex justify-end items-center gap-3 mt-2 pt-3 border-t border-[#E5E7EB] text-[#2563EB]">
                             <button onClick={() => handleEditZone(z, true)} className="flex items-center gap-1 text-xs font-bold hover:text-blue-800"><Eye size={14}/> View</button>
                             <button onClick={() => handleEditZone(z, false)} className="flex items-center gap-1 text-xs font-bold hover:text-blue-800"><Edit2 size={14}/> Edit</button>
                         </div>
                     </div>
                 ))
             ) : (
                 sites.length === 0 ? <div className="p-8 text-center text-gray-500">No sites mapped.</div> :
                 sites.map(s => (
                     <div key={s.id} className="p-4 flex flex-col gap-3">
                         <div className="flex justify-between items-start">
                             <div>
                                 <h3 className="font-bold text-gray-900">{s.site_name}</h3>
                                 <p className="text-xs text-gray-500 mt-0.5">{s.location || 'N/A'}</p>
                             </div>
                             <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded border border-gray-200 text-[9px] font-bold uppercase tracking-wider capitalize">{s.site_type}</span>
                         </div>
                         <div className="flex justify-between items-center text-xs">
                             <span className="text-gray-600"><span className="font-bold text-gray-900">Zone:</span> {s.zone?.zone_name}</span>
                             <span className="text-gray-600"><span className="font-bold text-gray-900">Rooms:</span> {s.total_rooms}</span>
                         </div>
                         <div className="flex justify-between items-center mt-2 pt-3 border-t border-[#E5E7EB]">
                             <button onClick={() => navigate('/rooms', { state: { autoOpenCreate: true, prefilledSiteId: s.id, prefilledZoneId: s.zone_id } })} className="flex items-center gap-1 text-xs font-bold text-emerald-600 hover:text-emerald-800 bg-emerald-50 px-2 py-1.5 rounded-lg hover:bg-emerald-100 transition-colors"><DoorOpen size={14}/> Add Room</button>
                             <div className="flex items-center gap-3 text-[#2563EB]">
                                 <button onClick={() => handleEditSite(s, true)} className="flex items-center gap-1 text-xs font-bold hover:text-blue-800"><Eye size={14}/> View</button>
                                 <button onClick={() => handleEditSite(s, false)} className="flex items-center gap-1 text-xs font-bold hover:text-blue-800"><Edit2 size={14}/> Edit</button>
                             </div>
                         </div>
                     </div>
                 ))
             )}
         </div>
      </div>
    </div>
  );
}
