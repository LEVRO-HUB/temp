import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, CreditCard, Box, Map, Search, Bell, LogOut, ChevronDown, UserCircle, ShoppingCart, UserCheck, BarChart3 } from 'lucide-react';
import { jwtDecode } from 'jwt-decode';

export default function DashboardLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = useState({ name: 'Loading...', role: 'Admin' });
  const [dropdownOpen, setDropdownOpen] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decoded = jwtDecode(token);
        setUser({ name: decoded.name || 'Admin User', role: decoded.role || 'Admin' });
      } catch (e) {
        console.error('Invalid token', e);
      }
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const [purchaseOpen, setPurchaseOpen] = useState(true);

  const menuSections = [
    {
       title: 'SALES',
       items: [
         { name: 'Sales Enquiries', path: '/enquiries', icon: Users },
         { name: 'Bookings & Sales', path: '/bookings', icon: Box },
       ]
    },
    {
       title: 'FINANCE',
       items: [
         { name: 'Payments', path: '/payments', icon: CreditCard },
       ]
    },
    {
       title: 'PURCHASE',
       isNested: true,
       items: [
         { name: 'PO Dashboard', path: '/purchase-orders/dashboard', letter: 'D' },
         { name: 'Purchase Orders', path: '/purchase-orders/list', letter: 'P' },
         { name: 'Approvals', path: '/purchase-orders/approvals', letter: 'A' },
         { name: 'Vendor Network', path: '/purchase-orders/vendors', letter: 'V' },
         { name: 'Financial Audit', path: '/purchase-orders/audit', letter: 'F' },
       ]
    },
    {
       title: 'OPERATIONS',
       items: [
         { name: 'Rooms & Units', path: '/rooms', icon: Box },
         { name: 'Zones & Sites', path: '/sites', icon: Map },
       ]
    },
    {
       title: 'MANAGEMENT',
       items: [
         { name: 'Employees', path: '/employees', icon: UserCircle },
       ]
    }
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex font-sans">
      {/* SIDEBAR */}
      <aside className="w-64 bg-white border-r border-[#E5E7EB] flex flex-col hidden md:flex fixed h-full z-10 shadow-sm transition-all duration-300">
        <div className="p-6 flex items-center gap-3 border-b border-transparent">
          <div className="bg-blue-600 text-white p-2 rounded-lg"><LayoutDashboard size={20} /></div>
          <span className="text-xl font-bold text-gray-900 tracking-tight">Chippy ERP</span>
        </div>
        
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          {/* Main Dashboard Link */}
          <Link to="/dashboard" className={`flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium transition-colors ${location.pathname === '/dashboard' || location.pathname === '/' ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20' : 'text-gray-600 hover:bg-gray-50'}`}>
             <LayoutDashboard size={18} />
             <span>Dashboard</span>
          </Link>

          {menuSections.map((section, idx) => (
             <div key={idx}>
               {section.isNested ? (
                 <div className="space-y-1">
                    <button 
                      onClick={() => setPurchaseOpen(!purchaseOpen)}
                      className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-gray-600 hover:bg-gray-50 transition-all group"
                    >
                      <div className="flex items-center gap-3">
                         <ShoppingCart size={18} className={purchaseOpen ? 'text-blue-600' : ''} />
                         <span className={`text-[11px] font-bold tracking-widest uppercase ${purchaseOpen ? 'text-gray-900' : 'text-gray-400'}`}>{section.title}</span>
                      </div>
                      <ChevronDown size={14} className={`transition-transform duration-200 ${purchaseOpen ? 'rotate-180 text-blue-600' : 'text-gray-400'}`} />
                    </button>
                    
                    {purchaseOpen && (
                      <div className="ml-4 border-l-2 border-gray-100 pl-2 space-y-1 mt-1 transition-all">
                        {section.items.map((item, i) => {
                          const isActive = location.pathname === item.path;
                          return (
                            <li key={i} className="list-none">
                              <Link to={item.path} className={`flex items-center gap-3 px-3 py-2 rounded-xl text-[13px] font-medium transition-all ${isActive ? 'text-blue-600' : 'text-gray-500 hover:text-blue-600 hover:bg-gray-50/50'}`}>
                                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold border transition-all ${isActive ? 'bg-blue-600 border-blue-600 text-white ring-4 ring-blue-50' : 'bg-gray-50 border-gray-200 text-gray-400'}`}>
                                  {item.letter}
                                </div>
                                <span className={isActive ? 'font-bold' : ''}>{item.name}</span>
                              </Link>
                            </li>
                          )
                        })}
                      </div>
                    )}
                 </div>
               ) : (
                 <>
                   <h4 className="text-[10px] font-bold text-gray-400 tracking-widest uppercase mb-2 px-3">{section.title}</h4>
                   <ul className="space-y-1">
                     {section.items.map((item, i) => {
                       const isActive = location.pathname.includes(item.path);
                       const Icon = item.icon;
                       return (
                         <li key={i}>
                           <Link to={item.path} className={`flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium transition-all ${isActive ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20' : 'text-gray-600 hover:bg-gray-50 hover:text-blue-600'}`}>
                             <Icon size={18} />
                             <span>{item.name}</span>
                           </Link>
                         </li>
                       )
                     })}
                   </ul>
                 </>
               )}
             </div>
          ))}
        </div>

        <div className="p-4 border-t border-[#E5E7EB]">
          <Link to="/profile" className="flex items-center gap-3 text-gray-600 font-semibold px-3 py-2.5 w-full hover:bg-gray-50 rounded-xl transition-colors">
            <UserCircle size={18} />
            Profile Settings
          </Link>
        </div>
      </aside>

      {/* MAIN CONTENT WRAPPER */}
      <div className="flex-1 flex flex-col md:ml-64 min-h-screen">
        {/* TOP BAR */}
        <header className="h-16 bg-white border-b border-[#E5E7EB] flex items-center justify-between px-8 sticky top-0 z-10 shadow-sm">
          {/* Left search */}
          <div className="flex items-center bg-[#F8FAFC] border border-[#E5E7EB] rounded-lg px-4 py-2 w-96 hidden lg:flex">
            <Search size={16} className="text-gray-400 mr-2" />
            <input type="text" placeholder="Search by mobile, name, booking id..." className="bg-transparent border-none outline-none text-sm w-full text-gray-700" />
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-6 ml-auto">
            <button className="relative text-gray-400 hover:text-gray-600">
              <Bell size={20} />
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-bold flex items-center justify-center rounded-full border-2 border-white">1</span>
            </button>

            <div className="flex items-center gap-2 px-3 py-1 bg-green-50 rounded-full border border-green-100 hidden sm:flex">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
              <span className="text-xs font-semibold text-green-700">Connected</span>
            </div>

            <div className="relative">
              <div onClick={() => setDropdownOpen(!dropdownOpen)} className="flex items-center gap-3 cursor-pointer pl-4 border-l border-[#E5E7EB] hover:opacity-80 transition-opacity">
                <img src={`https://ui-avatars.com/api/?name=${user.name}&background=2563EB&color=fff&rounded=true`} alt="User" className="w-8 h-8 rounded-full" />
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
        <main className="flex-1 p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
