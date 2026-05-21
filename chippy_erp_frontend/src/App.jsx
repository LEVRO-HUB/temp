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
import GanttPage from './pages/GanttPage.jsx';
import CheckIn from './pages/CheckIn.jsx';
import CheckOut from './pages/CheckOut.jsx';
import BookingReports from './pages/BookingReports.jsx';
import { PermissionProvider } from './contexts/PermissionContext.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';

const AuthGuard = ({ children }) => {
  const navigate = useNavigate();
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) navigate('/login');
  }, [navigate]);
  return children;
};

// Helper so each route self-documents its required module key
const P = ({ k, children }) => <ProtectedRoute moduleKey={k}>{children}</ProtectedRoute>;

export default function App() {
  return (
    <BrowserRouter>
      <PermissionProvider>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route path="/" element={<AuthGuard><DashboardLayout /></AuthGuard>}>
            <Route index element={<Navigate to="/dashboard" replace />} />

            <Route path="dashboard"        element={<P k="dashboard">        <Dashboard />             </P>} />
            <Route path="sites"            element={<P k="zones">             <ZoneSiteManagement />    </P>} />
            <Route path="rooms"            element={<P k="rooms">             <RoomManagement />        </P>} />
            <Route path="enquiries"        element={<P k="enquiries">         <SalesEnquiry />          </P>} />
            <Route path="bookings"         element={<P k="bookings">          <SalesBooking />          </P>} />
            <Route path="booking-calendar" element={<P k="booking_calendar">  <GanttPage />             </P>} />
            <Route path="booking-reports"  element={<P k="booking_reports">   <BookingReports />        </P>} />
            <Route path="check-in/:bookingId"  element={<P k="bookings">      <CheckIn />               </P>} />
            <Route path="check-out/:bookingId" element={<P k="bookings">      <CheckOut />              </P>} />
            <Route path="payments"         element={<P k="payments">          <PaymentModule />         </P>} />

            <Route path="purchase-orders">
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard"  element={<P k="pos"><PurchaseOrderManagement tab="dashboard" /></P>} />
              <Route path="list"       element={<P k="pos"><PurchaseOrderManagement tab="po-list"   /></P>} />
              <Route path="approvals"  element={<P k="pos"><PurchaseOrderManagement tab="approval"  /></P>} />
              <Route path="vendors"    element={<P k="pos"><PurchaseOrderManagement tab="vendors"   /></P>} />
              <Route path="audit"      element={<P k="pos"><PurchaseOrderManagement tab="budget"    /></P>} />
            </Route>

            <Route path="employees"              element={<P k="employees"><EmployeeManagement /></P>} />
            <Route path="rbac"                   element={<P k="rbac">     <ScreenRights />      </P>} />
            <Route path="rbac/permissions/:roleId" element={<P k="rbac">   <ModuleRights />      </P>} />
            <Route path="profile"                element={<P k="profile">  <ProfileSettings />   </P>} />
          </Route>
        </Routes>
      </PermissionProvider>
    </BrowserRouter>
  );
}
