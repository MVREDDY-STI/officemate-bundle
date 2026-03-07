import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import PageLoader from './components/PageLoader';

const Landing = lazy(() => import('./pages/Landing'));
const SignIn = lazy(() => import('./pages/SignIn'));
const DashboardLayout = lazy(() => import('./layouts/DashboardLayout'));
const Home = lazy(() => import('./pages/Home'));
const BookMeetingRoom = lazy(() => import('./pages/BookMeetingRoom'));
const YourBookings = lazy(() => import('./pages/YourBookings'));
const OfficeAssets = lazy(() => import('./pages/OfficeAssets'));
const AboutUs = lazy(() => import('./pages/AboutUs'));
const Events = lazy(() => import('./pages/Events'));
const ServiceStore = lazy(() => import('./pages/ServiceStore'));
const Support = lazy(() => import('./pages/Support'));
const ManageGuests = lazy(() => import('./pages/ManageGuests'));

function App() {
  return (
    <AuthProvider>
      <Toaster
        position="bottom-right"
        toastOptions={{
          duration: 2500,
          style: {
            background: '#1A1A1A',
            color: '#fff',
            fontSize: '0.8125rem',
            fontFamily: 'Inter, sans-serif',
            borderRadius: '6px',
            padding: '0.6rem 1rem',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          },
          success: {
            iconTheme: { primary: '#fff', secondary: '#1A1A1A' },
          },
          error: {
            iconTheme: { primary: '#fff', secondary: '#DC2626' },
            style: {
              background: '#DC2626',
              color: '#fff',
              fontSize: '0.8125rem',
              fontFamily: 'Inter, sans-serif',
              borderRadius: '6px',
              padding: '0.6rem 1rem',
            },
          },
        }}
      />
      <Router>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<SignIn />} />

            <Route path="/dashboard" element={<DashboardLayout />}>
              <Route index element={<Home />} />
              <Route path="book-room" element={<BookMeetingRoom />} />
              <Route path="bookings" element={<YourBookings />} />
              <Route path="assets" element={<OfficeAssets />} />
              <Route path="about" element={<AboutUs />} />
              <Route path="events" element={<Events />} />
              <Route path="service" element={<ServiceStore />} />
              <Route path="support" element={<Support />} />
              <Route path="guests" element={<ManageGuests />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </Router>
    </AuthProvider>
  );
}

export default App;
