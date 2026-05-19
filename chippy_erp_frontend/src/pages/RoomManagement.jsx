import React, { useState, useEffect } from 'react';
import { Plus, Download, FileText, Calendar, MapPin, ArrowLeft, Search } from 'lucide-react';
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
  const [filterStatus, setFilterStatus] = useState('All Status');
  const [searchTerm, setSearchTerm] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newRoomData, setNewRoomData] = useState({
    site_id: '',
    room_number: '',
    room_type: 'Standard',
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
                 site_id: location.state.prefilledSiteId,
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

  const handleOpenModal = () => {
    const defaultSiteId = activeSiteId && activeSiteId !== 'All Sites' ? activeSiteId : (sites[0]?.id || '');
    const site = sites.find(s => s.id == defaultSiteId);
    const defaultRoomType = site?.site_type === 'service_apartment' ? '1BHK' : 'Standard';
    setNewRoomData({
      site_id: defaultSiteId,
      room_number: '',
      room_type: defaultRoomType,
      status: 'available'
    });
    setSubmitError('');
    setIsModalOpen(true);
  };

  const handleCreateRoom = async (e) => {
    e.preventDefault();
    setSubmitError('');
    if (!newRoomData.site_id) {
      setSubmitError('Please select a site');
      return;
    }
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/api/rooms`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + token
        },
        body: JSON.stringify({
          site_id: parseInt(newRoomData.site_id),
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

  // Compute filtered rooms list
  const filteredRooms = rooms.filter(room => {
    // 1. Zone filter
    if (activeZoneId) {
      if (room.site?.zone_id != activeZoneId) return false;
    }
    // 2. Site filter
    if (activeSiteId) {
      if (room.site_id != activeSiteId) return false;
    }

    // Determine room booking status for overlap check
    const overlappingBooking = bookings.find(b => {
      if (b.room_id !== room.id) return false;
      const cIn = new Date(b.check_in_date); cIn.setHours(0,0,0,0);
      const cOut = new Date(b.check_out_date); cOut.setHours(0,0,0,0);
      return today >= cIn && today < cOut;
    });

    const isMaintenance = room.status === 'maintenance';
    const computedStatus = overlappingBooking ? 'occupied' : (isMaintenance ? 'maintenance' : 'available');

    // 3. Status filter
    if (filterStatus && filterStatus !== 'All Status') {
      if (computedStatus !== filterStatus.toLowerCase()) return false;
    }

    // 4. Search term
    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      const numMatch = room.room_number.toLowerCase().includes(lower);
      const typeMatch = room.room_type.toLowerCase().includes(lower);
      const guestMatch = overlappingBooking?.guest_name?.toLowerCase().includes(lower);
      const siteMatch = room.site?.site_name?.toLowerCase().includes(lower);
      if (!numMatch && !typeMatch && !guestMatch && !siteMatch) return false;
    }

    return true;
  });

  // Group rooms by site
  const roomsBySite = {};
  filteredRooms.forEach(room => {
    const siteId = room.site_id;
    if (!roomsBySite[siteId]) {
      roomsBySite[siteId] = {
        siteName: room.site?.site_name || 'Unassigned Site',
        rooms: []
      };
    }
    roomsBySite[siteId].rooms.push(room);
  });

  // Sort rooms naturally by room number in each site group
  Object.values(roomsBySite).forEach(group => {
    group.rooms.sort((a, b) => a.room_number.localeCompare(b.room_number, undefined, { numeric: true, sensitivity: 'base' }));
  });

  // Sort site groups by site name
  const sortedSiteGroups = Object.values(roomsBySite).sort((a, b) => a.siteName.localeCompare(b.siteName));

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto p-4 md:p-0">
      
      {/* Page Header */}
      <div className="flex justify-between items-center pb-4 border-b border-[#E5E7EB]">
        <h1 className="text-xl md:text-2xl font-bold text-gray-900 leading-tight">Rooms Management</h1>
        <button onClick={handleOpenModal} className="bg-[#1A56DB] text-white px-3 py-1.5 md:px-4 md:py-2 rounded-lg font-medium text-xs md:text-sm flex items-center gap-1.5 hover:bg-blue-700 transition-colors shadow-sm">
          <Plus size={16} /> Add Room
        </button>
      </div>

      {/* Filters Section */}
      <div className="bg-white border border-[#E5E7EB] rounded-[12px] shadow-sm flex flex-col">
        <div className="p-4 border-b border-[#E5E7EB] bg-gray-50/50 rounded-t-[12px] space-y-4">
          <div className="flex flex-col md:flex-row md:flex-wrap md:items-center gap-3">
            {/* Search Input */}
            <div className="relative w-full md:w-56 shrink-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input 
                type="text" 
                placeholder="Search room number, type..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-[#F8FAFC] border border-[#E5E7EB] rounded-lg text-sm text-gray-700 outline-none focus:border-[#2563EB]"
              />
            </div>

            {/* Zone Filter */}
            <select 
              value={activeZoneId || 'All Zones'} 
              onChange={e => {
                const val = e.target.value;
                setActiveZoneId(val === 'All Zones' ? '' : val);
                setActiveSiteId(''); // Reset site selection when zone changes
              }} 
              className="w-full md:w-44 px-3 py-2 bg-white border border-[#E5E7EB] rounded-lg text-[13px] text-gray-700 font-medium outline-none"
            >
              <option value="All Zones">All Zones</option>
              {zones.map(z => <option key={z.id} value={z.id}>{z.zone_name}</option>)}
            </select>

            {/* Site Filter */}
            <select 
              value={activeSiteId || 'All Sites'} 
              onChange={e => {
                const val = e.target.value;
                setActiveSiteId(val === 'All Sites' ? '' : val);
              }} 
              className="w-full md:w-48 px-3 py-2 bg-white border border-[#E5E7EB] rounded-lg text-[13px] text-gray-700 font-medium outline-none"
            >
              <option value="All Sites">All Sites</option>
              {sites
                .filter(s => !activeZoneId || s.zone_id == activeZoneId)
                .map(s => <option key={s.id} value={s.id}>{s.site_name}</option>)
              }
            </select>

            {/* Status Filter */}
            <select 
              value={filterStatus} 
              onChange={e => setFilterStatus(e.target.value)} 
              className="w-full md:w-36 px-3 py-2 bg-white border border-[#E5E7EB] rounded-lg text-[13px] text-gray-700 font-medium outline-none"
            >
              <option value="All Status">All Status</option>
              <option value="Available">Available</option>
              <option value="Occupied">Occupied</option>
              <option value="Maintenance">Maintenance</option>
            </select>

            {/* Reset Button */}
            <button 
              onClick={() => {
                setActiveZoneId('');
                setActiveSiteId('');
                setFilterStatus('All Status');
                setSearchTerm('');
              }} 
              className="w-full md:w-auto px-4 py-2 text-[#2563EB] border border-[#BFDBFE] bg-white hover:bg-blue-50 rounded-lg text-[13px] font-bold transition-colors shadow-sm whitespace-nowrap"
            >
              Reset
            </button>
          </div>
        </div>

        {/* Room Grid View */}
        <div className="p-6 bg-gray-50/30 rounded-b-[12px] space-y-8">
          {loading ? (
            <div className="py-20 text-center font-bold text-gray-400">Loading rooms snapshot...</div>
          ) : sortedSiteGroups.length === 0 ? (
            <div className="py-20 text-center text-gray-500 font-medium">No matching rooms found.</div>
          ) : (
            sortedSiteGroups.map(siteGroup => (
              <div key={siteGroup.siteName} className="border-b border-gray-100 last:border-0 pb-6 last:pb-0">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-1 h-5 bg-[#2563EB] rounded-full"></div>
                  <h2 className="text-md font-bold text-gray-800">{siteGroup.siteName}</h2>
                  <span className="text-[11px] font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                    {siteGroup.rooms.length} {siteGroup.rooms.length === 1 ? 'Room' : 'Rooms'}
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                  {siteGroup.rooms.map(room => {
                    const isMaintenance = room.status === 'maintenance';
                    const overlappingBooking = bookings.find(b => {
                      if (b.room_id !== room.id) return false;
                      const cIn = new Date(b.check_in_date); cIn.setHours(0,0,0,0);
                      const cOut = new Date(b.check_out_date); cOut.setHours(0,0,0,0);
                      return today >= cIn && today < cOut; 
                    });

                    let bgClass = "bg-emerald-50/50 border-emerald-100 hover:bg-emerald-100/50";
                    let titleClass = "text-emerald-800";
                    let statusClass = "bg-emerald-100 text-emerald-800";
                    let statusText = "Available";

                    if (overlappingBooking) {
                      bgClass = "bg-rose-50/50 border-rose-100 hover:bg-rose-100/50";
                      titleClass = "text-rose-800";
                      statusClass = "bg-rose-100 text-rose-800";
                      statusText = "Occupied";
                    } else if (isMaintenance) {
                      bgClass = "bg-amber-50/50 border-amber-100 hover:bg-amber-100/50";
                      titleClass = "text-amber-800";
                      statusClass = "bg-amber-100 text-amber-800";
                      statusText = "Maintenance";
                    }

                    return (
                  <div 
                    key={room.id} 
                    onClick={() => {
                      if (!overlappingBooking && !isMaintenance) {
                        navigate('/bookings', { state: { autoOpenCreate: true, prefilledSiteId: room.site_id, prefilledRoomId: room.id } });
                      }
                    }} 
                    className={`relative border rounded-xl p-4 flex flex-col justify-between h-[130px] cursor-pointer transition-all duration-200 hover:-translate-y-0.5 shadow-sm ${bgClass}`}
                  >
                    <div>
                      <div className="flex justify-between items-start">
                        <h4 className={`font-extrabold text-[15px] tracking-tight ${titleClass}`}>
                          {room.room_number.toUpperCase()}
                        </h4>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${statusClass}`}>
                          {statusText}
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-500 font-semibold mt-1 capitalize">{room.room_type.replace('_',' ')}</p>
                    </div>

                    {overlappingBooking ? (
                      <div className="mt-3 pt-2 border-t border-gray-100 flex items-center gap-1.5 text-rose-700">
                        <FileText size={10} className="shrink-0" />
                        <span className="text-[9px] font-bold truncate">
                          {overlappingBooking.guest_name}
                        </span>
                      </div>
                    ) : (
                      <div className="h-[14px]"></div>
                    )}
                  </div>
                );
              })}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-[16px] shadow-xl w-full max-w-md p-6">
            <h2 className="text-[20px] font-extrabold mb-4 text-gray-900">Add New Room</h2>
            {submitError && <div className="mb-4 text-[#EF4444] text-[13px] font-bold">{submitError}</div>}
            <form onSubmit={handleCreateRoom} className="flex flex-col gap-4">
              <div>
                <label className="block text-[13px] font-bold mb-1 text-gray-800">Site</label>
                <select 
                  required
                  value={newRoomData.site_id}
                  onChange={e => {
                    const site = sites.find(s => s.id == e.target.value);
                    const defaultRoomType = site?.site_type === 'service_apartment' ? '1BHK' : 'Standard';
                    setNewRoomData({...newRoomData, site_id: e.target.value, room_type: defaultRoomType});
                  }}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-[14px] font-medium outline-none focus:border-blue-500"
                >
                  <option value="">Select a Site</option>
                  {sites.map(s => <option key={s.id} value={s.id}>{s.site_name}</option>)}
                </select>
              </div>
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
