import React, { useEffect, useState } from "react";
import { Users, Calendar, BarChart2, ArrowUp, ArrowDown, Link as LinkIcon, Eye } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar, Legend, PieChart, Pie, Cell } from "recharts";
import { Link } from "react-router-dom";
import { jwtDecode } from 'jwt-decode';
import API_BASE_URL from '../config';

export default function Dashboard() {
  const [userName, setUserName] = useState('User');
  const [metrics, setMetrics] = useState({
    dailyEnquiriesCount: 0,
    totalBookingsCount: 0,
    totalRevenue: 0,
    bookingConversionRate: 0,
    trendEnquiries: [],
    recentEnquiries: [],
    recentBookings: [],
    recentPayments: [],
    roomStats: { available: 0, occupied: 0, cleaning: 0, maintenance: 0, total: 0 },
    siteRevenues: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const token = localStorage.getItem('token');
      if (token) setUserName(jwtDecode(token).name || 'User');
    } catch(e) {}
    fetchDashboardMetrics();
  }, []);

  const fetchDashboardMetrics = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/api/dashboard`, {
        headers: { 'Authorization': 'Bearer ' + token }
      });
      if (res.ok) setMetrics(await res.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const getStatusPill = (status) => {
    if(!status) return null;
    const s = status.toLowerCase();
    if(s === 'confirmed' || s === 'converted') return <span className="text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded text-[10px] font-bold">Converted</span>;
    if(s === 'new') return <span className="text-blue-600 bg-blue-50 px-2 py-0.5 rounded text-[10px] font-bold">New</span>;
    if(s === 'lost') return <span className="text-red-500 bg-red-50 px-2 py-0.5 rounded text-[10px] font-bold">Lost</span>;
    if(s === 'follow up') return <span className="text-amber-600 bg-amber-50 px-2 py-0.5 rounded text-[10px] font-bold">Follow Up</span>;
    return <span className="text-gray-600 bg-gray-100 px-2 py-0.5 rounded text-[10px] font-bold">{status}</span>;
  }

  const statCards = [
    { title: "Today's Enquiries", value: metrics.dailyEnquiriesCount, icon: <Users size={20} className="text-[#2563EB]"/>, change: `${metrics.enquiryChange >= 0 ? '+' : ''}${metrics.enquiryChange}% vs yesterday`, trend: metrics.enquiryChange >= 0 ? "up" : "down", bg: "bg-blue-600" },
    { title: "Total Bookings", value: metrics.totalBookingsCount, icon: <Calendar size={20} className="text-[#8B5CF6]"/>, change: `${metrics.bookingChange >= 0 ? '+' : ''}${metrics.bookingChange}% vs yesterday`, trend: metrics.bookingChange >= 0 ? "up" : "down", bg: "bg-purple-600" },
    { title: "Gross Revenue", value: `₹ ${(metrics.totalRevenue/1000).toLocaleString('en-IN', {minimumFractionDigits:1})}k`, icon: <div className="text-[#10B981] font-bold text-lg">₹</div>, change: `${metrics.revenueChange >= 0 ? '+' : ''}${metrics.revenueChange}% vs yesterday`, trend: metrics.revenueChange >= 0 ? "up" : "down", bg: "bg-emerald-500" },
    { title: "Conversion Rate", value: `${metrics.bookingConversionRate}%`, icon: <PieChart size={20} className="text-[#F59E0B]"/>, change: "Current average", trend: "up", bg: "bg-amber-500" }
  ];

  const ROOM_COLORS = ['#4ADE80', '#F87171', '#FBBF24', '#A78BFA'];
  const roomPieData = [
    { name: 'Available', value: metrics.roomStats.available },
    { name: 'Occupied', value: metrics.roomStats.occupied },
    { name: 'Cleaning', value: metrics.roomStats.cleaning },
    { name: 'Maintenance', value: metrics.roomStats.maintenance }
  ];

  return (
    <div className="max-w-[1600px] mx-auto min-h-[calc(100vh-4rem)] bg-[#F8FAFC] p-4 md:p-5 md:-m-8 border-0 md:border-l border-[#E5E7EB] flex flex-col gap-4">
      {/* Header */}
      <div className="flex justify-between items-center shrink-0">
         <div>
           <h1 className="text-xl font-bold text-gray-900 leading-tight">Dashboard</h1>
           <p className="text-[13px] font-medium text-gray-500">Welcome back, {userName} 👋</p>
         </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center p-12 text-gray-500 font-medium tracking-wide">Loading dashboard data...</div>
      ) : (
        <>
          {/* Top Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 shrink-0">
            {statCards.map((stat, i) => (
              <div key={i} className={`bg-white rounded-[10px] border border-[#E5E7EB] p-3 px-4 shadow-[0_2px_10px_rgb(0,0,0,0.02)] transition-all relative overflow-hidden group`}>
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-xl font-extrabold text-gray-900 transition-colors mb-1.5">{stat.value}</h3>
                  </div>
                  <div className={`w-8 h-8 rounded-full ${stat.bg} bg-opacity-10 flex items-center justify-center`}>
                    {React.cloneElement(stat.icon, { size: 16 })}
                  </div>
                </div>
                <div>
                   <p className="text-gray-900 font-semibold mb-1.5 tracking-wide text-[12px]">{stat.title}</p>
                   <span className={`flex items-center gap-1 text-[10px] font-bold ${stat.trend === 'up' ? 'text-emerald-500' : 'text-red-500'}`}>
                      {stat.trend === 'up' ? <ArrowUp size={10} strokeWidth={3}/> : <ArrowDown size={10} strokeWidth={3}/>} {stat.change}
                   </span>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 shrink-0">
            {/* Chart Area Left: Line Graph */}
            <div className="bg-white rounded-[10px] border border-[#E5E7EB] shadow-[0_2px_10px_rgb(0,0,0,0.02)]">
              <div className="p-3 px-4 flex items-center justify-between">
                 <h2 className="text-[13px] font-bold text-gray-900">Enquiries vs Bookings</h2>
              </div>
              <div className="px-4 pb-4 w-full" style={{ height: "170px" }}>
                {metrics.trendEnquiries.length === 0 ? <p className="text-center text-gray-500 mt-10">No data.</p> :
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={metrics.trendEnquiries} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                      <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#6B7280', fontWeight: 600}} dy={10} />
                      <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#9CA3AF', fontWeight: 600}} />
                      <RechartsTooltip contentStyle={{borderRadius: '8px', border: '1px solid #E5E7EB', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', padding: '5px 10px'}} cursor={{fill: '#F3F4F6'}} />
                      <Legend iconType="circle" wrapperStyle={{fontSize: '11px', fontWeight: 600, color: '#4B5563', paddingTop: '5px'}} />
                      <Line isAnimationActive={true} animationDuration={1500} type="monotone" dataKey="enquiries" name="Enquiries" stroke="#2563EB" strokeWidth={3} dot={{r:3, fill: '#2563EB', strokeWidth: 2, stroke:'#fff'}} activeDot={{r: 5}} />
                      <Line isAnimationActive={true} animationDuration={1500} type="monotone" dataKey="bookings" name="Bookings" stroke="#10B981" strokeWidth={3} dot={{r:3, fill: '#10B981', strokeWidth: 2, stroke:'#fff'}} activeDot={{r: 5}} />
                    </LineChart>
                  </ResponsiveContainer>
                }
              </div>
            </div>

            {/* Site Wise Revenue (Right Block) */}
            <div className="bg-white rounded-[10px] border border-[#E5E7EB] shadow-[0_2px_10px_rgb(0,0,0,0.02)]">
              <div className="p-3 px-4 flex items-center justify-between">
                 <h2 className="text-[13px] font-bold text-gray-900">Site-wise Revenue (This Month)</h2>
              </div>
              <div className="px-4 pb-4 w-full" style={{ height: "170px" }}>
                 {metrics.siteRevenues.length === 0 ? <p className="text-center text-gray-500 mt-10">No data.</p> :
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={metrics.siteRevenues} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#6B7280', fontWeight: 600}} dy={10} />
                      <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#9CA3AF', fontWeight: 600}} tickFormatter={(t) => `${t/1000}K`} />
                      <RechartsTooltip contentStyle={{borderRadius: '8px', border: '1px solid #E5E7EB', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', padding: '5px 10px'}} cursor={{fill: '#F3F4F6'}} />
                      <Bar isAnimationActive={true} animationDuration={1500} dataKey="revenue" fill="#3B82F6" radius={[4, 4, 0, 0]} maxBarSize={24} />
                    </BarChart>
                  </ResponsiveContainer>
                 }
              </div>
            </div>
          </div>

          {/* Middle Dual Tables - Fixed height container */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-[350px] shrink-0">
             {/* Recent Enquiries Table */}
             <div className="bg-white rounded-[12px] border border-[#E5E7EB] shadow-[0_2px_10px_rgb(0,0,0,0.02)] flex flex-col h-full overflow-hidden">
                <div className="p-3 px-4 border-b border-[#E5E7EB] flex items-center justify-between shrink-0">
                   <h2 className="text-[13px] font-bold text-gray-900">Recent Enquiries</h2>
                   <Link to="/enquiries" className="text-[11px] font-bold text-[#2563EB] hover:text-blue-800 transition-colors">View All</Link>
                </div>
                <div className="flex-1 overflow-y-auto px-4 py-2 custom-scrollbar">
                  <table className="w-full text-left text-xs whitespace-nowrap">
                    <thead className="text-gray-500 font-semibold border-b border-[#F3F4F6] sticky top-0 bg-white">
                      <tr>
                        <th className="pb-3 pt-2 font-semibold text-[10px] tracking-wide uppercase">Time</th>
                        <th className="pb-3 pt-2 font-semibold text-[10px] tracking-wide uppercase">Guest Name</th>
                        <th className="pb-3 pt-2 font-semibold text-[10px] tracking-wide uppercase">Mobile</th>
                        <th className="pb-3 pt-2 font-semibold text-[10px] tracking-wide uppercase">Site</th>
                        <th className="pb-3 pt-2 font-semibold text-[10px] tracking-wide uppercase">Status</th>
                      </tr>
                    </thead>
                    <tbody className="text-gray-800 font-medium">
                      {metrics.recentEnquiries.length === 0 ? <tr><td colSpan={5} className="py-8 text-center text-gray-500">No enquiries</td></tr> :
                       metrics.recentEnquiries.map((eq, i) => (
                        <tr key={i} className="border-b border-[#F9FAFB] hover:bg-gray-50 transition-colors">
                          <td className="py-2.5 text-gray-500">{eq.time}</td>
                          <td className="py-2.5 text-gray-900 font-bold">{eq.guest_name}</td>
                          <td className="py-2.5 text-gray-500">{eq.mobile}</td>
                          <td className="py-2.5 text-gray-600">{eq.site}</td>
                          <td className="py-2.5">{getStatusPill(eq.status)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
             </div>

             {/* Recent Bookings Table */}
             <div className="bg-white rounded-[12px] border border-[#E5E7EB] shadow-[0_2px_10px_rgb(0,0,0,0.02)] flex flex-col h-full overflow-hidden">
                <div className="p-3 px-4 border-b border-[#E5E7EB] flex items-center justify-between shrink-0">
                   <h2 className="text-[13px] font-bold text-gray-900">Recent Bookings</h2>
                   <Link to="/bookings" className="text-[11px] font-bold text-[#2563EB] hover:text-blue-800 transition-colors">View All</Link>
                </div>
                <div className="flex-1 overflow-y-auto px-4 py-2 custom-scrollbar">
                  <table className="w-full text-left text-xs whitespace-nowrap">
                    <thead className="text-gray-500 font-semibold border-b border-[#F3F4F6] sticky top-0 bg-white">
                      <tr>
                        <th className="pb-3 pt-2 font-semibold text-[10px] tracking-wide uppercase">Booking ID</th>
                        <th className="pb-3 pt-2 font-semibold text-[10px] tracking-wide uppercase">Guest Name</th>
                        <th className="pb-3 pt-2 font-semibold text-[10px] tracking-wide uppercase">Site</th>
                        <th className="pb-3 pt-2 font-semibold text-[10px] tracking-wide uppercase">Check-in</th>
                        <th className="pb-3 pt-2 font-semibold text-[10px] tracking-wide uppercase text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="text-gray-800 font-medium">
                      {metrics.recentBookings.length === 0 ? <tr><td colSpan={5} className="py-8 text-center text-gray-500">No bookings</td></tr> :
                       metrics.recentBookings.map((bkg, i) => (
                        <tr key={i} className="border-b border-[#F9FAFB] hover:bg-gray-50 transition-colors">
                          <td className="py-2.5 text-gray-500 font-semibold">{bkg.id}</td>
                          <td className="py-2.5 text-gray-900 font-bold">{bkg.guest_name}</td>
                          <td className="py-2.5 text-gray-600">{bkg.site}</td>
                          <td className="py-2.5 text-gray-500">{bkg.check_in}</td>
                          <td className="py-2.5 text-gray-900 font-bold text-right">₹ {bkg.amount.toLocaleString('en-IN')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
             </div>
          </div>

          {/* Bottom Row - Payments & Room Status */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-[420px] shrink-0 pb-4">
             {/* Payments Table */}
             <div className="bg-white rounded-[12px] border border-[#E5E7EB] shadow-[0_2px_10px_rgb(0,0,0,0.02)] flex flex-col h-full overflow-hidden">
                <div className="p-3 px-4 border-b border-[#E5E7EB] flex items-center justify-between shrink-0">
                   <h2 className="text-[13px] font-bold text-gray-900">Payments <span className="text-gray-500 font-medium">(Recent)</span></h2>
                   <Link to="/payments" className="text-[11px] font-bold text-[#2563EB] hover:text-blue-800 transition-colors">View All</Link>
                </div>
                <div className="flex-1 overflow-y-auto px-4 py-2 custom-scrollbar">
                  <table className="w-full text-left text-xs whitespace-nowrap">
                    <thead className="text-gray-500 font-semibold border-b border-[#F3F4F6] sticky top-0 bg-white">
                      <tr>
                        <th className="pb-3 pt-2 font-semibold text-[10px] tracking-wide uppercase">Payment No</th>
                        <th className="pb-3 pt-2 font-semibold text-[10px] tracking-wide uppercase">Booking ID</th>
                        <th className="pb-3 pt-2 font-semibold text-[10px] tracking-wide uppercase">Payment Date</th>
                        <th className="pb-3 pt-2 font-semibold text-[10px] tracking-wide uppercase">Amount</th>
                        <th className="pb-3 pt-2 font-semibold text-[10px] tracking-wide uppercase text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="text-gray-800 font-medium">
                      {metrics.recentPayments.length === 0 ? <tr><td colSpan={5} className="py-8 text-center text-gray-500">No payments</td></tr> :
                       metrics.recentPayments.map((pay, i) => (
                        <tr key={i} className="border-b border-[#F9FAFB] hover:bg-gray-50 transition-colors">
                          <td className="py-3 text-gray-900 font-bold">{pay.payment_no}</td>
                          <td className="py-3 text-gray-900 font-bold">{pay.booking_id}</td>
                          <td className="py-3 text-gray-600">{pay.date}</td>
                          <td className="py-3 text-gray-900 font-bold">₹ {pay.amount.toLocaleString('en-IN')}</td>
                          <td className="py-3 text-right">
                            <span className="text-green-600 bg-green-50 px-2.5 py-1 rounded border border-green-100 text-[10px] font-bold">Success</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
             </div>

             {/* Room Status Overview */}
             <div className="bg-white rounded-[12px] border border-[#E5E7EB] shadow-[0_2px_10px_rgb(0,0,0,0.02)] flex flex-col h-full overflow-hidden p-6">
                <div className="flex items-center justify-between shrink-0 mb-6">
                   <h2 className="text-[15px] font-bold text-gray-900">Room Status Overview</h2>
                   <Link to="/rooms" className="text-[12px] font-bold text-[#2563EB] hover:text-blue-800 transition-colors">View All</Link>
                </div>
                
                {/* 4 Block Tiles */}
                <div className="grid grid-cols-4 gap-3 mb-8 shrink-0">
                   <div className="bg-green-50 rounded-xl p-3 flex flex-col items-center justify-center border border-green-100 shadow-sm text-center">
                     <p className="text-[11px] font-bold text-green-600 mb-1">Available</p>
                     <p className="text-2xl font-extrabold text-gray-900">{metrics.roomStats.available}</p>
                   </div>
                   <div className="bg-red-50 rounded-xl p-3 flex flex-col items-center justify-center border border-red-100 shadow-sm text-center">
                     <p className="text-[11px] font-bold text-red-600 mb-1">Occupied</p>
                     <p className="text-2xl font-extrabold text-gray-900">{metrics.roomStats.occupied}</p>
                   </div>
                   <div className="bg-amber-50 rounded-xl p-3 flex flex-col items-center justify-center border border-amber-100 shadow-sm text-center">
                     <p className="text-[11px] font-bold text-amber-600 mb-1">Cleaning</p>
                     <p className="text-2xl font-extrabold text-gray-900">{metrics.roomStats.cleaning}</p>
                   </div>
                   <div className="bg-purple-50 rounded-xl p-3 flex flex-col items-center justify-center border border-purple-100 shadow-sm text-center">
                     <p className="text-[11px] font-bold text-purple-600 mb-1">Maintenance</p>
                     <p className="text-2xl font-extrabold text-gray-900">{metrics.roomStats.maintenance}</p>
                   </div>
                </div>

                <div className="flex-1 flex items-center justify-between pt-2">
                   {/* Left Side: Pie Chart */}
                   <div className="w-[180px] h-[180px] shrink-0 relative">
                     <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie 
                            data={roomPieData} 
                            cx="50%" cy="50%" 
                            innerRadius={45} outerRadius={80} 
                            paddingAngle={2}
                            dataKey="value"
                            isAnimationActive={true}
                          >
                             {roomPieData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={ROOM_COLORS[index % ROOM_COLORS.length]} />
                             ))}
                          </Pie>
                        </PieChart>
                     </ResponsiveContainer>
                   </div>
                   
                   {/* Right Side: Custom Legend */}
                   <div className="flex-1 pl-8">
                     <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                             <div className="w-3 h-3 rounded-full bg-[#4ADE80]"></div>
                             <span className="text-xs font-bold text-gray-700">Available</span>
                          </div>
                          <span className="text-xs font-medium text-gray-500">{metrics.roomStats.available} (48%)</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                             <div className="w-3 h-3 rounded-full bg-[#F87171]"></div>
                             <span className="text-xs font-bold text-gray-700">Occupied</span>
                          </div>
                          <span className="text-xs font-medium text-gray-500">{metrics.roomStats.occupied} (40%)</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                             <div className="w-3 h-3 rounded-full bg-[#FBBF24]"></div>
                             <span className="text-xs font-bold text-gray-700">Cleaning</span>
                          </div>
                          <span className="text-xs font-medium text-gray-500">{metrics.roomStats.cleaning} (8%)</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                             <div className="w-3 h-3 rounded-full bg-[#A78BFA]"></div>
                             <span className="text-xs font-bold text-gray-700">Maintenance</span>
                          </div>
                          <span className="text-xs font-medium text-gray-500">{metrics.roomStats.maintenance} (4%)</span>
                        </div>
                     </div>
                     <div className="mt-8 text-center text-xs font-bold text-gray-500">
                        Total Rooms: {metrics.roomStats.total}
                     </div>
                   </div>
                </div>
             </div>
          </div>
        </>
      )}
    </div>
  );
}
