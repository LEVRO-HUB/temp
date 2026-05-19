import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, ArrowLeft, Eye, Download, ShieldCheck, UserCog, User, BadgeCent, UserCheck, Settings, TrendingUp, Wallet, Home, ChefHat, Wrench, Shirt, Hotel, Check } from 'lucide-react';
import { useLocation, useSearchParams } from 'react-router-dom';
import { exportToCSV } from '../utils/exportCSV';
import API_BASE_URL from '../config';

export default function EmployeeManagement() {
  const location = useLocation();
  const [employees, setEmployees] = useState([]);
  const [roles, setRoles] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);

  const iconMap = {
    ShieldCheck, UserCog, User, BadgeCent, UserCheck,
    Settings, TrendingUp, Wallet, Home, ChefHat, Wrench, Shirt, Hotel
  };

  const [viewMode, setViewMode] = useState('list');
  const [editId, setEditId] = useState(null);
  const [isViewOnly, setIsViewOnly] = useState(false);

  const [formData, setFormData] = useState({ name: '', email: '', mobile_number: '', role_id: '', dept_id: '', password: '', login_enabled: true });
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    const mode = searchParams.get('mode') || 'list';
    const id = searchParams.get('id') ? parseInt(searchParams.get('id')) : null;
    const viewOnly = searchParams.get('view') === 'true';

    setViewMode(mode);
    setEditId(id);
    setIsViewOnly(viewOnly);
  }, [searchParams]);

  useEffect(() => {
    const id = searchParams.get('id') ? parseInt(searchParams.get('id')) : null;
    if (id && employees.length > 0) {
      const emp = employees.find(e => e.id == id);
      if (emp) {
        setFormData({
          name: emp.name, email: emp.email || '', mobile_number: emp.mobile_number || '',
          role_id: emp.role_id || '', dept_id: emp.dept_id || '', password: '', login_enabled: emp.login_enabled
        });
      }
    } else if (!id) {
      setFormData({ name: '', email: '', mobile_number: '', role_id: '', dept_id: '', password: '', login_enabled: true });
    }
  }, [searchParams, employees]);

  useEffect(() => {
    fetchEmployees();
    fetchMasters();
  }, []);



  const fetchMasters = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { 'Authorization': 'Bearer ' + token };
      const [resRoles, resDepts] = await Promise.all([
        fetch(`${API_BASE_URL}/api/roles`, { headers }),
        fetch(`${API_BASE_URL}/api/departments`, { headers })
      ]);
      if (resRoles.ok) setRoles(await resRoles.json());
      if (resDepts.ok) setDepartments(await resDepts.json());
    } catch (err) {
      console.error("Failed to fetch masters", err);
    }
  };

  const fetchEmployees = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/api/employees`, {
        headers: { 'Authorization': 'Bearer ' + token }
      });
      if (res.ok) setEmployees(await res.json());
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isViewOnly) {
      setSearchParams({});
      return;
    }

    const token = localStorage.getItem('token');
    const url = editId ? `${API_BASE_URL}/api/employees/${editId}` : `${API_BASE_URL}/api/employees`;
    const method = editId ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
      body: JSON.stringify(formData)
    });

    if (res.ok) {
      setFormData({ name: '', email: '', mobile_number: '', role_id: '', dept_id: '', password: '', login_enabled: true });
      setSearchParams({});
      fetchEmployees();
    } else {
      const err = await res.json();
      alert(err.message || "Failed to save employee");
    }
  };

  const handleEdit = (emp, viewOnly = false) => {
    setSearchParams({ mode: 'create', id: emp.id.toString(), view: viewOnly ? 'true' : 'false' });
  };

  const resetForm = () => {
    setSearchParams({ mode: 'create' });
  };

  const toggleLoginStatus = async (id, currentStatus) => {
    const token = localStorage.getItem('token');
    await fetch(`${API_BASE_URL}/api/employees/${id}/login-access`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
      body: JSON.stringify({ login_enabled: !currentStatus })
    });
    fetchEmployees();
  }

  if (viewMode === 'create') {
    return (
      <div className="bg-[#F8FAFC] min-h-[calc(100vh-4rem)] p-4 md:p-8 md:-m-8 border-0 md:border-l border-[#E5E7EB]">

        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => setSearchParams({})} className="p-2 bg-white border border-[#E5E7EB] rounded-lg text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-colors shadow-sm">
            <ArrowLeft size={18} strokeWidth={2.5} />
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-900 leading-tight">
              {isViewOnly ? 'View Employee' : (editId ? 'Edit Employee' : 'Add New Employee')}
            </h1>
            <p className="text-sm font-medium text-gray-500">{isViewOnly ? 'Viewing employee profile' : 'Add or modify employee assignments'}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-[#E5E7EB] p-6 max-w-[1600px]">
          <fieldset disabled={isViewOnly} className="grid grid-cols-1 md:grid-cols-4 gap-x-6 gap-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Full Name <span className="text-red-500">*</span></label>
              <input required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full px-3 py-2 bg-white border border-[#E5E7EB] rounded-lg text-sm font-medium text-gray-900 outline-none focus:border-[#2563EB] placeholder:text-gray-400 placeholder:font-normal transition-colors disabled:bg-gray-50 disabled:text-gray-500" placeholder="Full name" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Mobile Number <span className="text-red-500">*</span></label>
              <input required type="tel" value={formData.mobile_number} onChange={e => setFormData({ ...formData, mobile_number: e.target.value })} className="w-full px-3 py-2 bg-white border border-[#E5E7EB] rounded-lg text-sm font-medium text-gray-900 outline-none focus:border-[#2563EB] placeholder:text-gray-400 placeholder:font-normal transition-colors disabled:bg-gray-50 disabled:text-gray-500" placeholder="Mobile number" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email Address</label>
              <input type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} className="w-full px-3 py-2 bg-white border border-[#E5E7EB] rounded-lg text-sm font-medium text-gray-900 outline-none focus:border-[#2563EB] placeholder:text-gray-400 placeholder:font-normal transition-colors disabled:bg-gray-50 disabled:text-gray-500" placeholder="Email address" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Date of Birth</label>
              <input type="date" className="w-full px-3 py-2 bg-white border border-[#E5E7EB] rounded-lg text-sm font-medium text-gray-900 outline-none focus:border-[#2563EB] transition-colors disabled:bg-gray-50 disabled:text-gray-500" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Gender</label>
              <select className="w-full px-3 py-2 bg-white border border-[#E5E7EB] rounded-lg text-sm font-medium text-gray-700 outline-none focus:border-[#2563EB] transition-colors appearance-none disabled:bg-gray-50 disabled:text-gray-500">
                <option>Select Gender</option>
                <option>Male</option>
                <option>Female</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Address</label>
              <input className="w-full px-3 py-2 bg-white border border-[#E5E7EB] rounded-lg text-sm font-medium text-gray-900 outline-none focus:border-[#2563EB] placeholder:text-gray-400 placeholder:font-normal transition-colors disabled:bg-gray-50 disabled:text-gray-500" placeholder="Address" />
            </div>
            <div className="md:col-span-4 mt-2">
              <label className="block text-sm font-bold text-gray-700 mb-3 border-b pb-2">Select Role <span className="text-red-500">*</span></label>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                {roles.map(role => {
                  const IconComp = iconMap[role.icon] || User;
                  const isSelected = formData.role_id == role.id;
                  return (
                    <div
                      key={role.id}
                      onClick={() => !isViewOnly && setFormData({ ...formData, role_id: role.id })}
                      className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all cursor-pointer shadow-sm group ${isSelected
                        ? 'border-[#2563EB] bg-blue-50 ring-4 ring-blue-50'
                        : 'border-[#E5E7EB] bg-white hover:border-blue-200 hover:bg-gray-50'
                        }`}
                    >
                      <div className={`p-3 rounded-full mb-2 transition-colors ${isSelected ? 'bg-[#2563EB] text-white' : 'bg-gray-100 text-gray-500 group-hover:bg-blue-100 group-hover:text-blue-600'}`}>
                        <IconComp size={24} />
                      </div>
                      <span className={`text-xs font-bold uppercase tracking-tight text-center ${isSelected ? 'text-[#2563EB]' : 'text-gray-600'}`}>
                        {role.name}
                      </span>
                      {isSelected && (
                        <div className="absolute top-2 right-2 text-[#2563EB]">
                          <Check size={16} strokeWidth={3} />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="md:col-span-4 mt-4">
              <label className="block text-sm font-bold text-gray-700 mb-3 border-b pb-2">Select Department <span className="text-red-500">*</span></label>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-8 gap-3">
                {departments.map(dept => {
                  const IconComp = iconMap[dept.icon] || Settings;
                  const isSelected = formData.dept_id == dept.id;
                  return (
                    <div
                      key={dept.id}
                      onClick={() => !isViewOnly && setFormData({ ...formData, dept_id: dept.id })}
                      className={`relative flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all cursor-pointer shadow-sm group ${isSelected
                        ? 'border-[#059669] bg-emerald-50 ring-4 ring-emerald-50'
                        : 'border-[#E5E7EB] bg-white hover:border-emerald-200 hover:bg-gray-50'
                        }`}
                    >
                      <div className={`p-2 rounded-full mb-2 transition-colors ${isSelected ? 'bg-[#059669] text-white' : 'bg-gray-100 text-gray-500 group-hover:bg-emerald-100 group-hover:text-emerald-600'}`}>
                        <IconComp size={20} />
                      </div>
                      <span className={`text-[10px] font-bold uppercase tracking-tighter text-center ${isSelected ? 'text-[#059669]' : 'text-gray-500'}`}>
                        {dept.name}
                      </span>
                      {isSelected && (
                        <div className="absolute top-1 right-1 text-[#059669]">
                          <Check size={12} strokeWidth={3} />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Joining Date</label>
              <input type="date" className="w-full px-3 py-2 bg-white border border-[#E5E7EB] rounded-lg text-sm font-medium text-gray-900 outline-none focus:border-[#2563EB] transition-colors disabled:bg-gray-50 disabled:text-gray-500" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Status</label>
              <select className="w-full px-3 py-2 bg-white border border-[#E5E7EB] rounded-lg text-sm font-medium text-gray-900 outline-none focus:border-[#2563EB] appearance-none disabled:bg-gray-50 disabled:text-gray-500">
                <option>Active</option>
                <option>Inactive</option>
              </select>
            </div>
            <div className="flex flex-col justify-center">
              <label className="block text-sm font-semibold text-gray-700 mb-2 mt-1">Login Access</label>
              <div className={`flex items-center gap-3 ${isViewOnly ? 'opacity-50' : 'cursor-pointer'}`}>
                <button type="button" onClick={() => { if (!isViewOnly) setFormData({ ...formData, login_enabled: !formData.login_enabled }) }} className={`w-10 h-5 rounded-full p-0.5 transition-colors duration-300 ease-in-out cursor-pointer ${formData.login_enabled ? 'bg-[#16A34A]' : 'bg-gray-300'}`}>
                  <div className={`bg-white w-4 h-4 rounded-full shadow-sm transform transition-transform duration-300 ease-in-out ${formData.login_enabled ? 'translate-x-5' : 'translate-x-0'}`}></div>
                </button>
                <span className="text-xs font-bold text-gray-600 tracking-wide uppercase">Enabled</span>
              </div>
            </div>
            {formData.login_enabled && !editId && !isViewOnly && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Initial Password <span className="text-red-500">*</span></label>
                <input required type="password" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} className="w-full px-3 py-2 bg-white border border-[#E5E7EB] rounded-lg text-sm font-medium text-gray-900 outline-none focus:border-[#2563EB] placeholder:text-gray-400 placeholder:font-normal transition-colors disabled:bg-gray-50 disabled:text-gray-500" placeholder="••••••••" />
              </div>
            )}
          </fieldset>

          <div className="flex justify-end gap-3 mt-8 pt-5 border-t border-[#E5E7EB]">
            <button type="button" onClick={() => setSearchParams({})} className="px-5 py-2.5 text-sm font-bold text-gray-700 bg-white border border-[#E5E7EB] rounded-lg hover:bg-gray-50 transition-colors shadow-sm">{isViewOnly ? 'Close View' : 'Cancel'}</button>
            {!isViewOnly && (
              <button type="submit" className="px-5 py-2.5 text-sm font-bold text-white bg-[#2563EB] rounded-lg hover:bg-blue-700 transition-colors shadow-sm">{editId ? 'Save Changes' : 'Save Employee'}</button>
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
          <h1 className="text-2xl font-bold text-gray-900 leading-tight">Employees</h1>
        </div>
        <div className="flex flex-wrap md:flex-nowrap items-center gap-3 w-full md:w-auto">
          <button onClick={() => exportToCSV(employees, 'employees')} className="flex-1 md:flex-none justify-center bg-white border-[#E5E7EB] border text-gray-700 px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 hover:bg-gray-50 transition-colors shadow-sm">
            <Download size={16} /> Export CSV
          </button>
          <button onClick={resetForm} className="flex-1 md:flex-none justify-center bg-[#2563EB] text-white px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-2 hover:bg-blue-700 transition-colors shadow-sm">
            <Plus size={16} /> Add Employee
          </button>
        </div>
      </div>

      <div className="bg-white border border-[#E5E7EB] rounded-[12px] shadow-sm flex flex-col">
        <div className="overflow-x-auto hidden md:block">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="text-gray-500 font-semibold border-b border-[#E5E7EB]">
              <tr>
                <th className="px-6 py-4 font-medium text-[12px] tracking-wider">Employee Name</th>
                <th className="px-6 py-4 font-medium text-[12px] tracking-wider">Mobile</th>
                <th className="px-6 py-4 font-medium text-[12px] tracking-wider">Email</th>
                <th className="px-6 py-4 font-medium text-[12px] tracking-wider">Role</th>
                <th className="px-6 py-4 font-medium text-[12px] tracking-wider">Department</th>
                <th className="px-6 py-4 font-medium text-[12px] tracking-wider hover:cursor-pointer">Status</th>
                <th className="px-6 py-4 font-medium text-[12px] tracking-wider text-center">Login Enabled</th>
                <th className="px-6 py-4 font-medium text-[12px] tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E7EB] text-gray-800 font-medium">
              {loading ? (
                <tr><td colSpan={7} className="px-6 py-12 text-center text-gray-500">Loading records...</td></tr>
              ) : employees.length === 0 ? (
                <tr><td colSpan={7} className="px-6 py-12 text-center text-gray-500">No employees registered.</td></tr>
              ) : employees.map(emp => (
                <tr key={emp.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 text-gray-900 font-bold">{emp.name}</td>
                  <td className="px-6 py-4">{emp.mobile_number}</td>
                  <td className="px-6 py-4 text-gray-500">{emp.email}</td>
                  <td className="px-6 py-4 font-medium capitalize text-gray-700">
                    <div className="flex items-center gap-2">
                      {emp.role?.icon && React.createElement(iconMap[emp.role.icon] || User, { size: 14, className: "text-blue-500" })}
                      {emp.role?.name || '--'}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {emp.department?.icon && React.createElement(iconMap[emp.department.icon] || Settings, { size: 14, className: "text-emerald-500" })}
                      <span className="text-gray-700">{emp.department?.name || '--'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="bg-green-50 text-green-600 px-3 py-1 rounded border border-green-100 text-[10px] font-bold uppercase tracking-wider">Active</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex justify-center">
                      <button
                        onClick={() => toggleLoginStatus(emp.id, emp.login_enabled)}
                        className={`w-10 h-5 rounded-full p-0.5 transition-colors duration-300 ease-in-out cursor-pointer ${emp.login_enabled ? 'bg-[#16A34A]' : 'bg-gray-300'}`}
                      >
                        <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ease-in-out ${emp.login_enabled ? 'translate-x-5' : 'translate-x-0'}`}></div>
                      </button>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-3 text-[#2563EB]">
                      <button onClick={() => handleEdit(emp, true)} className="hover:text-blue-800"><Eye size={16} /></button>
                      <button onClick={() => handleEdit(emp, false)} className="hover:text-blue-800"><Edit2 size={16} /></button>
                      <button className="text-red-500 hover:text-red-700"><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Card View */}
        <div className="block md:hidden divide-y divide-[#E5E7EB] bg-white">
          {loading ? (
            <div className="p-8 text-center text-gray-500 font-medium">Loading records...</div>
          ) : employees.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No employees registered.</div>
          ) : employees.map(emp => (
            <div key={emp.id} className="p-4 flex flex-col gap-3">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-gray-900">{emp.name}</h3>
                  <p className="text-sm font-medium text-gray-600 mt-0.5">{emp.mobile_number}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{emp.email}</p>
                </div>
                <span className="bg-green-50 text-green-600 px-2 py-1 rounded border border-green-100 text-[9px] font-bold uppercase tracking-wider">Active</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-600 flex items-center gap-1.5 font-semibold capitalize">
                  {emp.role?.icon && React.createElement(iconMap[emp.role.icon] || User, { size: 14, className: "text-blue-500" })}
                  {emp.role?.name || '--'}
                </span>
                <span className="text-gray-600 flex items-center gap-1.5 font-medium">
                  {emp.department?.icon && React.createElement(iconMap[emp.department.icon] || Settings, { size: 14, className: "text-emerald-500" })}
                  {emp.department?.name || '--'}
                </span>
              </div>
              <div className="flex justify-between items-center mt-2 pt-3 border-t border-[#E5E7EB]">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-gray-500">Login:</span>
                  <button
                    onClick={() => toggleLoginStatus(emp.id, emp.login_enabled)}
                    className={`w-8 h-4 rounded-full p-0.5 transition-colors duration-300 ease-in-out cursor-pointer ${emp.login_enabled ? 'bg-[#16A34A]' : 'bg-gray-300'}`}
                  >
                    <div className={`bg-white w-3 h-3 rounded-full shadow-md transform transition-transform duration-300 ease-in-out ${emp.login_enabled ? 'translate-x-4' : 'translate-x-0'}`}></div>
                  </button>
                </div>
                <div className="flex items-center gap-4 text-[#2563EB]">
                  <button onClick={() => handleEdit(emp, true)} className="flex items-center gap-1 text-xs font-bold hover:text-blue-800"><Eye size={14} /> View</button>
                  <button onClick={() => handleEdit(emp, false)} className="flex items-center gap-1 text-xs font-bold hover:text-blue-800"><Edit2 size={14} /> Edit</button>
                  <button className="flex items-center gap-1 text-xs font-bold text-red-500 hover:text-red-700"><Trash2 size={14} /> Del</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
