import { useState, useEffect } from 'react';
import { Calendar, MapPin, Phone, Mail, ChevronDown, ChevronUp, Leaf, Globe, Coffee, Sun, Building2, Dumbbell, Wifi, Package, Plus, Clock, ImageOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import EditableField from '../components/EditableField';
import EditableImage from '../components/EditableImage';

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.25, ease: 'easeOut' } },
};
const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } };

/* ── Event helpers ─────────────────────────────────────────── */
interface HomeEvent {
  id: string; title: string; description: string | null;
  image_url: string | null; event_date: string | null; event_time: string | null;
}
function evDateStr(d: string): string { return d.slice(0, 10); }
function evFmtDate(d: string | null): string {
  if (!d) return '';
  try { return new Date(evDateStr(d) + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }); } catch { return d; }
}
function evFmtTime(t: string | null): string {
  if (!t) return '';
  try {
    const [h, m] = t.split(':').map(Number);
    return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
  } catch { return t; }
}

interface AccordionSectionProps {
  title: string;
  open: boolean;
  onToggle: () => void;
  borderBottom?: boolean;
  children: React.ReactNode;
}

function AccordionSection({ title, open, onToggle, borderBottom = false, children }: AccordionSectionProps) {
  return (
    <div style={{ borderTop: '1px solid #E5E5E5', ...(borderBottom ? { borderBottom: '1px solid #E5E5E5' } : {}) }}>
      <h3
        onClick={onToggle}
        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', padding: '1rem 0', marginBottom: 0, fontWeight: 600, fontSize: '1rem', color: '#1A1A1A' }}
      >
        {title}
        {open ? <ChevronUp size={20} color="#737373" /> : <ChevronDown size={20} color="#737373" />}
      </h3>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key={title}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            style={{ overflow: 'hidden' }}
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

const amenities = [
  { Icon: Dumbbell,  label: 'Meditation Room' },
  { Icon: Building2, label: 'Cowork spaces' },
  { Icon: Coffee,    label: 'Business lounge' },
  { Icon: Calendar,  label: 'Day at a time' },
  { Icon: Leaf,      label: 'Outdoor space' },
  { Icon: Sun,       label: 'Rooftop' },
  { Icon: Globe,     label: 'International partners' },
];

const hoursData = [
  ['Monday',    '9:00 AM – 10:00 PM'],
  ['Tuesday',   '9:00 AM – 10:00 PM'],
  ['Wednesday', '9:00 AM – 10:00 PM'],
  ['Thursday',  '9:00 AM – 10:00 PM'],
  ['Friday',    '9:00 AM – 10:00 PM'],
  ['Saturday',  'Closed'],
  ['Sunday',    'Closed'],
];

const teamMembers = [
  { key: '1', defaultName: 'Sakshi' },
  { key: '2', defaultName: 'Rohan' },
  { key: '3', defaultName: 'Priya' },
];


export default function Home() {
  const { user } = useAuth();
  const [openSection, setOpenSection]       = useState<string | null>('Location');
  const [upcomingEvents, setUpcomingEvents] = useState<HomeEvent[]>([]);

  const toggle = (s: string) => setOpenSection(p => p === s ? null : s);

  useEffect(() => {
    fetch('/api/v1/events')
      .then(r => r.json())
      .then(d => setUpcomingEvents(Array.isArray(d) ? d.slice(0, 4) : []))
      .catch(() => {});
  }, []);

  const now = new Date();
  const dateStr = now.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short' });
  const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="container" style={{ paddingTop: '2rem' }}>

      {/* ── Hero ── */}
      <motion.div
        className="hero-grid"
        style={{ marginBottom: '3rem' }}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
      >
        {/* Left: Welcome */}
        <div>
          <h1 className="text-3xl" style={{ marginBottom: '0.5rem' }}>Welcome {user?.name} !</h1>
          <p className="text-muted" style={{ fontSize: '0.875rem' }}>{dateStr}. {timeStr}</p>
        </div>

        {/* Center: Staggered photo collage */}
        <div className="photo-mosaic">
          {/* Top-left — pushed down 45px */}
          <div className="mosaic-photo mosaic-p1">
            <EditableImage
              storageKey="home.photo1"
              defaultSrc="https://placehold.co/500x420/D4C5B0/555?text=Office+Space"
              alt="Office space"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              wrapperStyle={{ width: '100%', height: '100%' }}
            />
          </div>
          {/* Top-right — starts from top */}
          <div className="mosaic-photo mosaic-p2">
            <EditableImage
              storageKey="home.photo2"
              defaultSrc="https://placehold.co/440x530/C8B9A5/555?text=Interior"
              alt="Interior design"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              wrapperStyle={{ width: '100%', height: '100%' }}
            />
          </div>
          {/* Bottom-left */}
          <div className="mosaic-photo mosaic-p3">
            <EditableImage
              storageKey="home.photo3"
              defaultSrc="https://placehold.co/500x420/E8E0D5/555?text=Reception"
              alt="Reception area"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              wrapperStyle={{ width: '100%', height: '100%' }}
            />
          </div>
          {/* Bottom-right */}
          <div className="mosaic-photo mosaic-p4">
            <EditableImage
              storageKey="home.photo4"
              defaultSrc="https://placehold.co/440x400/B0C4D8/555?text=Meeting+Room"
              alt="Meeting room"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              wrapperStyle={{ width: '100%', height: '100%' }}
            />
          </div>
        </div>

        {/* Right: Info panel */}
        <div className="hero-info-panel">

          {/* Book CTA */}
          <a
            href="/dashboard/book-room"
            style={{ display: 'block', padding: '0.875rem 1rem', backgroundColor: '#1A1A1A', color: '#fff', borderRadius: '6px', fontSize: '0.875rem', fontWeight: 600, textAlign: 'center', textDecoration: 'none', letterSpacing: '0.01em' }}
          >
            Book a meeting Room
          </a>

          {/* WiFi */}
          <div style={{ border: '1px solid #E5E5E5', borderRadius: '10px', padding: '0.875rem 1rem', display: 'flex', gap: '0.75rem', alignItems: 'flex-start', backgroundColor: '#fff' }}>
            <div style={{ flexShrink: 0, marginTop: '2px' }}>
              <Wifi size={20} color="#F97316" />
            </div>
            <div>
              <EditableField
                tag="h4"
                storageKey="home.wifi.title"
                defaultValue="WiFi"
                style={{ fontWeight: 700, fontSize: '0.875rem', marginBottom: '0.4rem', color: '#1A1A1A' }}
              />
              <div style={{ fontSize: '0.75rem', color: '#737373', lineHeight: '1.8' }}>
                <span style={{ display: 'flex', gap: '0.5rem' }}>
                  <span>User name</span><span style={{ color: '#1A1A1A' }}>:</span>
                  <EditableField tag="span" storageKey="home.wifi.user" defaultValue="roommate" style={{ color: '#1A1A1A', fontWeight: 500 }} />
                </span>
                <span style={{ display: 'flex', gap: '0.5rem' }}>
                  <span>Passwords</span><span style={{ color: '#1A1A1A' }}>:</span>
                  <EditableField tag="span" storageKey="home.wifi.pass" defaultValue="SoluM@2022" style={{ color: '#1A1A1A', fontWeight: 500 }} />
                </span>
              </div>
            </div>
          </div>

          {/* Deliveries */}
          <div style={{ border: '1px solid #E5E5E5', borderRadius: '10px', padding: '0.875rem 1rem', display: 'flex', gap: '0.75rem', alignItems: 'flex-start', backgroundColor: '#fff' }}>
            <div style={{ flexShrink: 0, marginTop: '2px' }}>
              <Package size={20} color="#F97316" />
            </div>
            <div>
              <EditableField
                tag="h4"
                storageKey="home.delivery.title"
                defaultValue="Deliveries"
                style={{ fontWeight: 700, fontSize: '0.875rem', marginBottom: '0.4rem', color: '#1A1A1A' }}
              />
              <div style={{ fontSize: '0.75rem', color: '#555', lineHeight: '1.7' }}>
                <EditableField tag="p" storageKey="home.delivery.name" defaultValue="PEPPIN PAULY" style={{ color: '#555' }} />
                <EditableField tag="p" storageKey="home.delivery.company" defaultValue="Solum Technologies India" style={{ fontWeight: 700, color: '#1A1A1A' }} />
                <EditableField tag="p" storageKey="home.delivery.address" defaultValue="402, 4th Floor, Tower-2, Phoenix Asia Towers, Byatarayanapura Village, Yelahanka Hobli, Bellary Road, Bengaluru- 560 092" style={{ color: '#737373', marginTop: '0.2rem' }} />
              </div>
            </div>
          </div>

          {/* Emergency Contacts */}
          <div style={{ border: '1px solid #E5E5E5', borderRadius: '10px', padding: '0.875rem 1rem', display: 'flex', gap: '0.75rem', alignItems: 'flex-start', backgroundColor: '#fff' }}>
            <div style={{ flexShrink: 0, marginTop: '2px', width: '20px', height: '20px', borderRadius: '50%', border: '2px solid #EF4444', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Plus size={12} color="#EF4444" strokeWidth={3} />
            </div>
            <div>
              <EditableField
                tag="h4"
                storageKey="home.emergency.title"
                defaultValue="Emergency Contacts"
                style={{ fontWeight: 700, fontSize: '0.875rem', marginBottom: '0.4rem', color: '#1A1A1A' }}
              />
              <div style={{ fontSize: '0.75rem', color: '#555', lineHeight: '1.7' }}>
                <EditableField tag="p" storageKey="home.emergency.name" defaultValue="PEPPIN PAULY" style={{ color: '#555' }} />
                <EditableField tag="p" storageKey="home.emergency.company" defaultValue="Solum Technologies India" style={{ fontWeight: 700, color: '#1A1A1A' }} />
                <EditableField tag="p" storageKey="home.emergency.address" defaultValue="402, 4th Floor, Tower-2, Phoenix Asia Towers, Byatarayanapura Village, Yelahanka Hobli, Bellary Road, Bengaluru- 560 092" style={{ color: '#737373', marginTop: '0.2rem' }} />
              </div>
            </div>
          </div>

        </div>
      </motion.div>

      {/* ── Upcoming Booking & Guest ── */}
      <motion.section
        style={{ marginBottom: '3rem' }}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.06, ease: 'easeOut' }}
      >
        <h2 className="text-xl" style={{ marginBottom: '1rem' }}>Upcoming Booking & Guest</h2>
        <div className="card d-flex flex-column align-center justify-center" style={{ padding: '4rem 2rem', backgroundColor: '#F8F9FA', border: 'none' }}>
          <Calendar size={48} color="#A3A3A3" style={{ marginBottom: '1rem' }} />
          <h3 className="text-lg" style={{ color: '#737373', fontWeight: 500 }}>Nothing Upcoming</h3>
        </div>
      </motion.section>

      {/* ── Meeting Rooms Currently Available ── */}
      <motion.section
        style={{ marginBottom: '3rem' }}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1, ease: 'easeOut' }}
      >
        <div className="d-flex justify-between align-center" style={{ marginBottom: '1rem' }}>
          <h2 className="text-xl">Meeting Rooms Currently Available</h2>
          <a href="/dashboard/book-room" className="text-sm" style={{ color: '#0066FF', fontWeight: 500 }}>View All Rooms &gt;</a>
        </div>
        <motion.div className="grid grid-cols-3" variants={stagger} initial="hidden" animate="show">
          {[
            { name: 'AVALOKANA', room: 'Room 01', color: '#FBBF24' },
            { name: 'SANKALPA',  room: 'Room 02', color: '#F97316' },
            { name: 'CHINTANA',  room: 'Room 03', color: '#F59E0B' },
          ].map(({ name, room, color }) => (
            <motion.div key={name} variants={fadeUp} className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{ height: '120px', backgroundColor: color }} />
              <div style={{ padding: '1rem' }}>
                <h4 style={{ marginBottom: '0.25rem', fontSize: '0.9rem' }}>{name}</h4>
                <p className="text-muted text-sm" style={{ marginBottom: '1rem' }}>{room}</p>
                <div className="d-flex gap-1" style={{ flexWrap: 'wrap' }}>
                  {['04', 'TV', 'White Board'].map(tag => (
                    <span key={tag} style={{ padding: '0.2rem 0.5rem', borderRadius: '4px', border: '1px solid #E5E5E5', fontSize: '0.7rem', color: '#666' }}>{tag}</span>
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </motion.section>

      {/* ── Upcoming Events ── */}
      <motion.section
        style={{ marginBottom: '3rem' }}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.13, ease: 'easeOut' }}
      >
        <div className="d-flex justify-between align-center" style={{ marginBottom: '1.25rem' }}>
          <h2 className="text-xl">Upcoming Events</h2>
          <a href="/dashboard/events" className="text-sm" style={{ color: '#0066FF', fontWeight: 500 }}>View All Events &gt;</a>
        </div>

        {upcomingEvents.length === 0 ? (
          /* Empty state */
          <div className="card d-flex flex-column align-center justify-center" style={{ padding: '3rem 2rem', backgroundColor: '#F8F9FA', border: 'none' }}>
            <Calendar size={40} color="#A3A3A3" style={{ marginBottom: '0.75rem' }} />
            <p style={{ color: '#737373', fontWeight: 500, fontSize: '0.875rem', margin: 0 }}>No upcoming events</p>
          </div>
        ) : (
          <motion.div
            className="grid grid-cols-2"
            variants={stagger} initial="hidden" animate="show"
            style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
            {upcomingEvents.map(ev => {
              const dateObj = ev.event_date ? new Date(evDateStr(ev.event_date) + 'T00:00:00') : null;
              const month   = dateObj ? dateObj.toLocaleDateString('en-IN', { month: 'short' }).toUpperCase() : null;
              const day     = dateObj ? dateObj.getDate() : null;
              return (
                <motion.div key={ev.id} variants={fadeUp} className="card" style={{ padding: 0, overflow: 'hidden', borderRadius: '12px' }}>
                  {/* Image banner */}
                  <div style={{ height: '160px', background: 'linear-gradient(135deg,#1a1a1a,#374151)', position: 'relative', overflow: 'hidden' }}>
                    {ev.image_url
                      ? <img src={ev.image_url} alt={ev.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <ImageOff size={28} color="rgba(255,255,255,0.2)" />
                        </div>}
                    {/* Date badge */}
                    {dateObj && (
                      <div style={{ position: 'absolute', top: '0.65rem', left: '0.65rem', background: '#fff', borderRadius: '8px', padding: '0.35rem 0.55rem', textAlign: 'center', boxShadow: '0 2px 6px rgba(0,0,0,0.15)', minWidth: '38px' }}>
                        <div style={{ fontSize: '0.55rem', fontWeight: 700, color: '#ef4444', textTransform: 'uppercase', letterSpacing: '0.5px', lineHeight: 1 }}>{month}</div>
                        <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#111', lineHeight: 1.1 }}>{day}</div>
                      </div>
                    )}
                  </div>
                  {/* Body */}
                  <div style={{ padding: '0.9rem 1.1rem 1.1rem' }}>
                    <h3 style={{ fontWeight: 700, fontSize: '0.9rem', margin: '0 0 0.45rem', color: '#111', lineHeight: 1.3 }}>{ev.title}</h3>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem', marginBottom: ev.description ? '0.6rem' : 0 }}>
                      {ev.event_date && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.7rem', color: '#6b7280' }}>
                          <Calendar size={11} color="#9ca3af" /> {evFmtDate(ev.event_date)}
                        </span>
                      )}
                      {ev.event_time && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.7rem', color: '#6b7280' }}>
                          <Clock size={11} color="#9ca3af" /> {evFmtTime(ev.event_time)}
                        </span>
                      )}
                    </div>
                    {ev.description && (
                      <p style={{ fontSize: '0.75rem', color: '#6b7280', margin: 0, lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const, overflow: 'hidden' }}>
                        {ev.description}
                      </p>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </motion.section>

      {/* ── Building Information ── */}
      <motion.section
        style={{ marginBottom: '3rem' }}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.15, ease: 'easeOut' }}
      >
        <h2 className="text-xl" style={{ marginBottom: '1.5rem' }}>Building Information</h2>

        {/* Location */}
        <AccordionSection title="Location" open={openSection === 'Location'} onToggle={() => toggle('Location')}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.25rem' }}>
            <div className="d-flex gap-2 align-center">
              <MapPin size={18} color="#737373" style={{ flexShrink: 0 }} />
              <EditableField tag="p" storageKey="home.location.address" className="text-sm"
                defaultValue="402, 4th Floor, Tower-2, Phoenix Asia Towers, Byatarayanapura Village, Yelahanka Hobli, Bellary Road, Bengaluru- 560 092" />
            </div>
            <div className="d-flex gap-2 align-center">
              <Phone size={18} color="#737373" style={{ flexShrink: 0 }} />
              <EditableField tag="p" storageKey="home.location.phone" className="text-sm" defaultValue="+91 80 62 43 36 00" />
            </div>
            <div className="d-flex gap-2 align-center">
              <Mail size={18} color="#737373" style={{ flexShrink: 0 }} />
              <EditableField tag="p" storageKey="home.location.email" className="text-sm" defaultValue="sti@solu-m.com" />
            </div>
          </div>
          <EditableField tag="p" storageKey="home.location.description" className="text-sm text-muted"
            style={{ lineHeight: '1.6', paddingBottom: '1.25rem' }}
            defaultValue="Nestled among financial institutions, tech companies, and historical landmarks, our office space is designed to drive your work forward and foster growth. Located just minutes from major transit hubs with ample parking available." />
        </AccordionSection>

        {/* Hours of Working */}
        <AccordionSection title="Hours of Working" open={openSection === 'Hours'} onToggle={() => toggle('Hours')}>
          <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', columnGap: '3rem', rowGap: '0.5rem', marginTop: '0.5rem', paddingBottom: '1.25rem' }}>
            {hoursData.map(([day, hours]) => (
              <span key={day + 'group'} style={{ display: 'contents' }}>
                <span style={{ color: '#555', fontWeight: 500, fontSize: '0.875rem' }}>{day}</span>
                <span style={{ color: hours === 'Closed' ? '#EF4444' : '#333', fontSize: '0.875rem' }}>{hours}</span>
              </span>
            ))}
          </div>
        </AccordionSection>

        {/* Community Team */}
        <AccordionSection title="Community Team" open={openSection === 'Community'} onToggle={() => toggle('Community')}>
          <EditableField tag="p" storageKey="home.community.desc" className="text-sm text-muted"
            style={{ lineHeight: '1.6', marginTop: '0.5rem', marginBottom: '1.25rem' }}
            defaultValue="We are here to support you and help make the most of your experience at SOLUM. Don't hesitate to reach out to us directly." />
          <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', paddingBottom: '1.25rem' }}>
            {teamMembers.map(({ key, defaultName }) => (
              <div key={key} style={{ textAlign: 'center' }}>
                <EditableImage
                  storageKey={`home.team${key}.photo`}
                  defaultSrc="https://placehold.co/80x80/E5E5E5/888?text=%F0%9F%91%A4"
                  alt={defaultName}
                  style={{ width: '60px', height: '60px', borderRadius: '50%', objectFit: 'cover' }}
                  wrapperStyle={{ width: '60px', height: '60px', borderRadius: '50%', overflow: 'hidden', margin: '0 auto 0.5rem' }}
                />
                <EditableField
                  tag="p"
                  storageKey={`home.team${key}.name`}
                  defaultValue={defaultName}
                  style={{ fontSize: '0.75rem', fontWeight: 500, color: '#333' }}
                />
              </div>
            ))}
          </div>
        </AccordionSection>

        {/* Unique to this office */}
        <AccordionSection title="Unique to this office" open={openSection === 'Unique'} onToggle={() => toggle('Unique')} borderBottom>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem 2.5rem', marginTop: '0.5rem', paddingBottom: '1.25rem' }}>
            {amenities.map(({ Icon, label }) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: '#444' }}>
                <Icon size={16} color="#737373" />
                <span>{label}</span>
              </div>
            ))}
          </div>
        </AccordionSection>
      </motion.section>

      {/* ── Map ── */}
      <motion.section
        style={{ marginBottom: '4rem' }}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.18, ease: 'easeOut' }}
      >
        <div style={{ borderRadius: '12px', overflow: 'hidden', width: '100%', height: '300px', boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}>
          <iframe
            title="Solum Technologies India"
            src="https://maps.google.com/maps?q=Solum+Technologies+India+Private+Limited,+Bengaluru&output=embed&z=17"
            width="100%"
            height="300"
            style={{ border: 0, display: 'block' }}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
        <div style={{ marginTop: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.8rem', color: '#666' }}>📍</span>
          <a
            href="https://www.google.com/maps/place/Solum+Technologies+India+Private+Limited/@13.070118,77.5898906,17z"
            target="_blank"
            rel="noopener noreferrer"
            style={{ fontSize: '0.8rem', color: '#0066FF', textDecoration: 'none' }}
          >
            Open in Google Maps ↗
          </a>
        </div>
      </motion.section>

    </div>
  );
}
