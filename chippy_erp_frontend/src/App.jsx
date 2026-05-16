import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import DashboardLayout from './layouts/DashboardLayout.jsx';
import Login from './pages/Login.jsx';
import Dashboard from './pages/Dashboard.jsx';
import ZoneSiteManagement from './pages/ZoneSiteManagement.jsx';
import RoomManagement from './pages/RoomManagement.jsx';
import SalesEnquiry from './pages/SalesEnquiry.jsx';
import SalesBooking from './pages/SalesBooking.jsx';
import PaymentModule from './pages/PaymentModule.jsx';
import EmployeeManagement from './pages/EmployeeManagement.jsx';
import PurchaseOrderManagement from './pages/PurchaseOrderManagement.jsx';
import ProfileSettings from './pages/ProfileSettings.jsx';
import ScreenRights from './pages/ScreenRights.jsx';
import ModuleRights from './pages/ModuleRights.jsx';

// Simple mockup pages for now
const ErrorPage = () => <div className="text-center p-12 text-gray-500">Feature disabled or incomplete.</div>;

const AuthGuard = ({ children }) => {
  const navigate = useNavigate();
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) navigate('/login');
  }, [navigate]);
  return children;
};

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        <Route path="/" element={<AuthGuard><DashboardLayout /></AuthGuard>}>
           <Route index element={<Navigate to="/dashboard" replace />} />
           <Route path="dashboard" element={<Dashboard />} />
           <Route path="sites" element={<ZoneSiteManagement />} />
           <Route path="rooms" element={<RoomManagement />} />
           <Route path="enquiries" element={<SalesEnquiry />} />
           <Route path="bookings" element={<SalesBooking />} />
           <Route path="payments" element={<PaymentModule />} />
           
           <Route path="purchase-orders">
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<PurchaseOrderManagement tab="dashboard" />} />
              <Route path="list" element={<PurchaseOrderManagement tab="po-list" />} />
              <Route path="approvals" element={<PurchaseOrderManagement tab="approval" />} />
              <Route path="vendors" element={<PurchaseOrderManagement tab="vendors" />} />
              <Route path="audit" element={<PurchaseOrderManagement tab="budget" />} />
           </Route>

           <Route path="employees" element={<EmployeeManagement />} />
           <Route path="rbac" element={<ScreenRights />} />
           <Route path="rbac/permissions/:roleId" element={<ModuleRights />} />
           <Route path="profile" element={<ProfileSettings />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
