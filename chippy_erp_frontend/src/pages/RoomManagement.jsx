import React, { useState, useEffect } from 'react';
import { Plus, Download, FileText, Calendar, MapPin, ArrowLeft } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import API_BASE_URL from '../config';

export default function RoomManagement() {
  const navigate = useNavigate();
  const location = useLocation();
  const [rooms, setRooms] = useState([]);
  const [sites, setSites] = useState([]);
  const [zones, setZones] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  const [activeSiteId, setActiveSiteId] = useState('');
  const [activeZoneId, setActiveZoneId] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newRoomData, setNewRoomData] = useState({
    room_number: '',
    room_type: 'standard',
    status: 'available'
  });
  const [submitError, setSubmitError] = useState('');

  useEffect(() => {
    fetchData();
  }, [location.state]);

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
         if (location.state?.prefilledZoneId) {
            setActiveZoneId(location.state.prefilledZoneId);
         }
         if (location.state?.prefilledSiteId) {
            setActiveSiteId(location.state.prefilledSiteId);
            if (location.state?.autoOpenCreate) {
               const site = fetchedSites.find(s => s.id == location.state.prefilledSiteId);
               const defaultRoomType = site?.site_type === 'service_apartment' ? '1BHK' : 'Standard';
               setNewRoomData({
                 room_number: '',
                 room_type: defaultRoomType,
                 status: 'available'
               });
               setIsModalOpen(true);
            }
         }
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

  const handleOpenModal = (siteId) => {
    setActiveSiteId(siteId);
    const site = sites.find(s => s.id === siteId);
    const defaultRoomType = site?.site_type === 'service_apartment' ? '1BHK' : 'Standard';
    setNewRoomData({
      room_number: '',
      room_type: defaultRoomType,
      status: 'available'
    });
    setIsModalOpen(true);
  };

  const handleCreateRoom = async (e) => {
    e.preventDefault();
    setSubmitError('');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/api/rooms`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + token
        },
        body: JSON.stringify({
          site_id: activeSiteId,
          room_number: newRoomData.room_number,
          room_type: newRoomData.room_type,
          status: newRoomData.status
        })
      });
      if (res.ok) {
        setIsModalOpen(false);
        fetchData();
      } else {
        const data = await res.json();
        setSubmitError(data.error || 'Failed to create room');
      }
    } catch (err) {
      setSubmitError('An error occurred');
    }
  };

  // Define today for occupancy check
  const today = new Date();
  today.setHours(0,0,0,0);

  return (
    <div className="w-full bg-white min-h-screen p-8 flex flex-col gap-8">
      
      {/* View 1: Zones List */}
      {!activeZoneId && (
        <div className="flex-1 flex flex-col gap-6 w-full max-w-6xl mx-auto">
          <div className="flex items-center justify-between">
            <h1 className="text-[24px] font-extrabold text-gray-900 tracking-tight">Zones Management</h1>
          </div>
          {loading ? (
             <div className="py-20 text-center font-bold text-gray-400">Loading data...</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {zones.map(zone => {
                const zoneSites = sites.filter(s => s.zone_id === zone.id);
                return (
                  <div key={zone.id} onClick={() => setActiveZoneId(zone.id)} className="bg-white border border-gray-200 rounded-[16px] p-6 shadow-sm hover:shadow-md cursor-pointer transition-all flex flex-col gap-4">
                    <h3 className="font-extrabold text-[20px] text-gray-900">{zone.zone_name}</h3>
                    <div className="flex items-center justify-between mt-2">
                       <span className="text-gray-500 font-bold text-[14px]">{zoneSites.length} Sites Available</span>
                       <span className="text-blue-600 text-[13px] font-bold">View Sites →</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* View 2: Sites List */}
      {activeZoneId && !activeSiteId && (
        <div className="flex-1 flex flex-col gap-6 w-full max-w-6xl mx-auto">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => {
                if (location.state?.prefilledZoneId) {
                  navigate('/sites');
                } else {
                  setActiveZoneId('');
                }
              }} 
              className="flex items-center justify-center p-2 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
            >
              <ArrowLeft size={18} strokeWidth={2.5} />
            </button>
            <h1 className="text-[24px] font-extrabold text-gray-900 tracking-tight">{activeZone?.zone_name} - Sites</h1>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {sites.filter(s => s.zone_id === activeZoneId).map(site => {
              const siteRooms = rooms.filter(r => r.site_id === site.id);
              return (
                <div key={site.id} className="bg-white border border-gray-200 rounded-[16px] p-6 shadow-sm flex flex-col gap-5">
                  <h3 className="font-bold text-[18px] text-gray-900">{site.site_name}</h3>
                  <div className="grid grid-cols-[100px_1fr] gap-y-3 text-[13.5px]">
                    <span className="text-gray-500 font-medium">Type</span> 
                    <span className="font-semibold text-gray-800 capitalize">{site.site_type.replace('_',' ')}</span>
                    <span className="text-gray-500 font-medium">Location</span> 
                    <span className="font-semibold text-gray-800">{site.location.split(',')[0]}</span>
                    <span className="text-gray-500 font-medium">Total Rooms</span> 
                    <span className="font-semibold text-gray-800">{siteRooms.length}</span>
                  </div>
                  <div className="flex items-center gap-3 mt-2">
                    <button onClick={() => setActiveSiteId(site.id)} className="flex-1 border border-[#2563EB] text-[#2563EB] rounded-lg px-4 py-2 text-[13px] font-bold hover:bg-blue-50 transition-colors text-center">
                      View Rooms
                    </button>
                    <button onClick={() => handleOpenModal(site.id)} className="flex-1 bg-[#2563EB] text-white rounded-lg px-4 py-2 text-[13px] font-bold hover:bg-blue-700 transition-colors text-center flex justify-center items-center gap-2 shadow-sm">
                      <Plus size={16} strokeWidth={2.5} /> Add Room
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* View 3: Rooms List */}
      {activeZoneId && activeSiteId && (
        <div className="flex-1 flex flex-col gap-6 w-full max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-0">
            <div className="flex items-start md:items-center gap-3 md:gap-4 w-full md:w-auto">
              <button 
                onClick={() => {
                  if (location.state?.prefilledSiteId) {
                    navigate('/sites');
                  } else {
                    setActiveSiteId('');
                  }
                }} 
                className="flex shrink-0 items-center justify-center p-2 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors mt-0.5 md:mt-0"
              >
                <ArrowLeft size={18} strokeWidth={2.5} />
              </button>
              <h1 className="text-[20px] md:text-[24px] font-extrabold text-gray-900 tracking-tight leading-tight">{activeSite?.site_name} - Rooms</h1>
            </div>
            <div className="flex items-center gap-2 md:gap-3 w-full md:w-auto">
               <button className="flex-1 md:flex-none flex items-center justify-center gap-2 border border-gray-200 rounded-lg px-3 py-2 bg-white text-[13px] font-bold text-gray-700 hover:bg-gray-50 transition-colors shadow-sm whitespace-nowrap">
                  <Download size={14} className="text-gray-500" /> Export CSV
               </button>
               <button onClick={() => handleOpenModal(activeSiteId)} className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-[#2563EB] text-white rounded-lg px-3 py-2 text-[13px] font-bold hover:bg-blue-700 transition-colors shadow-sm whitespace-nowrap">
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
                   const isMaintenance = room.status === 'maintenance';
                   const overlappingBooking = bookings.find(b => {
                       if(b.room_id !== room.id) return false;
                       const cIn = new Date(b.check_in_date); cIn.setHours(0,0,0,0);
                       const cOut = new Date(b.check_out_date); cOut.setHours(0,0,0,0);
                       return today >= cIn && today < cOut; 
                   });

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
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-[16px] shadow-xl w-full max-w-md p-6">
            <h2 className="text-[20px] font-extrabold mb-4 text-gray-900">Add New Room</h2>
            {submitError && <div className="mb-4 text-[#EF4444] text-[13px] font-bold">{submitError}</div>}
            <form onSubmit={handleCreateRoom} className="flex flex-col gap-4">
              <div>
                <label className="block text-[13px] font-bold mb-1 text-gray-800">Room Number</label>
                <input 
                  type="text" 
                  required 
                  value={newRoomData.room_number}
                  onChange={e => setNewRoomData({...newRoomData, room_number: e.target.value})}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-[14px] font-medium outline-none focus:border-blue-500"
                  placeholder="e.g. 101"
                />
              </div>
              <div>
                <label className="block text-[13px] font-bold mb-1 text-gray-800">Room Type</label>
                <select 
                  value={newRoomData.room_type}
                  onChange={e => setNewRoomData({...newRoomData, room_type: e.target.value})}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-[14px] font-medium outline-none focus:border-blue-500"
                >
                  <option value="1BHK">1BHK</option>
                  <option value="2BHK">2BHK</option>
                  <option value="3BHK">3BHK</option>
                  <option value="Deluxe">Deluxe</option>
                  <option value="Home Stay">Home Stay</option>
                  <option value="King Studio">King Studio</option>
                  <option value="Room">Room</option>
                  <option value="Standard">Standard</option>
                  <option value="Superior King">Superior King</option>
                  <option value="Villa">Villa</option>
                </select>
              </div>
              <div>
                <label className="block text-[13px] font-bold mb-1 text-gray-800">Status</label>
                <select 
                  value={newRoomData.status}
                  onChange={e => setNewRoomData({...newRoomData, status: e.target.value})}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-[14px] font-medium outline-none focus:border-blue-500"
                >
                  <option value="available">Available</option>
                  <option value="maintenance">Maintenance</option>
                </select>
              </div>
              <div className="flex justify-end gap-3 mt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 border border-gray-200 rounded-lg text-[13px] font-bold text-gray-600 hover:bg-gray-50 transition-colors">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-[#2563EB] text-white rounded-lg text-[13px] font-bold hover:bg-blue-700 transition-colors shadow-sm">Create Room</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
