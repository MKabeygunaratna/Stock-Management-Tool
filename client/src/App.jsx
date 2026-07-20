import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { ThemeProvider } from './context/ThemeContext';
import ProtectedRoute from './components/ProtectedRoute';
import AppLayout from './components/Layout/AppLayout';

import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import StockIn from './pages/StockIn';
import StockOut from './pages/StockOut';
import StockHistory from './pages/StockHistory';
import Invoices from './pages/Invoices';
import Purchases from './pages/Purchases';
import Customers from './pages/Customers';
import Suppliers from './pages/Suppliers';
import Brands from './pages/Brands';
import Categories from './pages/Categories';
import Users from './pages/Users';
import LoginHistory from './pages/LoginHistory';
import AccountsOverview from './pages/accounts/AccountsOverview';
import OverduePayments from './pages/accounts/OverduePayments';
import ReceivablesPayables from './pages/accounts/ReceivablesPayables';
import InvoiceProfitLoss from './pages/accounts/InvoiceProfitLoss';

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <ToastProvider>
          <AuthProvider>
            <Routes>
              <Route path="/login" element={<Login />} />

              <Route element={<ProtectedRoute />}>
                <Route element={<AppLayout />}>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/products" element={<Products />} />
                  <Route path="/stock-in" element={<StockIn />} />
                  <Route path="/stock-out" element={<StockOut />} />
                  <Route path="/stock-history" element={<StockHistory />} />
                  <Route path="/invoices" element={<Invoices />} />
                  <Route path="/purchases" element={<Purchases />} />
                  <Route path="/customers" element={<Customers />} />
                  <Route path="/suppliers" element={<Suppliers />} />

                  <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
                    <Route path="/brands" element={<Brands />} />
                    <Route path="/categories" element={<Categories />} />
                    <Route path="/users" element={<Users />} />
                    <Route path="/login-history" element={<LoginHistory />} />
                    <Route path="/accounts" element={<AccountsOverview />} />
                    <Route path="/accounts/overdue" element={<OverduePayments />} />
                    <Route path="/accounts/outstanding" element={<ReceivablesPayables />} />
                    <Route path="/accounts/invoices" element={<InvoiceProfitLoss />} />
                  </Route>
                </Route>
              </Route>
            </Routes>
          </AuthProvider>
        </ToastProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
}
