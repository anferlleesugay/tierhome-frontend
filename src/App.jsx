import { Routes, Route, useLocation, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";

// Layout
import MainLayout from "./layouts/MainLayout";

// Pages
import Welcome from "./pages/Welcome";
import Browse from "./pages/Browse";
import Verify from "./pages/Verify";
import ListingDetail from "./pages/ListingDetail";

// Modal pages
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import Profile from "./pages/Profile";
import LandlordProfile from "./pages/LandlordProfile";
import ResetPassword from "./pages/ResetPassword";

// Tenant
import TenantDashboard from "./pages/TenantDashboard";
import Ranking from "./pages/Ranking";
import MapSearch from "./pages/MapSearch";
import SavedListings from "./pages/SavedListings";
import Messages from "./pages/Messages";
import Reservations from "./pages/Reservations";

// Landlord
import LandlordListings from "./pages/LandlordListings";
import LandlordReservations from "./pages/LandlordReservations";
import LandlordMessages from "./pages/LandlordMessages";
import LandlordAnalytics from "./pages/LandlordAnalytics";
import LandlordDashboard from "./pages/LandlordDashboard";
import LandlordReports from "./pages/LandlordReports";
import LandlordMaintenance from "./pages/LandlordMaintenance";
import LandlordLayout from "./layouts/LandlordLayout";
import ListingAnalytics from "./pages/ListingAnalytics";
import AdminListingsSummary from "./pages/AdminListingsSummary";

// Admin
import AdminVerification from "./pages/AdminVerification";
import AdminListings from "./pages/AdminListings";
import AdminAnalytics from "./pages/AdminAnalytics";
import AdminAmenityRequests from "./pages/AdminAmenityRequests";
import AdminLandlords from "./pages/AdminLandlords";
import AdminLandlordDetail from "./pages/AdminLandlordDetail";
import AdminDeactivationRequests from "./pages/AdminDeactivationRequests";
import AdminUserManagement from "./pages/AdminUserManagement";

function AdminOnly({ children }) {
  const { isLoggedIn, role, loading } = useAuth();
  if (loading) return null;
  if (!isLoggedIn) return <Navigate to="/login" replace />;
  if (role !== "admin") return <Navigate to="/" replace />;
  return children;
}

function TenantOnly({ children }) {
  const { isLoggedIn, role, loading } = useAuth();
  if (loading) return null;
  if (!isLoggedIn) return <Navigate to="/login" replace />;
  if (role !== "tenant") return <Navigate to="/" replace />;
  return children;
}

function LandlordOnly({ children }) {
  const { isLoggedIn, role, loading, user } = useAuth();
  if (loading) return null;
  if (!isLoggedIn) return <Navigate to="/login" replace />;
  if (role !== "landlord") return <Navigate to="/" replace />;
  if (user?.verification_status !== "verified") return <Navigate to="/verify" replace />;
  return children;
}

function LandlordVerifyOnly({ children }) {
  const { isLoggedIn, role, loading } = useAuth();
  if (loading) return null;
  if (!isLoggedIn) return <Navigate to="/login" replace />;
  if (role !== "landlord") return <Navigate to="/" replace />;
  return children;
}

function App() {
  const location = useLocation();
  const background = location.state?.background;

  const { isLoggedIn, role, loading, user } = useAuth();

  if (loading) return null;

  const redirectHome = () => {
    if (!isLoggedIn) return <Welcome />;
    if (role === "landlord") return <Navigate to="/landlord/analytics" replace />;
    if (role === "admin") return <Navigate to="/admin/analytics" replace />;
    return <Navigate to="/browse" replace />;
  };

  const protectBrowse = () => {
    if (isLoggedIn && role === "landlord") return <Navigate to="/landlord/analytics" replace />;
    if (isLoggedIn && role === "admin") return <Navigate to="/admin/analytics" replace />;
    return <Browse />;
  };

  const protectListing = () => {
    const isPreview = new URLSearchParams(location.search).get("preview") === "1";
    if (!isPreview && role === "landlord") return <Navigate to="/landlord/analytics" replace />;
    if (!isPreview && role === "admin") return <Navigate to="/admin/analytics" replace />;
    return <ListingDetail />;
  };

  const protectVerify = () => {
    if (role === "landlord") return <LandlordVerifyOnly><Verify /></LandlordVerifyOnly>;
    if (role === "admin") return <Navigate to="/admin/analytics" replace />;
    return <Verify />;
  };

  const protectProfile = () => {
    if (role === "landlord") return <Navigate to={`/landlord-profile/${user?.id}`} replace />;
    if (role === "admin") return <AdminOnly><Profile /></AdminOnly>;
    return <TenantOnly><Profile /></TenantOnly>;
  };

  return (
    <>
      <Routes location={background || location}>
        <Route element={<MainLayout />}>

          {/* HOME */}
          <Route path="/" element={redirectHome()} />

          {/* BROWSE — guests and tenants only */}
          <Route path="/browse" element={protectBrowse()} />

          {/* LISTING DETAIL — guests and tenants only */}
          <Route path="/listing/:id" element={protectListing()} />

          {/* VERIFY — tenants and landlords only */}
          <Route path="/verify" element={protectVerify()} />

          {/* PROFILE — role aware */}
          <Route path="/profile" element={protectProfile()} />

          {/* LANDLORD PROFILE — public */}
          <Route path="/landlord-profile/:id" element={<LandlordProfile />} />

          {/* TENANT ROUTES */}
          <Route path="/tenant/dashboard" element={<TenantOnly><TenantDashboard /></TenantOnly>} />
          <Route path="/tenant/ranking" element={<TenantOnly><Ranking /></TenantOnly>} />
          <Route path="/tenant/map" element={<TenantOnly><MapSearch /></TenantOnly>} />
          <Route path="/tenant/saved" element={<TenantOnly><SavedListings /></TenantOnly>} />
          <Route path="/tenant/messages" element={<TenantOnly><Messages /></TenantOnly>} />
          <Route path="/tenant/reservations" element={<TenantOnly><Reservations /></TenantOnly>} />

          {/* LANDLORD ROUTES — verified landlords only */}
          {/* "Dashboard" now folds into Analytics — old links/bookmarks still work via redirect */}
          <Route path="/landlord/dashboard" element={<Navigate to="/landlord/analytics" replace />} />
          <Route path="/landlord/listings" element={
            <LandlordOnly><LandlordLayout><LandlordListings /></LandlordLayout></LandlordOnly>
          } />
          <Route path="/landlord/reservations" element={
            <LandlordOnly><LandlordLayout><LandlordReservations /></LandlordLayout></LandlordOnly>
          } />
          <Route path="/landlord/messages" element={
            <LandlordOnly><LandlordLayout><LandlordMessages /></LandlordLayout></LandlordOnly>
          } />
          <Route path="/landlord/analytics" element={<LandlordVerifyOnly><LandlordLayout><LandlordDashboard /></LandlordLayout></LandlordVerifyOnly>} />
          <Route path="/landlord/data-analytics" element={<LandlordVerifyOnly><LandlordLayout><LandlordAnalytics /></LandlordLayout></LandlordVerifyOnly>} />
          <Route path="/landlord/reports" element={<LandlordVerifyOnly><LandlordLayout><LandlordReports /></LandlordLayout></LandlordVerifyOnly>} />
          <Route path="/landlord/maintenance" element={<LandlordOnly><LandlordLayout><LandlordMaintenance /></LandlordLayout></LandlordOnly>} />
          <Route path="/landlord/listings/:id/analytics" element={<LandlordOnly><LandlordLayout><ListingAnalytics /></LandlordLayout></LandlordOnly>} />
          

          {/* ADMIN ROUTES */}
          {/* "Dashboard" now folds into Analytics — old links/bookmarks still work via redirect */}
          <Route path="/admin/dashboard"    element={<Navigate to="/admin/analytics" replace />} />
          <Route path="/admin/verification" element={<AdminOnly><AdminVerification /></AdminOnly>} />
          <Route path="/admin/listings"     element={<AdminOnly><AdminListings /></AdminOnly>} />
          <Route path="/admin/analytics"    element={<AdminOnly><AdminAnalytics /></AdminOnly>} />
          <Route path="/admin/amenities"    element={<AdminOnly><AdminAmenityRequests /></AdminOnly>} />
          <Route path="/admin/landlords"      element={<AdminOnly><AdminLandlords /></AdminOnly>} />
          <Route path="/admin/landlords/:id"  element={<AdminOnly><AdminLandlordDetail /></AdminOnly>} />
          <Route path="/admin/listings/:id/analytics" element={<AdminOnly><ListingAnalytics /></AdminOnly>} />
          <Route path="/admin/listings-summary" element={<AdminOnly><AdminListingsSummary /></AdminOnly>} />
          <Route path="/admin/deactivation-requests" element={<AdminOnly><AdminDeactivationRequests /></AdminOnly>} />
          <Route path="/admin/users"          element={<AdminOnly><AdminUserManagement /></AdminOnly>} />
        </Route>

        {/* PUBLIC ROUTES */}
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        {!background && (
          <>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
          </>
        )}
      </Routes>

      {background && (
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Routes>
      )}
    </>
  );
}

export default App;