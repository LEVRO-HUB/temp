import React, { useState, useEffect } from 'react';
import { ShieldCheck, Plus, Search, Filter, Download, Edit2, Trash2, ChevronLeft, ChevronRight, MoreVertical, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import API_BASE_URL from '../config';

export default function ScreenRights() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  // ... rest of state ...
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [rolePermissions, setRolePermissions] = useState({});

  useEffect(() => {
    fetchRoles();
  }, []);

  const fetchRoles = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/roles`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Failed to fetch roles');
      const data = await response.json();
      setRoles(data);

      // Fetch permissions for each role to compute dynamic access levels
      const permMap = {};
      await Promise.all(data.map(async (role) => {
        try {
          const permRes = await fetch(`${API_BASE_URL}/api/permissions/${role.id}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (permRes.ok) {
            permMap[role.id] = await permRes.json();
          }
        } catch (e) {
          permMap[role.id] = [];
        }
      }));
      setRolePermissions(permMap);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getLevelInfo = (role) => {
    const perms = rolePermissions[role.id] || [];
    const activeCount = perms.filter(p => p.can_view).length;
    const totalModules = perms.length;

    if (activeCount === 0) {
      return { level: '0 Modules', color: 'bg-gray-50 text-gray-500 border-gray-200' };
    }
    if (totalModules > 0 && activeCount === totalModules) {
      return { level: `${activeCount} Modules · Full`, color: 'bg-red-50 text-red-600 border-red-100' };
    }
    if (activeCount >= Math.ceil(totalModules * 0.5)) {
      return { level: `${activeCount} Modules`, color: 'bg-blue-50 text-blue-600 border-blue-100' };
    }
    return { level: `${activeCount} Modules`, color: 'bg-amber-50 text-amber-600 border-amber-100' };
  };

  return (
    <div className="max-w-[1600px] mx-auto space-y-8 animate-in fade-in duration-500">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Role Definitions</h1>
          <p className="text-gray-500 mt-1 max-w-2xl">
            Manage system access levels and permissions for the Screen Rights ecosystem. Define roles that balance operational agility with rigorous security compliance.
          </p>
        </div>
        <button className="flex items-center gap-2 bg-[#0F172A] text-white px-5 py-2.5 rounded-lg font-semibold hover:bg-slate-800 transition-all shadow-lg shadow-slate-200">
          <Plus size={18} />
          <span>Define New Role</span>
        </button>
      </div>

      {/* METRICS */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
        <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm">
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Total Active Roles</p>
          <div className="flex items-end gap-4 mt-2">
            <h2 className="text-5xl font-black text-gray-900 leading-none">{roles.length}</h2>
            <div className="mb-1 flex items-center gap-1 text-green-600 font-bold text-xs bg-green-50 px-2 py-1 rounded-full">
               <Plus size={10} strokeWidth={3} />
               <span>New</span>
            </div>
          </div>
        </div>
      </div>

      {/* REGISTRY TABLE SECTION */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h3 className="text-lg font-bold text-gray-900">System Roles Registry</h3>
          <div className="flex items-center gap-3">
             <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input 
                    type="text" 
                    placeholder="Search roles..." 
                    className="pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all w-64"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
             </div>
             <button onClick={fetchRoles} className="p-2 text-gray-500 hover:bg-gray-50 rounded-lg border border-gray-100 transition-colors">
                <Loader2 size={18} className={loading ? 'animate-spin' : ''} />
             </button>
             <button className="p-2 text-gray-500 hover:bg-gray-50 rounded-lg border border-gray-100 transition-colors"><Filter size={18} /></button>
             <button className="p-2 text-gray-500 hover:bg-gray-50 rounded-lg border border-gray-100 transition-colors"><Download size={18} /></button>
          </div>
        </div>

        <div className="overflow-x-auto min-h-[400px]">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400 gap-3">
                <Loader2 size={40} className="animate-spin text-blue-600" />
                <p className="font-medium">Loading system roles...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-20 text-red-500 gap-3">
                <ShieldCheck size={40} className="opacity-20" />
                <p className="font-medium">Error: {error}</p>
                <button onClick={fetchRoles} className="text-sm font-bold underline">Try again</button>
            </div>
          ) : (
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50/50 text-[11px] font-bold text-gray-400 uppercase tracking-widest">
                  <th className="px-8 py-4 w-20">#</th>
                  <th className="px-8 py-4">Roles Name</th>
                  <th className="px-8 py-4">Roles ID</th>
                  <th className="px-8 py-4">Permissions Level</th>
                  <th className="px-8 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {roles.filter(r => r.name.toLowerCase().includes(searchTerm.toLowerCase())).map((role, idx) => {
                  const levelInfo = getLevelInfo(role);
                  return (
                    <tr key={role.id} className="hover:bg-blue-50/30 transition-colors group">
                      <td className="px-8 py-5 text-sm font-medium text-gray-400">{String(idx + 1).padStart(2, '0')}</td>
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center text-white shadow-sm">
                                <ShieldCheck size={18} />
                            </div>
                            <span className="font-bold text-gray-900">{role.name}</span>
                        </div>
                      </td>
                      <td className="px-8 py-5 text-sm font-mono text-gray-500 tracking-tighter">ROLE_{String(role.id).padStart(3, '0')}</td>
                      <td className="px-8 py-5">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${levelInfo.color}`}>
                          {levelInfo.level}
                        </span>
                      </td>
                      <td className="px-8 py-5 text-right">
                        <div className="flex items-center justify-end gap-2 transition-opacity">
                          <button className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"><Edit2 size={16} /></button>
                          <button className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={16} /></button>
                          <button 
                            onClick={() => navigate(`/rbac/permissions/${role.id}`)}
                            className="p-2 text-gray-400 hover:bg-gray-50 rounded-lg transition-colors"
                          >
                            <MoreVertical size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>

        <div className="p-6 border-t border-gray-50 flex items-center justify-between">
           <p className="text-sm text-gray-500 font-medium">Showing {roles.length} roles</p>
           <div className="flex items-center gap-2">
              <button className="flex items-center gap-1 px-4 py-2 text-sm font-bold text-gray-400 hover:text-gray-900 transition-colors"><ChevronLeft size={16} /> Previous</button>
              <div className="flex items-center gap-1">
                 <button className="w-8 h-8 rounded-lg bg-blue-600 text-white text-sm font-bold shadow-lg shadow-blue-600/20">1</button>
              </div>
              <button className="flex items-center gap-1 px-4 py-2 text-sm font-bold text-gray-400 hover:text-gray-900 transition-colors">Next <ChevronRight size={16} /></button>
           </div>
        </div>
      </div>
    </div>
  );
}
