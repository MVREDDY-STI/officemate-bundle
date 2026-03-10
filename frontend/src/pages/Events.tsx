import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Pencil, Trash2, X, Camera, Calendar, Clock, ChevronRight, ImageOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import ImageEditorModal from '../components/ImageEditorModal';

/* ── Types ───────────────────────────────────────────────────── */
interface Event {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  event_date: string | null;
  event_time: string | null;
  is_published: boolean;
  sort_order: number;
}

/* ── Helpers ─────────────────────────────────────────────────── */
function getToken() {
  try { return JSON.parse(sessionStorage.getItem('solum_auth') ?? '{}').token; } catch { return null; }
}
function authHeaders(): Record<string, string> {
  const t = getToken();
  return t ? { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' };
}
/** Normalise any date string to plain YYYY-MM-DD so appending T00:00:00 is safe. */
function toDateStr(d: string): string { return d.slice(0, 10); }

function fmtDate(d: string | null): string {
  if (!d) return '';
  try {
    return new Date(toDateStr(d) + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
  } catch { return d; }
}
function fmtTime(t: string | null): string {
  if (!t) return '';
  try {
    const [h, m] = t.split(':').map(Number);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const hh = h % 12 || 12;
    return `${hh}:${String(m).padStart(2, '0')} ${ampm}`;
  } catch { return t; }
}
function dayOfWeek(d: string | null): string {
  if (!d) return '';
  try { return new Date(toDateStr(d) + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'long' }); } catch { return ''; }
}

/* ── Event Form Modal ────────────────────────────────────────── */
interface EventFormProps {
  initial?: Partial<Event>;
  onClose: () => void;
  onSave: (ev: Event) => void;
}
function EventFormModal({ initial, onClose, onSave }: EventFormProps) {
  const isEdit = !!initial?.id;
  const [title, setTitle]       = useState(initial?.title ?? '');
  const [desc, setDesc]         = useState(initial?.description ?? '');
  const [date, setDate]         = useState(initial?.event_date?.slice(0, 10) ?? '');
  const [time, setTime]         = useState(initial?.event_time ?? '');
  const [imageUrl, setImageUrl] = useState(initial?.image_url ?? '');
  const [photoPreview, setPhotoPreview] = useState<string | null>(initial?.image_url ?? null);
  const [editorFile, setEditorFile] = useState<File | null>(null);
  const [saving, setSaving]     = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Open editor when image is picked
  const pickPhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    setEditorFile(file);
  };

  // Editor uploaded & returned the MinIO URL — use it directly
  const handleEditorSave = (url: string) => {
    setImageUrl(url);
    setPhotoPreview(url);
    setEditorFile(null);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    try {
      const payload = {
        title: title.trim(),
        description: desc.trim() || null,
        image_url: imageUrl || null,
        event_date: date || null,
        event_time: time || null,
        is_published: true,
      };
      const url = isEdit ? `/api/v1/events/${initial!.id}` : '/api/v1/events';
      const method = isEdit ? 'PATCH' : 'POST';
      const r = await fetch(url, { method, headers: authHeaders(), body: JSON.stringify(payload) });
      if (!r.ok) { const j = await r.json(); alert(j.error ?? 'Failed'); setSaving(false); return; }
      onSave(await r.json());
      onClose();
    } catch { alert('Network error'); setSaving(false); }
  };

  const INPUT = { border: '1px solid #e5e7eb', borderRadius: '8px', padding: '0.55rem 0.75rem', fontSize: '0.875rem', outline: 'none', width: '100%', boxSizing: 'border-box' as const, fontFamily: 'inherit' };

  return (
    <>
    {editorFile && (
      <ImageEditorModal
        file={editorFile}
        onClose={() => setEditorFile(null)}
        onSave={handleEditorSave}
      />
    )}
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}
      onClick={onClose}>
      <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ duration: 0.18 }}
        onClick={e => e.stopPropagation()}
        style={{ background: '#fff', borderRadius: '16px', width: '520px', maxWidth: '95vw', maxHeight: '92vh', overflowY: 'auto', boxShadow: '0 24px 64px rgba(0,0,0,0.22)' }}>

        {/* Image banner picker */}
        <div
          onClick={() => fileRef.current?.click()}
          style={{ height: '180px', background: photoPreview ? 'transparent' : 'linear-gradient(135deg,#f3f4f6,#e5e7eb)', borderRadius: '16px 16px 0 0', overflow: 'hidden', position: 'relative', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {photoPreview
            ? <img src={photoPreview} alt="banner" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', color: '#9ca3af' }}>
                <Camera size={28} />
                <span style={{ fontSize: '0.8rem', fontWeight: 500 }}>Click to add event image</span>
              </div>}
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0, transition: 'opacity 0.15s' }}
            onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
            onMouseLeave={e => (e.currentTarget.style.opacity = '0')}>
            <div style={{ background: 'rgba(255,255,255,0.9)', borderRadius: '8px', padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', fontWeight: 600 }}>
              <Camera size={14} /> {photoPreview ? 'Change image' : 'Add image'}
            </div>
          </div>
        </div>
        <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={pickPhoto} />

        <div style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h3 style={{ fontWeight: 700, fontSize: '1.05rem', margin: 0 }}>{isEdit ? 'Edit Event' : 'Create Event'}</h3>
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', padding: '2px' }}><X size={18} color="#888" /></button>
          </div>

          <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Title */}
            <div>
              <label style={{ display: 'block', fontSize: '0.72rem', color: '#555', marginBottom: '0.3rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.4px' }}>Title *</label>
              <input value={title} onChange={e => setTitle(e.target.value)} required placeholder="Event title…" style={INPUT} />
            </div>

            {/* Date + Time */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.72rem', color: '#555', marginBottom: '0.3rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.4px' }}>Date</label>
                <input type="date" value={date} onChange={e => setDate(e.target.value)} style={INPUT} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.72rem', color: '#555', marginBottom: '0.3rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.4px' }}>Time</label>
                <input type="time" value={time} onChange={e => setTime(e.target.value)} style={INPUT} />
              </div>
            </div>

            {/* Description */}
            <div>
              <label style={{ display: 'block', fontSize: '0.72rem', color: '#555', marginBottom: '0.3rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.4px' }}>Description</label>
              <textarea value={desc} onChange={e => setDesc(e.target.value)} placeholder="What's this event about…" rows={4}
                style={{ ...INPUT, resize: 'vertical', minHeight: '90px' }} />
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', paddingTop: '0.25rem' }}>
              <button type="button" onClick={onClose} style={{ flex: 1, padding: '0.6rem', border: '1px solid #e5e7eb', borderRadius: '8px', background: '#fff', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 500 }}>Cancel</button>
              <button type="submit" disabled={saving}
                style={{ flex: 2, padding: '0.6rem', border: 'none', borderRadius: '8px', background: '#1a1a1a', color: '#fff', cursor: saving ? 'default' : 'pointer', fontSize: '0.875rem', fontWeight: 600, opacity: saving ? 0.7 : 1 }}>
                {saving ? (isEdit ? 'Saving…' : 'Creating…') : (isEdit ? 'Save Changes' : 'Create Event')}
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
    </>
  );
}

/* ── Delete confirmation dialog ──────────────────────────────── */
function DeleteConfirmModal({ event, onClose, onConfirm }: { event: Event; onClose: () => void; onConfirm: () => void }) {
  const [deleting, setDeleting] = useState(false);
  const confirm = async () => {
    setDeleting(true);
    await onConfirm();
    onClose();
  };
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}
      onClick={onClose}>
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
        onClick={e => e.stopPropagation()}
        style={{ background: '#fff', borderRadius: '14px', padding: '1.75rem', width: '380px', maxWidth: '95vw', boxShadow: '0 16px 48px rgba(0,0,0,0.2)' }}>
        <div style={{ width: '44px', height: '44px', background: '#fff1f2', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
          <Trash2 size={20} color="#ef4444" />
        </div>
        <h3 style={{ fontWeight: 700, fontSize: '1rem', margin: '0 0 0.4rem' }}>Delete Event</h3>
        <p style={{ color: '#6b7280', fontSize: '0.875rem', margin: '0 0 1.25rem', lineHeight: 1.5 }}>
          Are you sure you want to delete <strong>"{event.title}"</strong>? This action cannot be undone.
        </p>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button onClick={onClose} style={{ flex: 1, padding: '0.6rem', border: '1px solid #e5e7eb', borderRadius: '8px', background: '#fff', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 500 }}>Cancel</button>
          <button onClick={confirm} disabled={deleting} style={{ flex: 1, padding: '0.6rem', border: 'none', borderRadius: '8px', background: '#ef4444', color: '#fff', cursor: deleting ? 'default' : 'pointer', fontSize: '0.875rem', fontWeight: 600, opacity: deleting ? 0.7 : 1 }}>
            {deleting ? 'Deleting…' : 'Delete'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

/* ── Event Card ──────────────────────────────────────────────── */
function EventCard({ event, isAdmin, onEdit, onDelete }: {
  event: Event; isAdmin: boolean;
  onEdit: () => void; onDelete: () => void;
}) {
  const [hovered, setHovered] = useState(false);

  // Extract month + day — slice to YYYY-MM-DD before constructing Date
  const dateObj = event.event_date ? new Date(toDateStr(event.event_date) + 'T00:00:00') : null;
  const month = dateObj ? dateObj.toLocaleDateString('en-IN', { month: 'short' }).toUpperCase() : null;
  const day   = dateObj ? dateObj.getDate() : null;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.22 }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ borderRadius: '14px', overflow: 'hidden', border: '1px solid #e5e7eb', background: '#fff', boxShadow: hovered ? '0 8px 28px rgba(0,0,0,0.1)' : '0 1px 4px rgba(0,0,0,0.05)', transition: 'box-shadow 0.2s, transform 0.2s', transform: hovered ? 'translateY(-3px)' : 'none', position: 'relative' }}>

      {/* Image banner */}
      <div style={{ height: '180px', background: 'linear-gradient(135deg,#1a1a1a,#374151)', position: 'relative', overflow: 'hidden' }}>
        {event.image_url
          ? <img src={event.image_url} alt={event.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ImageOff size={36} color="rgba(255,255,255,0.2)" />
            </div>}

        {/* Date badge */}
        {dateObj && (
          <div style={{ position: 'absolute', top: '0.75rem', left: '0.75rem', background: '#fff', borderRadius: '10px', padding: '0.4rem 0.65rem', textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.15)', minWidth: '44px' }}>
            <div style={{ fontSize: '0.6rem', fontWeight: 700, color: '#ef4444', textTransform: 'uppercase', letterSpacing: '0.5px', lineHeight: 1 }}>{month}</div>
            <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#111', lineHeight: 1.1 }}>{day}</div>
          </div>
        )}

        {/* Admin action buttons */}
        {isAdmin && (
          <div style={{ position: 'absolute', top: '0.75rem', right: '0.75rem', display: 'flex', gap: '0.4rem', opacity: hovered ? 1 : 0, transition: 'opacity 0.15s' }}>
            <button
              onClick={e => { e.stopPropagation(); onEdit(); }}
              style={{ width: '30px', height: '30px', background: 'rgba(255,255,255,0.92)', border: 'none', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 6px rgba(0,0,0,0.15)' }}>
              <Pencil size={13} color="#1a1a1a" />
            </button>
            <button
              onClick={e => { e.stopPropagation(); onDelete(); }}
              style={{ width: '30px', height: '30px', background: 'rgba(255,255,255,0.92)', border: 'none', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 6px rgba(0,0,0,0.15)' }}>
              <Trash2 size={13} color="#ef4444" />
            </button>
          </div>
        )}
      </div>

      {/* Card body */}
      <div style={{ padding: '1.1rem 1.25rem' }}>
        <h3 style={{ fontWeight: 700, fontSize: '0.95rem', color: '#111', margin: '0 0 0.5rem', lineHeight: 1.35 }}>{event.title}</h3>

        {/* Date + time row */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginBottom: event.description ? '0.75rem' : 0 }}>
          {event.event_date && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.72rem', color: '#6b7280' }}>
              <Calendar size={12} color="#9ca3af" />
              <span>{dayOfWeek(event.event_date)}, {fmtDate(event.event_date)}</span>
            </div>
          )}
          {event.event_time && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.72rem', color: '#6b7280' }}>
              <Clock size={12} color="#9ca3af" />
              <span>{fmtTime(event.event_time)}</span>
            </div>
          )}
        </div>

        {event.description && (
          <p style={{ fontSize: '0.78rem', color: '#6b7280', margin: 0, lineHeight: 1.55, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const, overflow: 'hidden' }}>
            {event.description}
          </p>
        )}
      </div>
    </motion.div>
  );
}

/* ── Main page ───────────────────────────────────────────────── */
const Events = () => {
  const { isAdmin } = useAuth();
  const [events, setEvents]           = useState<Event[]>([]);
  const [loading, setLoading]         = useState(true);
  const [showCreate, setShowCreate]   = useState(false);
  const [editEvent, setEditEvent]     = useState<Event | null>(null);
  const [deleteEvent, setDeleteEvent] = useState<Event | null>(null);

  // Admin sees all events (including past); public sees upcoming only
  const fetchEvents = () => {
    const url = isAdmin ? '/api/v1/events?all=true' : '/api/v1/events';
    fetch(url, isAdmin ? { headers: authHeaders() } : {})
      .then(r => r.json())
      .then(d => { setEvents(Array.isArray(d) ? d : []); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => { fetchEvents(); }, [isAdmin]);

  const handleSave = (ev: Event) => {
    setEvents(prev => {
      const idx = prev.findIndex(e => e.id === ev.id);
      if (idx >= 0) { const next = [...prev]; next[idx] = ev; return next; }
      return [ev, ...prev];
    });
  };

  const handleDelete = async (ev: Event) => {
    await fetch(`/api/v1/events/${ev.id}`, { method: 'DELETE', headers: authHeaders() });
    setEvents(prev => prev.filter(e => e.id !== ev.id));
  };

  // Group events into upcoming vs past — compare YYYY-MM-DD strings only
  const todayStr = new Date().toISOString().slice(0, 10);
  const upcoming = events.filter(e => !e.event_date || toDateStr(e.event_date) >= todayStr);
  const past     = events.filter(e => e.event_date  && toDateStr(e.event_date) <  todayStr);

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem', fontFamily: 'sans-serif' }}>
      {/* Header */}
      <motion.div
        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2.5rem' }}
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, color: '#111', margin: '0 0 0.25rem' }}>Events</h1>
          {!loading && (
            <p style={{ color: '#9ca3af', fontSize: '0.85rem', margin: 0 }}>
              {upcoming.length > 0 ? `${upcoming.length} upcoming event${upcoming.length !== 1 ? 's' : ''}` : 'No upcoming events'}
            </p>
          )}
        </div>
        {isAdmin && (
          <button
            onClick={() => setShowCreate(true)}
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.55rem 1rem', background: '#1a1a1a', color: '#fff', border: 'none', borderRadius: '10px', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 600, boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}>
            <Plus size={15} /> Create Event
          </button>
        )}
      </motion.div>

      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.25rem' }}>
          {[1, 2, 3].map(i => (
            <div key={i} style={{ borderRadius: '14px', overflow: 'hidden', border: '1px solid #e5e7eb' }}>
              <div style={{ height: '180px', background: 'linear-gradient(90deg, #f0f0f0 25%, #e8e8e8 50%, #f0f0f0 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.4s infinite' }} />
              <div style={{ padding: '1.1rem 1.25rem' }}>
                <div style={{ height: '14px', background: '#f0f0f0', borderRadius: '6px', marginBottom: '0.6rem', width: '75%' }} />
                <div style={{ height: '10px', background: '#f0f0f0', borderRadius: '4px', width: '50%' }} />
              </div>
            </div>
          ))}
        </div>
      ) : events.length === 0 ? (
        /* Empty state */
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          style={{ textAlign: 'center', padding: '5rem 2rem', background: '#f9fafb', borderRadius: '20px', border: '2px dashed #e5e7eb' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📅</div>
          <h3 style={{ fontWeight: 700, color: '#111', margin: '0 0 0.5rem' }}>No upcoming events</h3>
          <p style={{ color: '#9ca3af', margin: '0 0 1.5rem', fontSize: '0.875rem' }}>
            {isAdmin ? 'Create your first event to get started.' : 'Check back later for upcoming events.'}
          </p>
          {isAdmin && (
            <button onClick={() => setShowCreate(true)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.6rem 1.25rem', background: '#1a1a1a', color: '#fff', border: 'none', borderRadius: '10px', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 600 }}>
              <Plus size={15} /> Create First Event
            </button>
          )}
        </motion.div>
      ) : (
        <>
          {/* Upcoming events */}
          {upcoming.length > 0 && (
            <section style={{ marginBottom: '3rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
                <h2 style={{ fontWeight: 700, fontSize: '1rem', color: '#111', margin: 0 }}>Upcoming</h2>
                <span style={{ background: '#dcfce7', color: '#166534', fontSize: '0.68rem', fontWeight: 700, padding: '0.15rem 0.5rem', borderRadius: '20px' }}>{upcoming.length}</span>
              </div>
              <motion.div
                layout
                style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.25rem' }}>
                <AnimatePresence>
                  {upcoming.map(ev => (
                    <EventCard key={ev.id} event={ev} isAdmin={isAdmin}
                      onEdit={() => setEditEvent(ev)} onDelete={() => setDeleteEvent(ev)} />
                  ))}
                </AnimatePresence>
              </motion.div>
            </section>
          )}

          {/* Past events (admin only) */}
          {isAdmin && past.length > 0 && (
            <section>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
                <h2 style={{ fontWeight: 700, fontSize: '1rem', color: '#6b7280', margin: 0 }}>Past Events</h2>
                <span style={{ background: '#f3f4f6', color: '#6b7280', fontSize: '0.68rem', fontWeight: 700, padding: '0.15rem 0.5rem', borderRadius: '20px' }}>{past.length}</span>
                <span style={{ fontSize: '0.7rem', color: '#9ca3af' }}>— Admin only · kept for reference</span>
              </div>
              <motion.div layout style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.25rem', opacity: 0.7 }}>
                <AnimatePresence>
                  {past.map(ev => (
                    <EventCard key={ev.id} event={ev} isAdmin={isAdmin}
                      onEdit={() => setEditEvent(ev)} onDelete={() => setDeleteEvent(ev)} />
                  ))}
                </AnimatePresence>
              </motion.div>
            </section>
          )}
        </>
      )}

      {/* Modals */}
      <AnimatePresence>
        {showCreate && (
          <EventFormModal onClose={() => setShowCreate(false)} onSave={handleSave} />
        )}
        {editEvent && (
          <EventFormModal initial={editEvent} onClose={() => setEditEvent(null)} onSave={ev => { handleSave(ev); setEditEvent(null); }} />
        )}
        {deleteEvent && (
          <DeleteConfirmModal event={deleteEvent} onClose={() => setDeleteEvent(null)}
            onConfirm={() => handleDelete(deleteEvent)} />
        )}
      </AnimatePresence>

      <style>{`
        @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
      `}</style>
    </div>
  );
};

export default Events;
