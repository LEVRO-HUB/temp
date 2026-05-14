import React, { useState, useEffect } from 'react';
import { Plus, Download, FileText, Calendar, MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import API_BASE_URL from '../config';

export default function RoomManagement() {
  const navigate = useNavigate();
  const [rooms, setRooms] = useState([]);
  const [sites, setSites] = useState([]);
  const [zones, setZones] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  const [activeSiteId, setActiveSiteId] = useState('');
  const [activeZoneId, setActiveZoneId] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const headers = { 'Authorization': 'Bearer ' + token };
      const [resRooms, resSites, resZones, resBookings] = await Promise.all([
        fetch(`${API_BASE_URL}/api/rooms`, { headers }),
        fetch(`${API_BASE_URL}/api/locations/sites`, { headers }),
        fetch(`${API_BASE_URL}/api/locations/zones`, { headers }),
        fetch(`${API_BASE_URL}/api/bookings`, { headers })
      ]);
      
      const fetchedSites = await resSites.json();
      const fetchedZones = await resZones.json();
      
      let fetchedBookings = [];
      if (resBookings.ok) {
         fetchedBookings = await resBookings.json();
         setBookings(Array.isArray(fetchedBookings) ? fetchedBookings : []);
      }
      if (resRooms.ok) {
         setRooms(await resRooms.json());
      }
      if (resZones.ok) setZones(fetchedZones);
      if (resSites.ok) {
         setSites(fetchedSites);
         if(fetchedZones.length > 0) setActiveZoneId(fetchedZones[0].id);
         const firstSiteForZone = fetchedSites.find(s => s.zone_id === fetchedZones[0]?.id);
         if(firstSiteForZone) setActiveSiteId(firstSiteForZone.id);
      }
    } catch(err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const activeSite = sites.find(s => s.id == activeSiteId);
  const activeZone = zones.find(z => z.id == activeZoneId);
  const activeRooms = rooms.filter(r => r.site_id == activeSiteId);

  // Define today for occupancy check
  const today = new Date();
  today.setHours(0,0,0,0);

  return (
    <div className="w-full bg-white min-h-screen p-8 flex gap-8">
      
      {/* Left Sidebar Info Card */}
      <div className="w-80 shrink-0">
         <div className="bg-white border border-gray-200 rounded-[16px] p-6 shadow-sm flex flex-col gap-6">
            
            <div className="flex flex-col gap-2">
               <label className="text-[14px] font-bold text-gray-800">Select Zone</label>
               <select value={activeZoneId} onChange={e=>{
                  setActiveZoneId(e.target.value);
                  const firstSite = sites.find(s => s.zone_id == e.target.value);
                  if(firstSite) setActiveSiteId(firstSite.id);
               }} className="appearance-none bg-white border border-gray-200 rounded-lg px-4 py-2 text-[14px] font-semibold text-gray-700 outline-none w-full shadow-sm">
                 {zones.map(z => <option key={z.id} value={z.id}>{z.zone_name}</option>)}
               </select>
            </div>

            <div className="flex flex-col gap-2">
               <label className="text-[14px] font-bold text-gray-800">Select Site</label>
               <select value={activeSiteId} onChange={e=>setActiveSiteId(e.target.value)} className="appearance-none bg-white border border-gray-200 rounded-lg px-4 py-2 text-[14px] font-semibold text-gray-700 outline-none w-full shadow-sm">
                 {sites.filter(s => s.zone_id == activeZoneId).map(s => <option key={s.id} value={s.id}>{s.site_name}</option>)}
               </select>
            </div>

            <hr className="border-gray-100 my-2" />

            {/* Velachery Summary Details */}
            {activeSite && (
               <div className="flex flex-col gap-5">
                  <h3 className="font-bold text-[18px] text-gray-900 leading-none">{activeSite.site_name}</h3>
                  
                  <div className="grid grid-cols-[100px_1fr] gap-y-4 text-[13.5px]">
                     <span className="text-gray-500 font-medium">Type</span> 
                     <span className="font-semibold text-gray-800 capitalize leading-tight">{activeSite.site_type.replace('_',' ')}</span>
                     
                     <span className="text-gray-500 font-medium">Total Rooms</span> 
                     <span className="font-semibold text-gray-800">{activeRooms.length}</span>
                     
                     <span className="text-gray-500 font-medium">Location</span> 
                     <span className="font-semibold text-gray-800">{activeSite.location.split(',')[0]}</span>
                     
                     <span className="text-gray-500 font-medium">Zone</span> 
                     <span className="font-semibold text-gray-800">{activeZone?.zone_name}</span>
                  </div>
               </div>
            )}
         </div>
      </div>

      {/* Right Content Area */}
      <div className="flex-1 flex flex-col gap-6">
         
         {/* Top Header */}
         <div className="flex items-center justify-between">
            <h1 className="text-[22px] font-extrabold text-gray-900 tracking-tight">Rooms & Units</h1>
            <div className="flex items-center gap-3">
               <button className="flex items-center gap-2 border border-gray-200 rounded-lg px-4 py-2 bg-white text-[13px] font-bold text-gray-700 hover:bg-gray-50 transition-colors shadow-sm">
                  <Download size={14} className="text-gray-500" /> Export CSV
               </button>
               <button className="flex items-center gap-2 bg-[#2563EB] text-white rounded-lg px-4 py-2 text-[13px] font-bold hover:bg-blue-700 transition-colors shadow-sm">
                  <Plus size={16} strokeWidth={2.5} /> Add Room
               </button>
            </div>
         </div>

         {/* Room Tiles Grid */}
         {loading ? (
            <div className="py-20 text-center font-bold text-gray-400">Loading rooms snapshot...</div>
         ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 auto-rows-max">
               {activeRooms.map(room => {
                  // Determine status based on overlapping bookings for TODAY
                  const isMaintenance = room.status === 'maintenance';
                  const overlappingBooking = bookings.find(b => {
                      if(b.room_id !== room.id) return false;
                      const cIn = new Date(b.check_in_date); cIn.setHours(0,0,0,0);
                      const cOut = new Date(b.check_out_date); cOut.setHours(0,0,0,0);
                      return today >= cIn && today < cOut; 
                  });

                  // Default Available UI
                  let bgClass = "bg-[#F0FDF4] border-[#dcfce7]";
                  let titleClass = "text-[#166534]";
                  let statusClass = "text-[#16A34A]";
                  let statusText = "AVAILABLE";

                  if (overlappingBooking) {
                     bgClass = "bg-[#FEF2F2] border-[#fee2e2]";
                     titleClass = "text-[#991B1B]";
                     statusClass = "text-[#DC2626]";
                     statusText = "OCCUPIED";
                  } else if (isMaintenance) {
                     bgClass = "bg-[#FFF7ED] border-[#ffedd5]";
                     titleClass = "text-[#9A3412]";
                     statusClass = "text-[#EA580C]";
                     statusText = "MAINTENANCE";
                  }

                  return (
                     <div key={room.id} onClick={() => {
                        if(!overlappingBooking && !isMaintenance) {
                           navigate('/bookings', { state: { autoOpenCreate: true, prefilledSiteId: room.site_id, prefilledRoomId: room.id } });
                        }
                     }} className={`relative border rounded-[12px] h-[110px] flex flex-col items-center justify-center cursor-pointer transition-colors hover:brightness-95 ${bgClass}`}>
                        
                        <h4 className={`font-extrabold text-[16px] tracking-tight ${titleClass}`}>
                           {room.room_number.toUpperCase()}
                        </h4>
                        
                        <span className={`text-[11px] font-extrabold uppercase mt-1 tracking-wide ${statusClass}`}>
                           {statusText}
                        </span>

                        {overlappingBooking && (
                           <div className="flex items-center gap-1.5 mt-2">
                              <FileText size={10} className="text-[#EF4444] opacity-80" />
                              <span className="text-[10px] font-bold text-[#EF4444]">
                                 #BKG-{10000+overlappingBooking.id}
                              </span>
                           </div>
                        )}
                     </div>
                  )
               })}
            </div>
         )}

      </div>
    </div>
  );
}
