import React, { createContext, useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';
import API_BASE_URL from '../config';

export const PermissionContext = createContext({
  permissions: [],
  loading: true,
  refresh: () => {},
});

export function PermissionProvider({ children }) {
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading]         = useState(true);

  const fetchPermissions = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) { setPermissions([]); return; }

      const decoded = jwtDecode(token);
      const roleId  = decoded.roleId;
      if (!roleId)  { setPermissions([]); return; }

      const res = await fetch(`${API_BASE_URL}/api/permissions/${roleId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setPermissions(Array.isArray(data) ? data : []);
      } else {
        setPermissions([]);
      }
    } catch {
      setPermissions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPermissions();
    // Re-fetch when token changes (login / logout)
    const onStorage = (e) => { if (e.key === 'token') fetchPermissions(); };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  return (
    <PermissionContext.Provider value={{ permissions, loading, refresh: fetchPermissions }}>
      {children}
    </PermissionContext.Provider>
  );
}
