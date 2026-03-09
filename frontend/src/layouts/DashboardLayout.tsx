import { NavLink, useNavigate, Navigate, useLocation, useOutlet } from 'react-router-dom';
import { Bell, User, Menu, LogOut } from 'lucide-react';
import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import EditableField from '../components/EditableField';
import EditableImage from '../components/EditableImage';

const pageVariants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.22, ease: 'easeOut' } },
  exit:    { opacity: 0, y: -6, transition: { duration: 0.16, ease: 'easeIn' } },
};

export default function DashboardLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const currentOutlet = useOutlet();
  const { user, logout, isAdmin } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  if (!user) return <Navigate to="/login" replace />;

  const navItems = [
    { label: 'Home',               path: '/dashboard' },
    { label: 'Book a Meeting Room', path: '/dashboard/book-room' },
    { label: 'Your Bookings',       path: '/dashboard/bookings' },
    { label: 'Events',              path: '/dashboard/events' },
    { label: 'Support',             path: '/dashboard/support' },
    { label: 'Manage guests',       path: '/dashboard/guests' },
    { label: 'About Us',            path: '/dashboard/about' },
    ...(isAdmin ? [
      { label: 'TV Setup',        path: '/dashboard/tv-setup' },
      { label: 'User Management', path: '/dashboard/users' },
    ] : []),
  ];

  const handleLogout = () => {
    logout();
    toast('Logged out successfully', { icon: '👋' });
    navigate('/login');
  };

  return (
    <div className="screen-wrapper">
      {/* Top Header */}
      <header className="top-nav">
        <div style={{ cursor: 'pointer' }} onClick={() => navigate('/dashboard')}>
          <EditableImage
            storageKey="header.logo"
            defaultSrc="/solum_officemate_logo.svg"
            alt="SOLUM Officemate"
            style={{ height: '38px', width: 'auto', display: 'block' }}
          />
        </div>

        <div className="d-flex align-center gap-3">
          <button className="btn btn-outline" style={{ padding: '0.5rem', border: 'none' }}>
            <Bell size={20} />
          </button>

          <div className="d-flex align-center gap-2">
            <div style={{
              width: '32px', height: '32px', borderRadius: '50%',
              backgroundColor: isAdmin ? '#0066FF' : '#1A1A1A',
              color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              <User size={16} />
            </div>
            <div style={{ lineHeight: 1.25 }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 500 }}>{user.name}</div>
              {isAdmin && (
                <div style={{ fontSize: '0.6rem', color: '#0066FF', fontWeight: 700, letterSpacing: '0.6px' }}>ADMIN</div>
              )}
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="btn btn-outline"
            style={{ padding: '0.5rem', border: 'none' }}
            title="Logout"
          >
            <LogOut size={18} />
          </button>

          <button
            className="mobile-nav-toggle btn btn-outline"
            style={{ padding: '0.5rem', border: 'none' }}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <Menu size={24} />
          </button>
        </div>
      </header>

      {/* Sub Navigation — sticky below the top header */}
      <div className={`sub-nav ${mobileMenuOpen ? '' : 'hide-on-mobile'}`} style={{ overflowX: 'auto', position: 'sticky', top: 0, zIndex: 90, backgroundColor: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/dashboard'}
            className={({ isActive }) => `sub-nav-item ${isActive ? 'active' : ''}`}
          >
            {item.label}
          </NavLink>
        ))}
      </div>

      {/* Admin bar */}
      {isAdmin && (
        <div style={{
          backgroundColor: '#FFFBEB',
          borderBottom: '1px solid #FCD34D',
          padding: '0.4rem 2rem',
          fontSize: '0.75rem',
          color: '#92400E',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
        }}>
          <span>⚙️</span>
          <span>
            <strong>Admin Mode</strong> — Click any{' '}
            <span style={{ textDecoration: 'underline', textDecorationStyle: 'dashed', textDecorationColor: 'rgba(0,102,255,0.6)' }}>
              underlined
            </span>{' '}
            text to edit. Changes save automatically on blur. 📷 to change images.
          </span>
        </div>
      )}

      {/* Animated page content */}
      <main style={{ flex: 1, backgroundColor: '#FAFAFA', paddingBottom: '4rem' }}>
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={location.pathname}
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
          >
            {currentOutlet}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer style={{ padding: '4rem 3rem 2rem', backgroundColor: '#fff', fontSize: '0.875rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', maxWidth: '1400px', margin: '0 auto' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div>
              <EditableField tag="h4" storageKey="footer.hq.title" defaultValue="SOLUM Group HQ"
                style={{ marginBottom: '0.25rem', fontWeight: 'bold', color: '#111', fontSize: '0.875rem' }} />
              <EditableField tag="p" storageKey="footer.hq.address" defaultValue={"357 Guseong-ro, Yongin-si\nGyeonggi-do 16914"}
                style={{ color: '#444', lineHeight: '1.5', fontSize: '0.875rem', whiteSpace: 'pre-line' }} />
            </div>
            <div>
              <EditableField tag="h4" storageKey="footer.sales.title" defaultValue="Sales and Marketing"
                style={{ marginBottom: '0.25rem', fontWeight: 'bold', color: '#111', fontSize: '0.875rem' }} />
              <EditableField tag="p" storageKey="footer.sales.contact" defaultValue={"+82 1588 0502\nesl@solu-m.com"}
                style={{ color: '#444', lineHeight: '1.5', fontSize: '0.875rem', whiteSpace: 'pre-line' }} />
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
            <EditableImage
              storageKey="footer.logo"
              defaultSrc="/solum_ftr_logo.svg"
              alt="SOLUM"
              style={{ height: '22px', width: 'auto', display: 'block', marginBottom: '3rem' }}
            />
            <div style={{ textAlign: 'right' }}>
              <div style={{ display: 'flex', gap: '2rem', justifyContent: 'flex-end', marginBottom: '1rem', color: '#111', fontSize: '0.875rem' }}>
                <span style={{ cursor: 'pointer' }}>Privacy</span>
                <span style={{ cursor: 'pointer' }}>Terms</span>
                <span style={{ cursor: 'pointer' }}>Cookies</span>
                <span style={{ cursor: 'pointer' }}>Accessibility</span>
              </div>
              <EditableField tag="p" storageKey="footer.copyright"
                defaultValue="대표이사 : 전성호 사업자등록번호 : 490-81-00105 Copyright © 2024 SOLUM. All rights reserved."
                style={{ color: '#888', fontSize: '0.75rem' }} />
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
