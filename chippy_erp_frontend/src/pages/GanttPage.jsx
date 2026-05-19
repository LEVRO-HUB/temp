import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import BookingGantt from './BookingGantt';
import API_BASE_URL from '../config';

/**
 * GanttPage — fetches sites, then renders the BookingGantt component.
 * Sits at route /booking-calendar
 */
export default function GanttPage() {
  const navigate = useNavigate();
  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    fetch(`${API_BASE_URL}/api/locations/sites`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(data => {
        const list = Array.isArray(data) ? data : data.sites || [];
        setSites(list);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleCreateBooking = ({ room, check_in_date, site_id }) => {
    navigate('/bookings', {
      state: {
        autoOpenCreate: true,
        prefilledSiteId: site_id ? String(site_id) : '',
        prefilledRoomId: room?.id ? String(room.id) : '',
        prefilledCheckIn: check_in_date || '',
      },
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400 text-sm font-medium">
        Loading calendar…
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-80px)] flex flex-col space-y-4 p-4 md:p-0">
      {/* Page title strip */}
      <div className="flex items-center justify-between pb-4 border-b border-[#E5E7EB]">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900">Booking Calendar</h1>
          <p className="text-sm text-gray-500 mt-0.5">Gantt-style room availability — click a bar to manage, click empty cell to book</p>
        </div>
      </div>

      {/* Gantt chart fills remaining height */}
      <div className="flex-1 min-h-0">
        <BookingGantt sites={sites} onCreateBooking={handleCreateBooking} />
      </div>
    </div>
  );
}
