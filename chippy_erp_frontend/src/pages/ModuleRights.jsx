import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ShieldCheck, ArrowLeft, Loader2, Save, CheckCircle2, XCircle } from 'lucide-react';
import API_BASE_URL from '../config';

export default function ModuleRights() {
  const { roleId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [modules, setModules] = useState([]);
  const [permissions, setPermissions] = useState({}); // { moduleId: { can_view, can_add, ... } }
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [roleName, setRoleName] = useState('Role');

  useEffect(() => {
    fetchData();
  }, [roleId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      // Fetch modules
      const modRes = await fetch(`${API_BASE_URL}/api/modules`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const mods = await modRes.json();
      setModules(mods);

      // Fetch role info (to get name)
      const roleRes = await fetch(`${API_BASE_URL}/api/roles`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const roles = await roleRes.json();
      const currentRole = roles.find(r => r.id === parseInt(roleId));
      if (currentRole) setRoleName(currentRole.name);

      // Fetch permissions for this role
      const permRes = await fetch(`${API_BASE_URL}/api/permissions/${roleId}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const perms = await permRes.json();
      
      const permMap = {};
      // Initialize ALL modules as false first
      mods.forEach(m => {
        permMap[m.id] = { can_view: false, can_add: false, can_edit: false, can_delete: false };
      });
      // Override with existing permissions
      perms.forEach(p => {
        permMap[p.module_id] = {
          can_view: p.can_view,
          can_add: p.can_add,
          can_edit: p.can_edit,
          can_delete: p.can_delete
        };
      });
      setPermissions(permMap);
    } catch (error) {
      console.error('Error fetching data', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = (moduleId) => {
    const newVal = !(permissions[moduleId]?.can_view);
    setPermissions(prev => ({
      ...prev,
      [moduleId]: {
        can_view: newVal,
        can_add: newVal,
        can_edit: newVal,
        can_delete: newVal
      }
    }));
  };

  const savePermissions = async () => {
    try {
      setSaving(true);
      const response = await fetch(`${API_BASE_URL}/api/permissions/${roleId}/bulk`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ permissions })
      });
      
      if (!response.ok) throw new Error('Failed to save permissions');
      
      alert('Permissions saved successfully!');
      if (location.key !== 'default') {
        navigate(-1);
      } else {
        navigate('/rbac');
      }
    } catch (error) {
      console.error('Error saving permissions', error);
      alert('Failed to save permissions: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <Loader2 size={40} className="animate-spin text-blue-600" />
        <p className="text-gray-500 font-medium">Loading module permissions...</p>
      </div>
    );
  }

  return (
    <div className="max-w-[1200px] mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => {
              if (location.key !== 'default') {
                navigate(-1);
              } else {
                navigate('/rbac');
              }
            }} 
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ArrowLeft size={24} className="text-gray-600" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Module Rights</h1>
            <p className="text-gray-500 font-medium">Configuring access for <span className="text-blue-600 font-bold">{roleName}</span></p>
          </div>
        </div>
        <button 
          onClick={savePermissions}
          disabled={saving}
          className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 disabled:opacity-50"
        >
          {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
          <span>Save Changes</span>
        </button>
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-gray-50/50 text-[11px] font-bold text-gray-400 uppercase tracking-widest">
              <th className="px-8 py-4 w-20">S.No</th>
              <th className="px-8 py-4">Module Name</th>
              <th className="px-8 py-4">Module Code</th>
              <th className="px-8 py-4 text-center">Display</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {modules.map((mod, idx) => (
              <tr key={mod.id} className="hover:bg-gray-50/50 transition-colors">
                <td className="px-8 py-5 text-sm font-medium text-gray-400">{String(idx + 1).padStart(2, '0')}</td>
                <td className="px-8 py-5">
                   <div className="flex items-center gap-3">
                      <div className="p-2 bg-slate-900 rounded-lg text-white">
                        <ShieldCheck size={16} />
                      </div>
                      <span className="font-bold text-gray-900">{mod.module_name}</span>
                   </div>
                </td>
                <td className="px-8 py-5">
                   <span className="text-xs font-mono font-bold text-gray-500 uppercase tracking-tighter">{mod.module_key}</span>
                </td>
                <td className="px-8 py-5 text-center">
                  <button 
                    onClick={() => handleToggle(mod.id, 'can_view')}
                    className={`transition-all duration-200 ${permissions[mod.id]?.can_view ? 'text-blue-600 scale-110' : 'text-gray-200 hover:text-gray-300'}`}
                  >
                    {permissions[mod.id]?.can_view ? <CheckCircle2 size={24} /> : <XCircle size={24} />}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
