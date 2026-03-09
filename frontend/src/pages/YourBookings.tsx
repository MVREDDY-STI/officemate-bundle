import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { apiGet, apiPatch } from '../services/api';

const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.25, ease: 'easeOut' } },
};
const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } };

/* ── Types ─────────────────────────────────────────────────────── */
interface Booking {
  id: string;
  room_id: string;
  room_name: string;
  color?: string;
  user_id: string;
  booking_date: string;        // 'YYYY-MM-DD'
  start_slot: number;
  end_slot: number;
  title: string;
  status: 'confirmed' | 'cancelled';
  created_at: string;
}

interface BookingsResponse {
  data: Booking[];
  pagination: { page: number; limit: number; total: number; pages: number };
}

/* ── Helpers ────────────────────────────────────────────────────── */
function slotToTime(slot: number): string {
  const totalMins = 9 * 60 + slot * 30;
  const h = Math.floor(totalMins / 60);
  const m = totalMins % 60;
  const dh = h > 12 ? h - 12 : h === 0 ? 12 : h;
  const ampm = h >= 12 ? 'PM' : 'AM';
  return `${dh}:${m.toString().padStart(2, '0')} ${ampm}`;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
}

const today = new Date().toISOString().split('T')[0];

/* ── Empty State SVG ────────────────────────────────────────────── */
function EmptyState({ tab }: { tab: string }) {
  return (
    <motion.div variants={fadeUp} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', paddingTop: '2rem' }}>
      <svg width="260" height="220" viewBox="0 0 260 220" fill="none" xmlns="http://www.w3.org/2000/svg"
        style={{ marginBottom: '2rem', opacity: 0.55 }}>
        <rect x="118" y="150" width="24" height="55" rx="4" fill="#D4B896" />
        <ellipse cx="130" cy="205" rx="50" ry="8" fill="#E8DDD0" />
        <ellipse cx="130" cy="158" rx="72" ry="30" fill="#7DBF82" />
        <ellipse cx="130" cy="122" rx="56" ry="27" fill="#5CA864" />
        <ellipse cx="130" cy="90" rx="40" ry="23" fill="#3D8C45" />
        <circle cx="108" cy="148" r="5" fill="#A3D9A8" opacity="0.7"/>
        <circle cx="152" cy="142" r="4" fill="#A3D9A8" opacity="0.7"/>
        <circle cx="116" cy="108" r="4" fill="#7DBF82" opacity="0.8"/>
        <circle cx="144" cy="112" r="3" fill="#7DBF82" opacity="0.8"/>
      </svg>
      <p style={{ fontSize: '1rem', color: '#888', fontWeight: 500 }}>
        No {tab} bookings yet
      </p>
    </motion.div>
  );
}

/* ── Booking Card ───────────────────────────────────────────────── */
function BookingCard({ booking, onCancel, cancelling }: {
  booking: Booking;
  onCancel: (id: string) => void;
  cancelling: string | null;
}) {
  const isUpcoming  = booking.booking_date >= today;
  const canCancel   = isUpcoming && booking.status === 'confirmed';
  const isCancelled = booking.status === 'cancelled';

  return (
    <motion.div variants={fadeUp}
      style={{
        background: '#fff', borderRadius: '12px', padding: '1.25rem 1.5rem',
        border: '1px solid #E9ECEF', display: 'flex', alignItems: 'flex-start',
        justifyContent: 'space-between', gap: '1rem',
        opacity: isCancelled ? 0.65 : 1,
        boxShadow: '0 1px 6px rgba(0,0,0,0.04)',
        borderLeft: booking.color ? `4px solid ${booking.color}` : '1px solid #E9ECEF',
      }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Room + date row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.4rem', flexWrap: 'wrap' }}>
          <span style={{ fontWeight: 700, fontSize: '0.95rem', color: '#111' }}>{booking.room_name}</span>
          <span style={{ fontSize: '0.78rem', color: '#666' }}>{formatDate(booking.booking_date)}</span>
        </div>

        {/* Time */}
        <p style={{ fontSize: '0.82rem', color: '#555', margin: '0 0 0.35rem' }}>
          🕐 {slotToTime(booking.start_slot)} – {slotToTime(booking.end_slot)}
        </p>

        {/* Subject */}
        {booking.title && booking.title !== 'Meeting' ? (
          <p style={{ fontSize: '0.82rem', color: '#444', margin: '0 0 0.35rem', fontWeight: 500 }}>
            📋 {booking.title}
          </p>
        ) : (
          <p style={{ fontSize: '0.82rem', color: '#888', margin: '0 0 0.35rem', fontStyle: 'italic' }}>
            📋 Meeting
          </p>
        )}
      </div>

      {/* Right: status badge + cancel */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.6rem', flexShrink: 0 }}>
        <span style={{
          fontSize: '0.72rem', fontWeight: 600, padding: '0.25rem 0.7rem', borderRadius: '20px',
          backgroundColor: isCancelled ? '#FEE2E2' : '#D1FAE5',
          color: isCancelled ? '#B91C1C' : '#065F46',
        }}>
          {isCancelled ? 'Cancelled' : 'Confirmed'}
        </span>
        {canCancel && (
          <button
            onClick={() => onCancel(booking.id)}
            disabled={cancelling === booking.id}
            style={{
              fontSize: '0.75rem', padding: '0.3rem 0.75rem', borderRadius: '6px',
              border: '1px solid #F87171', background: '#fff', color: '#EF4444',
              cursor: cancelling === booking.id ? 'not-allowed' : 'pointer', fontWeight: 500,
              opacity: cancelling === booking.id ? 0.6 : 1,
            }}>
            {cancelling === booking.id ? 'Cancelling…' : 'Cancel'}
          </button>
        )}
      </div>
    </motion.div>
  );
}

/* ── Main Page ──────────────────────────────────────────────────── */
const YourBookings = () => {
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');
  const [bookings, setBookings]   = useState<Booking[]>([]);
  const [loading, setLoading]     = useState(true);
  const [cancelling, setCancelling] = useState<string | null>(null);

  const fetchBookings = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiGet<BookingsResponse>('/api/v1/bookings/mine?limit=100');
      setBookings(Array.isArray(res.data) ? res.data : []);
    } catch {
      toast.error('Failed to load bookings');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchBookings(); }, [fetchBookings]);

  const handleCancel = async (id: string) => {
    if (!window.confirm('Cancel this booking?')) return;
    setCancelling(id);
    try {
      await apiPatch(`/api/v1/bookings/${id}/cancel`, {});
      toast.success('Booking cancelled');
      fetchBookings();
    } catch {
      toast.error('Failed to cancel booking');
    } finally {
      setCancelling(null);
    }
  };

  const upcoming = bookings.filter(b => b.booking_date >= today);
  const past     = bookings.filter(b => b.booking_date < today);
  const shown    = activeTab === 'upcoming' ? upcoming : past;

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem', fontFamily: 'sans-serif' }}>
      <motion.div variants={stagger} initial="hidden" animate="show">

        <motion.div variants={fadeUp}>
          <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '0.5rem', color: '#1A1A1A' }}>
            Your Bookings
          </h1>
          <p style={{ color: '#666', marginBottom: '2rem', fontSize: '0.9rem' }}>
            Book a conference room in advance for 30 minutes or more.
          </p>
        </motion.div>

        {/* Tab switcher */}
        <motion.div variants={fadeUp} style={{ display: 'flex', gap: '0.75rem', marginBottom: '2rem' }}>
          {(['upcoming', 'past'] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              style={{
                padding: '0.4rem 1.25rem', borderRadius: '20px', border: '1px solid #ddd',
                backgroundColor: activeTab === tab ? '#1A1A1A' : 'transparent',
                color: activeTab === tab ? '#fff' : '#666',
                cursor: 'pointer', fontWeight: activeTab === tab ? 600 : 400,
                fontSize: '0.875rem', transition: 'all 0.15s ease',
              }}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
              <span style={{ marginLeft: '0.4rem', fontSize: '0.75rem', opacity: 0.75 }}>
                ({tab === 'upcoming' ? upcoming.length : past.length})
              </span>
            </button>
          ))}
        </motion.div>

        {/* Content */}
        {loading ? (
          <motion.div variants={fadeUp} style={{ textAlign: 'center', padding: '3rem', color: '#aaa' }}>
            Loading bookings…
          </motion.div>
        ) : shown.length === 0 ? (
          <EmptyState tab={activeTab} />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {shown.map(b => (
              <BookingCard key={b.id} booking={b} onCancel={handleCancel} cancelling={cancelling} />
            ))}
          </div>
        )}

      </motion.div>
    </div>
  );
};

export default YourBookings;
