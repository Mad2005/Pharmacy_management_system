
import React, { useState } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { DatabaseProvider } from './store/database';
import Layout from './components/Layout';

// Auth Pages
import AdminLogin from './pages/auth/AdminLogin';
import PharmacistLogin from './pages/auth/PharmacistLogin';
import StaffLogin from './pages/auth/StaffLogin';
import CustomerLogin from './pages/auth/CustomerLogin';
import CustomerRegister from './pages/auth/CustomerRegister';
import ForgotPassword from './pages/auth/ForgotPassword';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import UserManagement from './pages/admin/UserManagement';
import MedicineManagement from './pages/admin/MedicineManagement';
import InventoryManagement from './pages/admin/InventoryManagement';
import SupplierManagement from './pages/admin/SupplierManagement';
import Reports from './pages/admin/Reports';

// Pharmacist/Staff Pages
import PharmacistDashboard from './pages/pharmacist/PharmacistDashboard';
import Billing from './pages/shared/Billing';
import PrescriptionManagement from './pages/pharmacist/PrescriptionManagement';
import RefillVerification from './pages/pharmacist/RefillVerification';
import StaffDashboard from './pages/staff/StaffDashboard';

// Shared Pages
import Profile from './pages/shared/Profile';
import BillingHistory from './pages/shared/BillingHistory';

// Customer Pages
import CustomerDashboard from './pages/customer/CustomerDashboard';
import CustomerOrders from './pages/customer/CustomerOrders';
import CustomerPrescriptions from './pages/customer/CustomerPrescriptions';
import RecurringFills from './pages/customer/RecurringFills';
import Settings from './pages/customer/Settings';
import CustomerShop from './pages/customer/CustomerShop';
import LandingPage from './pages/LandingPage';

import { UserRole, User } from './types';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('pharma_user');
    return saved ? JSON.parse(saved) : null;
  });

  const login = (user: User) => {
    setCurrentUser(user);
    localStorage.setItem('pharma_user', JSON.stringify(user));
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem('pharma_user');
  };

  const ProtectedRoute = ({ children, allowedRoles }: { children?: React.ReactNode, allowedRoles: UserRole[] }) => {
    if (!currentUser) {
      return <Navigate to="/" replace />;
    }
    if (!allowedRoles.includes(currentUser.role)) {
      return <Navigate to="/" replace />;
    }
    return <Layout user={currentUser!} onLogout={logout}>{children}</Layout>;
  };

  return (
    <DatabaseProvider>
      <HashRouter>
        <Routes>
          <Route path="/admin-login" element={<AdminLogin onLogin={login} />} />
          <Route path="/pharmacist-login" element={<PharmacistLogin onLogin={login} />} />
          <Route path="/staff-login" element={<StaffLogin onLogin={login} />} />
          <Route path="/customer-login" element={<CustomerLogin onLogin={login} />} />
          <Route path="/customer-register" element={<CustomerRegister />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />

          {/* Admin Routes */}
          <Route path="/admin/dashboard" element={<ProtectedRoute allowedRoles={[UserRole.ADMIN]}><AdminDashboard /></ProtectedRoute>} />
          <Route path="/admin/users" element={<ProtectedRoute allowedRoles={[UserRole.ADMIN]}><UserManagement /></ProtectedRoute>} />
          <Route path="/admin/medicines" element={<ProtectedRoute allowedRoles={[UserRole.ADMIN]}><MedicineManagement user={currentUser!} /></ProtectedRoute>} />
          <Route path="/admin/inventory" element={<ProtectedRoute allowedRoles={[UserRole.ADMIN]}><InventoryManagement user={currentUser!} /></ProtectedRoute>} />
          <Route path="/admin/suppliers" element={<ProtectedRoute allowedRoles={[UserRole.ADMIN]}><SupplierManagement /></ProtectedRoute>} />
          <Route path="/admin/reports" element={<ProtectedRoute allowedRoles={[UserRole.ADMIN]}><Reports /></ProtectedRoute>} />
          <Route path="/admin/billing" element={<ProtectedRoute allowedRoles={[UserRole.ADMIN]}><Billing user={currentUser!} /></ProtectedRoute>} />
          <Route path="/admin/billing-history" element={<ProtectedRoute allowedRoles={[UserRole.ADMIN]}><BillingHistory user={currentUser!} /></ProtectedRoute>} />
          <Route path="/admin/profile" element={<ProtectedRoute allowedRoles={[UserRole.ADMIN]}><Profile user={currentUser!} onUpdate={setCurrentUser} /></ProtectedRoute>} />

          {/* Pharmacist Routes */}
          <Route path="/pharmacist/dashboard" element={<ProtectedRoute allowedRoles={[UserRole.PHARMACIST]}><PharmacistDashboard /></ProtectedRoute>} />
          <Route path="/pharmacist/medicines" element={<ProtectedRoute allowedRoles={[UserRole.PHARMACIST]}><MedicineManagement user={currentUser!} /></ProtectedRoute>} />
          <Route path="/pharmacist/inventory" element={<ProtectedRoute allowedRoles={[UserRole.PHARMACIST]}><InventoryManagement user={currentUser!} /></ProtectedRoute>} />
          <Route path="/pharmacist/billing" element={<ProtectedRoute allowedRoles={[UserRole.PHARMACIST]}><Billing user={currentUser!} /></ProtectedRoute>} />
          <Route path="/pharmacist/billing-history" element={<ProtectedRoute allowedRoles={[UserRole.PHARMACIST]}><BillingHistory user={currentUser!} /></ProtectedRoute>} />
          <Route path="/pharmacist/prescriptions" element={<ProtectedRoute allowedRoles={[UserRole.PHARMACIST]}><PrescriptionManagement /></ProtectedRoute>} />
          <Route path="/pharmacist/refill-verification" element={<ProtectedRoute allowedRoles={[UserRole.PHARMACIST]}><RefillVerification /></ProtectedRoute>} />
          <Route path="/pharmacist/profile" element={<ProtectedRoute allowedRoles={[UserRole.PHARMACIST]}><Profile user={currentUser!} onUpdate={setCurrentUser} /></ProtectedRoute>} />

          {/* Staff Routes */}
          <Route path="/staff/dashboard" element={<ProtectedRoute allowedRoles={[UserRole.STAFF]}><StaffDashboard /></ProtectedRoute>} />
          <Route path="/staff/billing" element={<ProtectedRoute allowedRoles={[UserRole.STAFF]}><Billing user={currentUser!} /></ProtectedRoute>} />
          <Route path="/staff/billing-history" element={<ProtectedRoute allowedRoles={[UserRole.STAFF]}><BillingHistory user={currentUser!} /></ProtectedRoute>} />
          <Route path="/staff/medicines" element={<ProtectedRoute allowedRoles={[UserRole.STAFF]}><MedicineManagement user={currentUser!} /></ProtectedRoute>} />
          <Route path="/staff/inventory" element={<ProtectedRoute allowedRoles={[UserRole.STAFF]}><InventoryManagement user={currentUser!} /></ProtectedRoute>} />
          <Route path="/staff/profile" element={<ProtectedRoute allowedRoles={[UserRole.STAFF]}><Profile user={currentUser!} onUpdate={setCurrentUser} /></ProtectedRoute>} />

          {/* Customer Routes */}
          <Route path="/customer/dashboard" element={<ProtectedRoute allowedRoles={[UserRole.CUSTOMER]}><CustomerDashboard user={currentUser!} /></ProtectedRoute>} />
          <Route path="/customer/orders" element={<ProtectedRoute allowedRoles={[UserRole.CUSTOMER]}><CustomerOrders user={currentUser!} /></ProtectedRoute>} />
          <Route path="/customer/billing" element={<ProtectedRoute allowedRoles={[UserRole.CUSTOMER]}><CustomerShop user={currentUser!} /></ProtectedRoute>} />
          <Route path="/customer/recurring" element={<ProtectedRoute allowedRoles={[UserRole.CUSTOMER]}><RecurringFills user={currentUser!} /></ProtectedRoute>} />
          <Route path="/customer/prescriptions" element={<ProtectedRoute allowedRoles={[UserRole.CUSTOMER]}><CustomerPrescriptions user={currentUser!} /></ProtectedRoute>} />
          <Route path="/customer/profile" element={<ProtectedRoute allowedRoles={[UserRole.CUSTOMER]}><Profile user={currentUser!} onUpdate={setCurrentUser} /></ProtectedRoute>} />
          <Route path="/customer/settings" element={<ProtectedRoute allowedRoles={[UserRole.CUSTOMER]}><Settings user={currentUser!} onUpdate={setCurrentUser} /></ProtectedRoute>} />

          <Route path="/" element={
            currentUser ? (
              currentUser.role === UserRole.ADMIN ? <Navigate to="/admin/dashboard" /> :
              currentUser.role === UserRole.PHARMACIST ? <Navigate to="/pharmacist/dashboard" /> :
              currentUser.role === UserRole.STAFF ? <Navigate to="/staff/dashboard" /> :
              <Navigate to="/customer/dashboard" />
            ) : <LandingPage />
          } />
        </Routes>
      </HashRouter>
    </DatabaseProvider>
  );
};

export default App;
