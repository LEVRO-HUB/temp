import React, { useState, useEffect, useRef } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, CreditCard, Box, Map, Search, Bell, LogOut, ChevronDown, UserCircle, ShoppingCart, UserCheck, BarChart3, ShieldCheck, X, Menu, Home, CalendarDays, MoreHorizontal } from 'lucide-react';
import { jwtDecode } from 'jwt-decode';
import API_BASE_URL from '../config';
import logo from '../assets/image-removebg-preview.png';
import { usePermissions } from '../hooks/usePermissions.js';

export default function DashboardLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = useState({ name: 'Loading...', role: 'Admin' });
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Use the shared PermissionContext instead of fetching separately
  const { permissions, loading: loadingPerms } = usePermissions();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const decoded = jwtDecode(token);
      setUser({
        id:     decoded.id,
        name:   decoded.name   || 'Admin User',
        role:   decoded.role   || 'Admin',
        roleId: decoded.roleId,
      });
    } catch {}
  }, []);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const { can } = usePermissions();
  const hasAccess = (moduleKey) => {
    if (user.role?.toLowerCase() === 'developer') return true;
    return can(moduleKey, 'view');
  };
  };

  useEffect(() => {
    if (!loadingPerms && location.pathname === '/dashboard' && !hasAccess('dashboard')) {
      // Find the first module they DO have access to
      const firstAvailable = menuSections.find(s => s.items.some(i => hasAccess(i.key)))?.items.find(i => hasAccess(i.key));
      if (firstAvailable) {
        navigate(firstAvailable.path, { replace: true });
      }
    }
  }, [location.pathname, loadingPerms, permissions, user]);

  const menuSections = [
    {
      title: 'SALES',
      items: [
        { name: 'Sales Enquiries', path: '/enquiries', icon: Users, key: 'enquiries' },
        { name: 'Bookings & Sales', path: '/bookings', icon: Box, key: 'bookings' },
        { name: 'Booking Calendar', path: '/booking-calendar', icon: CalendarDays, key: 'booking_calendar' },
        { name: 'Booking Reports', path: '/booking-reports', icon: BarChart3, key: 'booking_reports' },
      ]
    },
    {
      title: 'FINANCE',
      items: [
        { name: 'Payments', path: '/payments', icon: CreditCard, key: 'payments' },
      ]
    },
    {
      title: 'PURCHASE',
      items: [
        { name: 'PO Dashboard', path: '/purchase-orders/dashboard', icon: BarChart3, key: 'pos' },
        { name: 'Purchase Orders', path: '/purchase-orders/list', icon: CreditCard, key: 'pos' },
        { name: 'Approvals', path: '/purchase-orders/approvals', icon: UserCheck, key: 'pos' },
        { name: 'Vendor Network', path: '/purchase-orders/vendors', icon: Map, key: 'pos' },
        { name: 'Financial Audit', path: '/purchase-orders/audit', icon: ShieldCheck, key: 'pos' },
      ]
    },
    {
      title: 'OPERATIONS',
      items: [
        { name: 'Rooms & Units', path: '/rooms', icon: Box, key: 'rooms' },
        { name: 'Zones & Sites', path: '/sites', icon: Map, key: 'zones' },
      ]
    },
    {
      title: 'MANAGEMENT',
      items: [
        { name: 'Employees', path: '/employees', icon: UserCircle, key: 'employees' },
        { name: 'Screen Rights', path: '/rbac', icon: ShieldCheck, key: 'rbac' },
      ]
    }
  ];

  const filteredSections = menuSections.map(section => {
    const filteredItems = section.items.filter(item => hasAccess(item.key));
    return filteredItems.length > 0 ? { ...section, items: filteredItems } : null;
  }).filter(Boolean);

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex font-sans overflow-x-hidden">
      {/* MOBILE OVERLAY */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm transition-all"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* SIDEBAR */}
      <aside className={`w-64 bg-white border-r border-[#E5E7EB] flex flex-col fixed h-full z-50 shadow-xl md:shadow-sm transition-all duration-300 ${isSidebarOpen ? 'left-0' : '-left-64 md:left-0'}`}>
        <div className="p-6 flex items-center justify-between border-b border-transparent">
          <div className="flex items-center gap-3">
            <img src={logo} alt="Chippy ERP" className="w-10 h-10 object-contain" />
            <span className="text-xl font-bold text-gray-900 tracking-tight">Chippy ERP</span>
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="md:hidden p-2 text-gray-400 hover:bg-gray-50 rounded-lg">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          {loadingPerms ? (
            <div className="flex items-center justify-center py-10 text-gray-400">
              <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            <>
              {/* Main Dashboard Link */}
              {hasAccess('dashboard') && (
                <Link to="/dashboard" onClick={() => setIsSidebarOpen(false)} className={`flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium transition-colors ${location.pathname === '/dashboard' || location.pathname === '/' ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20' : 'text-gray-600 hover:bg-gray-50'}`}>
                  <LayoutDashboard size={18} />
                  <span>Dashboard</span>
                </Link>
              )}

              {filteredSections.map((section, idx) => (
                <div key={idx}>
                  <h4 className="text-[10px] font-bold text-gray-400 tracking-widest uppercase mb-2 px-3">{section.title}</h4>
                  <ul className="space-y-1">
                    {section.items.map((item, i) => {
                      const isActive = location.pathname.includes(item.path);
                      const Icon = item.icon;
                      return (
                        <li key={i}>
                          <Link to={item.path} onClick={() => setIsSidebarOpen(false)} className={`flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium transition-all ${isActive ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20' : 'text-gray-600 hover:bg-gray-50 hover:text-blue-600'}`}>
                            <Icon size={18} />
                            <span>{item.name}</span>
                          </Link>
                        </li>
                      )
                    })}
                  </ul>
                </div>
              ))}
            </>
          )}
        </div>

        <div className="p-4 border-t border-[#E5E7EB]">
          <Link to="/profile" onClick={() => setIsSidebarOpen(false)} className="flex items-center gap-3 text-gray-600 font-semibold px-3 py-2.5 w-full hover:bg-gray-50 rounded-xl transition-colors">
            <UserCircle size={18} />
            Profile Settings
          </Link>
        </div>
      </aside>

      {/* MAIN CONTENT WRAPPER */}
      <div className="flex-1 flex flex-col md:ml-64 min-h-screen max-w-full overflow-x-hidden">
        {/* TOP BAR */}
        <header className="h-16 bg-white border-b border-[#E5E7EB] flex items-center justify-between px-4 md:px-8 sticky top-0 z-30 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="p-2 -ml-2 text-gray-900 hover:bg-gray-50 rounded-lg md:hidden"
              >
                <Menu size={24} />
              </button>
              <span className="text-xl font-bold text-gray-900 md:hidden tracking-tight">Chippy ERP</span>
            </div>

            {/* Left Header Widget */}
            <div className="hidden lg:flex items-center gap-3">
              <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                <CalendarDays size={18} />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider leading-none">
                  {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </span>
                <span className="text-[13px] text-gray-800 font-extrabold leading-none mt-1.5">Chippy Hospitality Group</span>
              </div>
            </div>
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-6 ml-auto">
            {/* Bell icon hidden for now
            <button className="relative text-gray-400 hover:text-gray-600">
              <Bell size={20} />
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-bold flex items-center justify-center rounded-full border-2 border-white">1</span>
            </button>
            */}

            <div className="flex items-center gap-2 px-3 py-1 bg-green-50 rounded-full border border-green-100 hidden md:flex">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
              <span className="text-xs font-semibold text-green-700">Connected</span>
            </div>
            
            <div className="flex items-center gap-1.5 md:hidden">
              <div className="w-2 h-2 rounded-full bg-green-500"></div>
              <span className="text-[11px] font-semibold text-gray-600">Connected</span>
            </div>

            <div className="relative" ref={dropdownRef}>
              <div onClick={() => setDropdownOpen(!dropdownOpen)} className="flex items-center gap-3 cursor-pointer pl-4 md:border-l border-[#E5E7EB] hover:opacity-80 transition-opacity">
                <img src={`https://ui-avatars.com/api/?name=${user.name}&background=2563EB&color=fff&rounded=true`} alt="User" className="w-8 h-8 rounded-lg md:rounded-full" />
                <div className="hidden md:block text-sm">
                  <p className="font-bold text-gray-900 leading-tight">{user.name}</p>
                  <p className="text-[10px] text-gray-500 font-semibold uppercase">{user.role}</p>
                </div>
                <ChevronDown size={16} className="text-gray-400" />
              </div>
              {dropdownOpen && (
                <div className="absolute right-0 mt-3 w-48 bg-white border border-[#E5E7EB] rounded-xl shadow-lg overflow-hidden py-1 z-50">
                  <div className="px-4 py-2 border-b border-[#E5E7EB] mb-1">
                    <p className="text-[11px] text-gray-500 font-medium">Logged in as</p>
                    <p className="text-xs font-bold text-gray-900 truncate">{user.name}</p>
                    <p className="text-[10px] text-blue-600 font-semibold uppercase mt-0.5">{user.role}</p>
                  </div>
                  <button onClick={handleLogout} className="w-full text-left px-4 py-2 text-sm text-red-600 font-semibold hover:bg-red-50 flex items-center gap-2 transition-colors">
                    <LogOut size={14} /> Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* PAGE CONTENT */}
        <main className="flex-1 p-0 md:p-8 pb-24 md:pb-8">
          <Outlet />
        </main>
      </div>

      {/* MOBILE BOTTOM NAVIGATION */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-[#F8FAFC] border-t border-[#E5E7EB] flex justify-between items-center px-6 py-2 z-40 pb-safe">
        {hasAccess('dashboard') && (
          <Link to="/dashboard" className={`flex flex-col items-center gap-1 ${location.pathname === '/dashboard' ? 'text-[#2563EB]' : 'text-gray-500'}`}>
            <Home size={20} strokeWidth={2.5} />
            <span className="text-[10px] font-bold tracking-wide">Home</span>
          </Link>
        )}
        {hasAccess('enquiries') && (
          <Link to="/enquiries" className={`flex flex-col items-center gap-1 ${location.pathname === '/enquiries' ? 'text-[#2563EB]' : 'text-gray-500'}`}>
            <BarChart3 size={20} strokeWidth={2.5} />
            <span className="text-[10px] font-bold tracking-wide">Sales</span>
          </Link>
        )}
        {hasAccess('bookings') && (
          <Link to="/bookings" className={`flex flex-col items-center justify-center -mt-4 relative`}>
            <div className={`w-12 h-10 rounded-2xl flex items-center justify-center text-white shadow-lg ${location.pathname === '/bookings' ? 'bg-[#2563EB] shadow-blue-500/30' : 'bg-[#1A56DB]'}`}>
              <CalendarDays size={20} strokeWidth={2.5} />
            </div>
            <span className={`text-[10px] font-bold tracking-wide mt-1 ${location.pathname === '/bookings' ? 'text-[#2563EB]' : 'text-gray-500'}`}>Bookings</span>
          </Link>
        )}
        <button onClick={() => setIsSidebarOpen(true)} className="flex flex-col items-center gap-1 text-gray-500">
          <MoreHorizontal size={20} strokeWidth={2.5} />
          <span className="text-[10px] font-bold tracking-wide">More</span>
        </button>
      </div>
    </div>
  );
}
