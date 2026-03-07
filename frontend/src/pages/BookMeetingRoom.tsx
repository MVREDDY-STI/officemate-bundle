import { useState, useEffect, memo } from 'react';
import { Calendar, Monitor, Presentation, Users, ChevronLeft, ChevronRight, Plus, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

/* ── Types ─────────────────────────────────────────────────────── */
interface Room {
  id: string;
  name: string;
  room_code: string;
  capacity: number;
  features: string[];
  color: string;
  is_active: boolean;
}

/* ── Constants ──────────────────────────────────────────────────── */
const TOTAL_SLOTS        = 18;   // 9:00 AM – 5:30 PM at 30 min each
const VISIBLE_SLOTS      = 18;   // show full day
const MAX_SLOTS_PER_ROOM = 8;
const MAX_OFFSET         = 0;
const ALL_SLOTS          = Array.from({ length: TOTAL_SLOTS }, (_, i) => i);
const HOUR_LABELS        = Array.from({ length: 9 }, (_, i) => {
  const h = 9 + i, dh = h > 12 ? h - 12 : h;
  return `${dh}${h >= 12 ? 'pm' : 'am'}`;
});
const ROOM_COLORS = ['#f59e3d','#60a5fa','#34d399','#f87171','#a78bfa','#fb923c','#22d3ee','#e879f9'];

// Sample booked slots: { roomId -> [slotIdx, ...] }
const SAMPLE_BOOKINGS: Record<string, number[]> = {};

const formatSlot = (idx: number): string => {
  const mins = 9 * 60 + idx * 30, h = Math.floor(mins / 60), m = mins % 60;
  const dh = h > 12 ? h - 12 : h === 0 ? 12 : h;
  return `${dh}:${m.toString().padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
};

/* ── Add Room Modal ─────────────────────────────────────────────── */
function AddRoomModal({ onClose, onAdd }: { onClose: () => void; onAdd: (r: Room) => void }) {
  const [form, setForm] = useState({
    name: '', room_code: '', capacity: '4', features: 'TV,White Board', color: ROOM_COLORS[0],
  });
  const [saving, setSaving] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.room_code.trim()) { toast.error('Name and room code are required'); return; }
    setSaving(true);
    try {
      const token = (() => { try { return JSON.parse(sessionStorage.getItem('solum_auth') ?? '{}').token; } catch { return null; } })();
      const res = await fetch('/api/v1/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({
          name: form.name.trim(),
          room_code: form.room_code.trim(),
          capacity: parseInt(form.capacity) || 4,
          features: form.features.split(',').map(f => f.trim()).filter(Boolean),
          color: form.color,
        }),
      });
      if (!res.ok) { const e = await res.json(); toast.error(e.error ?? 'Failed'); return; }
      const room = await res.json();
      toast.success(`${room.name} added!`);
      onAdd(room);
      onClose();
    } catch { toast.error('Network error'); }
    finally { setSaving(false); }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.45)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
        style={{ backgroundColor: '#fff', borderRadius: '12px', padding: '2rem', width: '420px', maxWidth: '95vw', boxShadow: '0 16px 48px rgba(0,0,0,0.18)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h3 style={{ fontWeight: 700, fontSize: '1.1rem', margin: 0 }}>Add Meeting Room</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}><X size={20} color="#888" /></button>
        </div>
        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
          {[
            { label: 'Room Name *', key: 'name', placeholder: 'e.g. SAMVAADA' },
            { label: 'Room Code *', key: 'room_code', placeholder: 'e.g. Room 01' },
            { label: 'Capacity', key: 'capacity', placeholder: '4', type: 'number' },
            { label: 'Features (comma-separated)', key: 'features', placeholder: 'TV,White Board,Projector' },
          ].map(({ label, key, placeholder, type }) => (
            <div key={key}>
              <label style={{ display: 'block', fontSize: '0.75rem', color: '#555', marginBottom: '0.3rem', fontWeight: 500 }}>{label}</label>
              <input
                type={type ?? 'text'}
                placeholder={placeholder}
                value={(form as any)[key]}
                onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                style={{ width: '100%', border: '1px solid #ddd', borderRadius: '6px', padding: '0.5rem 0.75rem', fontSize: '0.875rem', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>
          ))}
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', color: '#555', marginBottom: '0.4rem', fontWeight: 500 }}>Color</label>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {ROOM_COLORS.map(c => (
                <div key={c} onClick={() => setForm(f => ({ ...f, color: c }))}
                  style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: c, cursor: 'pointer', border: form.color === c ? '3px solid #1a1a1a' : '2px solid transparent', transition: 'border 0.1s' }} />
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
            <button type="button" onClick={onClose} style={{ flex: 1, padding: '0.6rem', border: '1px solid #ddd', borderRadius: '8px', background: '#fff', cursor: 'pointer', fontSize: '0.875rem' }}>Cancel</button>
            <button type="submit" disabled={saving}
              style={{ flex: 1, padding: '0.6rem', border: 'none', borderRadius: '8px', background: '#1a1a1a', color: '#fff', cursor: saving ? 'default' : 'pointer', fontSize: '0.875rem', fontWeight: 600, opacity: saving ? 0.7 : 1 }}>
              {saving ? 'Adding…' : 'Add Room'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

/* ── Room Row ───────────────────────────────────────────────────── */
const RoomRow = memo(function RoomRow({
  room, index, selectedSlots, onSlotClick, timeOffset, canScrollLeft, canScrollRight, onScrollLeft, onScrollRight,
}: {
  room: Room; index: number;
  selectedSlots: { roomId: string; timeIndex: number }[];
  onSlotClick: (roomId: string, timeIndex: number) => void;
  timeOffset: number; canScrollLeft: boolean; canScrollRight: boolean;
  onScrollLeft: () => void; onScrollRight: () => void;
}) {
  const visibleSlots = ALL_SLOTS.slice(timeOffset, timeOffset + VISIBLE_SLOTS);
  const bookedSlots  = SAMPLE_BOOKINGS[room.id] ?? [];

  return (
    <motion.div style={{ display: 'flex', gap: '1.25rem', alignItems: 'stretch' }}
      initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: index * 0.06, ease: 'easeOut' }}>

      {/* Colour card */}
      <div style={{ width: '155px', minHeight: '88px', flexShrink: 0, backgroundColor: room.color, borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ color: 'rgba(255,255,255,0.92)', fontSize: '0.68rem', fontWeight: 700, letterSpacing: '1px' }}>{room.name}</span>
      </div>

      {/* Info */}
      <div style={{ width: '150px', flexShrink: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '0.35rem 0' }}>
        <div>
          <h3 style={{ fontSize: '0.83rem', fontWeight: 700, color: '#1a1a1a', marginBottom: '0.1rem', textTransform: 'uppercase', letterSpacing: '0.4px' }}>{room.name}</h3>
          <p style={{ color: '#aaa', fontSize: '0.7rem' }}>{room.room_code}</p>
        </div>
        <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap' }}>
          <div style={{ border: '1px solid #eee', padding: '0.12rem 0.32rem', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '0.18rem' }}>
            <Users size={11} color="#777" /><span style={{ fontSize: '0.63rem', color: '#666' }}>{room.capacity}</span>
          </div>
          {(room.features ?? []).slice(0, 2).map(f => (
            <div key={f} style={{ border: '1px solid #eee', padding: '0.12rem 0.32rem', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '0.18rem' }}>
              {f === 'TV' ? <Monitor size={11} color="#777" /> : <Presentation size={11} color="#777" />}
              <span style={{ fontSize: '0.63rem', color: '#666' }}>{f}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Timeline */}
      <div style={{ flex: 1, minWidth: 0, position: 'relative' }}>
        <button onClick={onScrollLeft} disabled={!canScrollLeft} title="Earlier" style={{ position: 'absolute', left: '-15px', top: '50%', transform: 'translateY(-50%)', zIndex: 10, width: '30px', height: '30px', borderRadius: '50%', background: '#fff', border: '1px solid #e5e7eb', padding: 0, boxShadow: canScrollLeft ? '0 2px 6px rgba(0,0,0,0.14)' : 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: canScrollLeft ? 'pointer' : 'default', color: canScrollLeft ? '#444' : '#d1d5db', transition: 'all 0.15s' }}>
          <ChevronLeft size={14} />
        </button>

        <div style={{ border: '1px solid #e5e7eb', borderRadius: '8px', overflow: 'hidden' }}>
          {/* Hour header */}
          <div style={{ display: 'flex', borderBottom: '1px solid #e5e7eb', backgroundColor: '#f9fafb' }}>
            {HOUR_LABELS.map((label, hi) => {
              const isLast = hi === HOUR_LABELS.length - 1;
              return (
                <div key={hi} style={{ flex: 2, padding: '0.42rem 0', fontSize: '0.6rem', fontWeight: 600, color: '#444', borderRight: !isLast ? '1px solid #d1d5db' : 'none', display: 'flex', justifyContent: isLast ? 'space-between' : 'flex-start', alignItems: 'center', paddingLeft: '5px', paddingRight: isLast ? '5px' : 0, userSelect: 'none' }}>
                  <span>{label}</span>
                  {isLast && <span style={{ fontWeight: 700, color: '#333' }}>6pm</span>}
                </div>
              );
            })}
          </div>

          {/* Slots */}
          <div style={{ display: 'flex', minHeight: '58px' }}>
            {visibleSlots.map((absIdx, i) => {
              const isSelected = selectedSlots.some(s => s.roomId === room.id && s.timeIndex === absIdx);
              const isBooked   = bookedSlots.includes(absIdx);
              const isHour     = absIdx % 2 === 0;
              const isLast     = i === VISIBLE_SLOTS - 1;
              const bg = isSelected ? '#9bc2e6' : isBooked ? '#e5e7eb' : 'transparent';
              return (
                <div key={absIdx} title={isBooked ? `Booked: ${formatSlot(absIdx)}` : formatSlot(absIdx)}
                  onClick={() => !isBooked && onSlotClick(room.id, absIdx)}
                  style={{ flex: 1, borderRight: !isLast ? (isHour ? '1px solid #d1d5db' : '1px dashed #eaecef') : 'none', backgroundColor: bg, cursor: isBooked ? 'not-allowed' : 'pointer', transition: 'background-color 0.12s', position: 'relative' }}>
                  {isBooked && <div style={{ position: 'absolute', inset: 0, backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 4px, rgba(0,0,0,0.04) 4px, rgba(0,0,0,0.04) 8px)' }} />}
                </div>
              );
            })}
          </div>
        </div>

        <button onClick={onScrollRight} disabled={!canScrollRight} title="Later" style={{ position: 'absolute', right: '-15px', top: '50%', transform: 'translateY(-50%)', zIndex: 10, width: '30px', height: '30px', borderRadius: '50%', background: '#fff', border: '1px solid #e5e7eb', padding: 0, boxShadow: canScrollRight ? '0 2px 6px rgba(0,0,0,0.14)' : 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: canScrollRight ? 'pointer' : 'default', color: canScrollRight ? '#444' : '#d1d5db', transition: 'all 0.15s' }}>
          <ChevronRight size={14} />
        </button>
      </div>
    </motion.div>
  );
});

/* ── Main Page ──────────────────────────────────────────────────── */
const BookMeetingRoom = () => {
  const { isAdmin } = useAuth();
  const today = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState(today);
  const [rooms, setRooms]               = useState<Room[]>([]);
  const [loading, setLoading]           = useState(true);
  const [showAddRoom, setShowAddRoom]   = useState(false);
  const [selectedSlots, setSelectedSlots] = useState<{ roomId: string; timeIndex: number }[]>([]);
  const [timeOffset, setTimeOffset]       = useState(0);

  const canScrollLeft  = timeOffset > 0;
  const canScrollRight = timeOffset < MAX_OFFSET;

  useEffect(() => {
    fetch('/api/v1/rooms')
      .then(r => r.json())
      .then(data => { setRooms(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  // Inject sample bookings for first room (for demo)
  useEffect(() => {
    if (rooms.length > 0 && Object.keys(SAMPLE_BOOKINGS).length === 0) {
      SAMPLE_BOOKINGS[rooms[0].id] = [2, 3, 4]; // 10:00–11:30 AM sample booked
    }
  }, [rooms]);

  const handleSlotClick = (roomId: string, timeIndex: number) => {
    const isSelected = selectedSlots.some(s => s.roomId === roomId && s.timeIndex === timeIndex);
    if (isSelected) {
      setSelectedSlots(p => p.filter(s => !(s.roomId === roomId && s.timeIndex === timeIndex)));
      toast('Slot removed', { icon: '✕' });
    } else {
      const count = selectedSlots.filter(s => s.roomId === roomId).length;
      if (count >= MAX_SLOTS_PER_ROOM) { toast.error(`Max ${MAX_SLOTS_PER_ROOM} slots (4 hrs) per room`); return; }
      setSelectedSlots(p => [...p, { roomId, timeIndex }]);
      const roomName = rooms.find(r => r.id === roomId)?.name ?? '';
      toast.success(`${roomName} — ${formatSlot(timeIndex)}`);
    }
  };

  const totalSelected = selectedSlots.length;
  const handleBook = () => {
    if (!totalSelected) { toast.error('Select at least one slot'); return; }
    toast.success('Booking confirmed! (API integration pending)');
    setSelectedSlots([]);
  };

  return (
    <div style={{ maxWidth: '1300px', margin: '0 auto', padding: '2rem', fontFamily: 'sans-serif' }}>
      <motion.div style={{ marginBottom: '2.5rem' }} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '0.5rem', color: '#1A1A1A' }}>Book a Meeting Room</h1>
        <p style={{ color: '#666', fontSize: '0.9rem' }}>Book a conference room in advance for 30 minutes or more.</p>

        {/* Date picker — min=today prevents past dates */}
        <div style={{ position: 'relative', marginTop: '1.5rem', border: '1px solid #ddd', padding: '0.75rem 1rem', borderRadius: '4px', maxWidth: '350px', backgroundColor: '#fff' }}>
          <div style={{ position: 'absolute', top: '-10px', left: '16px', backgroundColor: '#fff', padding: '0 0.5rem', fontSize: '0.75rem', color: '#aaa' }}>Date</div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <Calendar size={18} color="#888" />
              <input type="date" value={selectedDate} min={today}
                onChange={e => { setSelectedDate(e.target.value); setSelectedSlots([]); }}
                style={{ border: 'none', outline: 'none', background: 'transparent', color: '#444', fontSize: '0.875rem', cursor: 'pointer' }} />
            </div>
            <span onClick={() => { setSelectedDate(today); setSelectedSlots([]); }}
              style={{ fontSize: '0.75rem', backgroundColor: '#9bc2e6', color: '#fff', padding: '0.25rem 0.5rem', borderRadius: '4px', fontWeight: 500, cursor: 'pointer' }}>Today</span>
          </div>
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2, delay: 0.08 }}>
        {/* Header row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 'bold', color: '#333' }}>Meeting Rooms Currently Available</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ fontSize: '0.75rem', color: '#888', display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <span style={{ width: 12, height: 12, backgroundColor: '#9bc2e6', borderRadius: 2, display: 'inline-block' }} />Selected
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <span style={{ width: 12, height: 12, backgroundColor: '#e5e7eb', borderRadius: 2, border: '1px solid #d1d5db', display: 'inline-block' }} />Booked
              </span>
              <span>Each slot = 30 min · 9:00 AM – 6:00 PM</span>
            </div>
            {isAdmin && (
              <button onClick={() => setShowAddRoom(true)}
                style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.45rem 0.9rem', backgroundColor: '#1a1a1a', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}>
                <Plus size={14} /> Add Room
              </button>
            )}
          </div>
        </div>

        {/* Rooms list */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#aaa' }}>Loading rooms…</div>
        ) : rooms.length === 0 ? (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            style={{ textAlign: 'center', padding: '4rem 2rem', backgroundColor: '#f9fafb', borderRadius: '12px', border: '2px dashed #e5e7eb' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>🏢</div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#333', marginBottom: '0.5rem' }}>No Meeting Rooms Yet</h3>
            <p style={{ color: '#888', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
              {isAdmin ? 'Add your first meeting room to get started.' : 'Meeting rooms will appear here once added by an admin.'}
            </p>
            {isAdmin && (
              <button onClick={() => setShowAddRoom(true)}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1.25rem', backgroundColor: '#1a1a1a', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 600 }}>
                <Plus size={16} /> Add First Room
              </button>
            )}
          </motion.div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', paddingLeft: '16px', paddingRight: '16px' }}>
            {rooms.map((room, index) => (
              <RoomRow key={room.id} room={room} index={index} selectedSlots={selectedSlots}
                onSlotClick={handleSlotClick} timeOffset={timeOffset}
                canScrollLeft={canScrollLeft} canScrollRight={canScrollRight}
                onScrollLeft={() => setTimeOffset(o => Math.max(0, o - 1))}
                onScrollRight={() => setTimeOffset(o => Math.min(MAX_OFFSET, o + 1))} />
            ))}
          </div>
        )}
      </motion.div>

      {/* Add Room modal */}
      <AnimatePresence>
        {showAddRoom && <AddRoomModal onClose={() => setShowAddRoom(false)} onAdd={r => setRooms(p => [...p, r])} />}
      </AnimatePresence>

      {/* Floating booking bar */}
      <AnimatePresence>
        {totalSelected > 0 && (
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 24 }}
            style={{ position: 'fixed', bottom: '2rem', left: '50%', transform: 'translateX(-50%)', backgroundColor: '#1A1A1A', color: '#fff', padding: '0.875rem 1.75rem', borderRadius: '50px', display: 'flex', alignItems: 'center', gap: '1.25rem', boxShadow: '0 8px 32px rgba(0,0,0,0.22)', zIndex: 200, whiteSpace: 'nowrap' }}>
            <span style={{ fontSize: '0.875rem' }}>{totalSelected} slot{totalSelected !== 1 ? 's' : ''} &nbsp;·&nbsp; {totalSelected * 30} min</span>
            <button onClick={handleBook} style={{ backgroundColor: '#fff', color: '#1A1A1A', border: 'none', padding: '0.45rem 1.1rem', borderRadius: '50px', fontWeight: 600, cursor: 'pointer', fontSize: '0.875rem' }}>Book Now</button>
            <button onClick={() => setSelectedSlots([])} style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer', fontSize: '1rem', lineHeight: 1 }}>✕</button>
          </motion.div>
        )}
      </AnimatePresence>

      <div style={{ height: '5rem' }} />
    </div>
  );
};

export default BookMeetingRoom;
