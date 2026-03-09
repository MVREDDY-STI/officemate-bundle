import { useState, useEffect, useRef } from 'react';
import { Monitor, Plus, Trash2, Edit2, Wifi, WifiOff, Upload, X,
         ChevronUp, ChevronDown, Clock, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';
import { apiGet, apiPost, apiPatch, apiDelete, apiUpload, BASE } from '../services/api';
import { useAuth } from '../context/AuthContext';

// ── Types ──────────────────────────────────────────────────────
type TvDisplay = {
  id: string; name: string; device_id: string;
  room_id: string | null; room_name: string | null;
  last_seen_at: string | null; is_online: boolean;
};
type Room = { id: string; name: string; room_code: string };
type SlideType = 'text' | 'quote_avatar' | 'image' | 'birthday';
type Slide = {
  id: string; title: string; slide_type: SlideType;
  content: Record<string, unknown>; duration_seconds: number;
  sort_order: number; target: 'all' | 'specific'; is_active: boolean;
  starts_at: string | null; ends_at: string | null;
  is_expired: boolean; is_scheduled: boolean;
  display_targets: { display_id: string; display_name: string }[];
};
type PairResult = {
  id: string; name: string; pairing_code: string; pairing_expires_at: string;
};

const SLIDE_TYPE_LABELS: Record<SlideType, string> = {
  text:         'Notice / Announcement',
  quote_avatar: 'Quote + Avatar',
  image:        'Event Image',
  birthday:     'Birthday',
};

const SLIDE_TYPE_DESC: Record<SlideType, string> = {
  text:         'Display a heading and body message',
  quote_avatar: 'Inspirational quote with circular avatar',
  image:        'Full-bleed image with title overlay',
  birthday:     'Birthday card with photo & footer',
};

// ── Main Page ──────────────────────────────────────────────────
export default function TvSetup() {
  const { isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState<'displays' | 'slides' | 'logo'>('displays');

  if (!isAdmin) return (
    <div style={{ padding: '3rem', textAlign: 'center', color: '#666' }}>
      Admin access required to manage TV Setup.
    </div>
  );

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '2rem' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#111', marginBottom: '0.25rem' }}>TV Setup</h1>
        <p style={{ color: '#666', fontSize: '0.875rem' }}>Manage TV displays, sidebar slides, and logo.</p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.25rem', borderBottom: '2px solid #E5E7EB', marginBottom: '2rem' }}>
        {(['displays', 'slides', 'logo'] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} style={{
            padding: '0.6rem 1.25rem', border: 'none', background: 'none', cursor: 'pointer',
            fontSize: '0.875rem', fontWeight: activeTab === tab ? 700 : 400,
            color: activeTab === tab ? '#111' : '#666',
            borderBottom: activeTab === tab ? '2px solid #111' : '2px solid transparent',
            marginBottom: '-2px', transition: 'all 0.15s',
          }}>
            {tab === 'displays' ? 'TV Displays' : tab === 'slides' ? 'Sidebar Slides' : 'Branding'}
          </button>
        ))}
      </div>

      {activeTab === 'displays' && <DisplaysTab />}
      {activeTab === 'slides'   && <SlidesTab />}
      {activeTab === 'logo'     && <LogoTab />}
    </div>
  );
}

// ── Displays Tab ───────────────────────────────────────────────
function DisplaysTab() {
  const [displays, setDisplays]   = useState<TvDisplay[]>([]);
  const [rooms, setRooms]         = useState<Room[]>([]);
  const [loading, setLoading]     = useState(true);
  const [pairResult, setPairResult] = useState<PairResult | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName]   = useState('');
  const [editRoomId, setEditRoomId] = useState<string>('');
  const [pairName, setPairName]   = useState('');
  const [showPairModal, setShowPairModal] = useState(false);

  const load = async () => {
    try {
      const [d, r] = await Promise.all([
        apiGet<TvDisplay[]>('/api/v1/displays'),
        apiGet<Room[]>('/api/v1/rooms'),
      ]);
      setDisplays(d); setRooms(r);
    } catch { toast.error('Failed to load displays'); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const handlePair = async () => {
    try {
      const result = await apiPost<PairResult>('/api/v1/displays/pair-code', { name: pairName || 'TV Display' });
      setPairResult(result); setPairName('');
    } catch { toast.error('Failed to generate pairing code'); }
  };

  const handleUpdate = async (id: string) => {
    try {
      await apiPatch(`/api/v1/displays/${id}`, { name: editName, room_id: editRoomId || null });
      toast.success('Display updated'); setEditingId(null); load();
    } catch { toast.error('Failed to update display'); }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Remove display "${name}"?`)) return;
    try { await apiDelete(`/api/v1/displays/${id}`); toast.success('Display removed'); load(); }
    catch { toast.error('Failed to remove display'); }
  };

  if (loading) return <p style={{ color: '#666' }}>Loading...</p>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1rem', fontWeight: 600, color: '#111' }}>Registered Displays ({displays.length})</h2>
        <button className="btn btn-primary"
          style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.875rem', padding: '0.5rem 1rem' }}
          onClick={() => setShowPairModal(true)}>
          <Plus size={16} /> Add Display
        </button>
      </div>

      {displays.length === 0 ? (
        <EmptyState icon={<Monitor size={32} />} text="No displays registered yet. Add a display to get started." />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {displays.map(d => (
            <div key={d.id} style={{
              background: '#fff', border: '1px solid #E5E7EB', borderRadius: '8px',
              padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', gap: '1rem',
            }}>
              <div style={{
                width: '10px', height: '10px', borderRadius: '50%',
                background: d.is_online ? '#10B981' : '#D1D5DB', flexShrink: 0,
              }} />
              {editingId === d.id ? (
                <div style={{ flex: 1, display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
                  <input value={editName} onChange={e => setEditName(e.target.value)}
                    style={{ ...iStyle, flex: '1', minWidth: '120px' }} placeholder="Display name" />
                  <select value={editRoomId} onChange={e => setEditRoomId(e.target.value)} style={iStyle}>
                    <option value="">No room linked</option>
                    {rooms.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                  </select>
                  <button className="btn btn-primary" style={{ padding: '0.35rem 0.8rem', fontSize: '0.8rem' }} onClick={() => handleUpdate(d.id)}>Save</button>
                  <button className="btn btn-outline" style={{ padding: '0.35rem 0.8rem', fontSize: '0.8rem' }} onClick={() => setEditingId(null)}>Cancel</button>
                </div>
              ) : (
                <>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem', color: '#111' }}>{d.name}</div>
                    <div style={{ fontSize: '0.78rem', color: '#666', marginTop: '0.15rem' }}>
                      {d.room_name ? `Room: ${d.room_name}` : 'No room linked'}
                      {d.last_seen_at && <span style={{ marginLeft: '0.75rem' }}>Last seen: {new Date(d.last_seen_at).toLocaleString()}</span>}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: d.is_online ? '#059669' : '#9CA3AF', fontSize: '0.78rem' }}>
                    {d.is_online ? <Wifi size={14} /> : <WifiOff size={14} />}
                    {d.is_online ? 'Online' : 'Offline'}
                  </div>
                  <button className="btn btn-outline"
                    style={{ padding: '0.35rem 0.6rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                    onClick={() => { setEditingId(d.id); setEditName(d.name); setEditRoomId(d.room_id ?? ''); }}>
                    <Edit2 size={13} /> Edit
                  </button>
                  <button className="btn btn-outline"
                    style={{ padding: '0.35rem 0.6rem', fontSize: '0.8rem', color: '#DC2626', borderColor: '#FCA5A5' }}
                    onClick={() => handleDelete(d.id, d.name)}>
                    <Trash2 size={13} />
                  </button>
                </>
              )}
            </div>
          ))}
        </div>
      )}

      {showPairModal && (
        <Modal title="Add New Display" onClose={() => { setShowPairModal(false); setPairResult(null); }}>
          {pairResult ? (
            <div style={{ textAlign: 'center', padding: '1rem' }}>
              <div style={{ fontSize: '0.875rem', color: '#666', marginBottom: '1rem' }}>Enter this code in the TV app:</div>
              <div style={{
                fontSize: '2.5rem', fontWeight: 800, letterSpacing: '0.3rem',
                background: '#1A1A1A', color: '#fff', padding: '1rem 2rem',
                borderRadius: '12px', fontFamily: 'monospace', display: 'inline-block',
              }}>{pairResult.pairing_code}</div>
              <div style={{ fontSize: '0.78rem', color: '#9CA3AF', marginTop: '0.75rem' }}>
                Expires in 15 minutes · Single-use
              </div>
              <button className="btn btn-outline" style={{ marginTop: '1.25rem' }}
                onClick={() => { setShowPairModal(false); setPairResult(null); load(); }}>
                Done
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <Field label="Display Name (optional)">
                <input value={pairName} onChange={e => setPairName(e.target.value)}
                  placeholder="e.g. Reception TV" style={iStyle} />
              </Field>
              <button className="btn btn-primary" onClick={handlePair}>Generate Pairing Code</button>
            </div>
          )}
        </Modal>
      )}
    </div>
  );
}

// ── Slides Tab ─────────────────────────────────────────────────
function SlidesTab() {
  const [slides, setSlides]     = useState<Slide[]>([]);
  const [displays, setDisplays] = useState<TvDisplay[]>([]);
  const [loading, setLoading]   = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editSlide, setEditSlide] = useState<Slide | null>(null);

  const load = async () => {
    try {
      const [s, d] = await Promise.all([
        apiGet<Slide[]>('/api/v1/slides'),
        apiGet<TvDisplay[]>('/api/v1/displays'),
      ]);
      setSlides(s); setDisplays(d);
    } catch { toast.error('Failed to load slides'); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Delete slide "${title}"?`)) return;
    try { await apiDelete(`/api/v1/slides/${id}`); toast.success('Slide deleted'); load(); }
    catch { toast.error('Failed to delete slide'); }
  };

  const handleToggle = async (slide: Slide) => {
    try { await apiPatch(`/api/v1/slides/${slide.id}`, { is_active: !slide.is_active }); load(); }
    catch { toast.error('Failed to update slide'); }
  };

  const handleMove = async (slide: Slide, dir: 'up' | 'down') => {
    const idx = slides.indexOf(slide);
    const other = slides[dir === 'up' ? idx - 1 : idx + 1];
    if (!other) return;
    try {
      await Promise.all([
        apiPatch(`/api/v1/slides/${slide.id}`, { sort_order: other.sort_order }),
        apiPatch(`/api/v1/slides/${other.id}`, { sort_order: slide.sort_order }),
      ]);
      load();
    } catch { toast.error('Failed to reorder'); }
  };

  if (loading) return <p style={{ color: '#666' }}>Loading...</p>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1rem', fontWeight: 600, color: '#111' }}>Sidebar Slides ({slides.length})</h2>
        <button className="btn btn-primary"
          style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.875rem', padding: '0.5rem 1rem' }}
          onClick={() => { setEditSlide(null); setShowForm(true); }}>
          <Plus size={16} /> Add Slide
        </button>
      </div>

      {slides.length === 0 ? (
        <EmptyState icon={null} text="No slides yet. Add one to display content in the TV sidebar." />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {slides.map((slide, idx) => (
            <div key={slide.id} style={{
              background: '#fff', border: '1px solid #E5E7EB', borderRadius: '8px',
              padding: '0.875rem 1.25rem', display: 'flex', alignItems: 'center', gap: '1rem',
              opacity: slide.is_active && !slide.is_expired ? 1 : 0.55,
            }}>
              {/* Reorder */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <button className="btn btn-outline" style={{ padding: '2px 4px', border: 'none' }}
                  onClick={() => handleMove(slide, 'up')} disabled={idx === 0}><ChevronUp size={14} /></button>
                <button className="btn btn-outline" style={{ padding: '2px 4px', border: 'none' }}
                  onClick={() => handleMove(slide, 'down')} disabled={idx === slides.length - 1}><ChevronDown size={14} /></button>
              </div>

              {/* Slide type icon */}
              <div style={{
                width: '36px', height: '36px', borderRadius: '8px', flexShrink: 0,
                background: slideTypeColor(slide.slide_type) + '15',
                border: `1px solid ${slideTypeColor(slide.slide_type)}30`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1.1rem',
              }}>
                {slideTypeIcon(slide.slide_type)}
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: '0.9rem', color: '#111' }}>{slide.title}</div>
                <div style={{ fontSize: '0.78rem', color: '#666', marginTop: '0.15rem', display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center' }}>
                  <span style={{ background: '#F3F4F6', padding: '1px 6px', borderRadius: '4px' }}>
                    {SLIDE_TYPE_LABELS[slide.slide_type]}
                  </span>
                  <span>{slide.duration_seconds}s</span>
                  <span style={{ color: slide.target === 'all' ? '#059669' : '#7C3AED' }}>
                    {slide.target === 'all' ? '● All displays' : `● ${slide.display_targets.length} display(s)`}
                  </span>
                  {/* Schedule info */}
                  {(slide.starts_at || slide.ends_at) && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '3px', color: '#6B7280' }}>
                      <Calendar size={11} />
                      {slide.starts_at && <span>{fmtDate(slide.starts_at)}</span>}
                      {slide.starts_at && slide.ends_at && <span>→</span>}
                      {slide.ends_at && <span>{fmtDate(slide.ends_at)}</span>}
                    </span>
                  )}
                </div>
              </div>

              {/* Status badges */}
              <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                {slide.is_expired && (
                  <span style={{ padding: '2px 8px', borderRadius: '20px', fontSize: '0.72rem', fontWeight: 600, background: '#FEE2E2', color: '#991B1B' }}>
                    Expired
                  </span>
                )}
                {slide.is_scheduled && !slide.is_expired && (
                  <span style={{ padding: '2px 8px', borderRadius: '20px', fontSize: '0.72rem', fontWeight: 600, background: '#EFF6FF', color: '#1D4ED8', display: 'flex', alignItems: 'center', gap: '3px' }}>
                    <Clock size={10} /> Scheduled
                  </span>
                )}
                <button onClick={() => handleToggle(slide)} style={{
                  padding: '0.3rem 0.7rem', borderRadius: '20px', border: 'none',
                  cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600,
                  background: slide.is_active ? '#D1FAE5' : '#F3F4F6',
                  color: slide.is_active ? '#065F46' : '#6B7280',
                }}>
                  {slide.is_active ? 'Active' : 'Inactive'}
                </button>
              </div>

              <button className="btn btn-outline"
                style={{ padding: '0.35rem 0.6rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                onClick={() => { setEditSlide(slide); setShowForm(true); }}>
                <Edit2 size={13} /> Edit
              </button>
              <button className="btn btn-outline"
                style={{ padding: '0.35rem 0.6rem', fontSize: '0.8rem', color: '#DC2626', borderColor: '#FCA5A5' }}
                onClick={() => handleDelete(slide.id, slide.title)}>
                <Trash2 size={13} />
              </button>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <SlideFormModal
          slide={editSlide} displays={displays}
          onClose={() => { setShowForm(false); setEditSlide(null); }}
          onSaved={() => { setShowForm(false); setEditSlide(null); load(); }}
        />
      )}
    </div>
  );
}

// ── Slide Form Modal ───────────────────────────────────────────
function SlideFormModal({ slide, displays, onClose, onSaved }: {
  slide: Slide | null; displays: TvDisplay[];
  onClose: () => void; onSaved: () => void;
}) {
  const isEdit    = !!slide;
  const [title, setTitle]         = useState(slide?.title ?? '');
  const [slideType, setSlideType] = useState<SlideType>(slide?.slide_type ?? 'text');
  const [duration, setDuration]   = useState(slide?.duration_seconds ?? 8);
  const [sortOrder, setSortOrder] = useState(slide?.sort_order ?? 0);
  const [target, setTarget]       = useState<'all' | 'specific'>(slide?.target ?? 'all');
  const [isActive, setIsActive]   = useState(slide?.is_active ?? true);
  const [startsAt, setStartsAt]   = useState(slide?.starts_at ? toLocalDt(slide.starts_at) : '');
  const [endsAt, setEndsAt]       = useState(slide?.ends_at   ? toLocalDt(slide.ends_at)   : '');
  const [selectedDisplayIds, setSelectedDisplayIds] = useState<string[]>(
    slide?.display_targets?.map(t => t.display_id) ?? [],
  );
  const [content, setContent] = useState<Record<string, string>>(
    Object.fromEntries(Object.entries(slide?.content ?? {}).map(([k, v]) => [k, String(v ?? '')])),
  );
  const [saving, setSaving]       = useState(false);
  const [uploading, setUploading] = useState<string | null>(null); // field name being uploaded

  const setC = (key: string, val: string) => setContent(c => ({ ...c, [key]: val }));

  const handleUpload = async (field: string, file: File) => {
    setUploading(field);
    try {
      const fd = new FormData(); fd.append('file', file);
      const result = await apiUpload<{ url: string }>('/api/v1/uploads', fd);
      const url = result.url.startsWith('http') ? result.url : `${BASE}${result.url}`;
      setC(field, url);
      toast.success('Image uploaded');
    } catch { toast.error('Upload failed'); }
    finally { setUploading(null); }
  };

  const handleSubmit = async () => {
    if (!title.trim()) { toast.error('Title is required'); return; }
    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        title, slide_type: slideType, duration_seconds: duration,
        sort_order: sortOrder, target, is_active: isActive, content,
        display_ids: target === 'specific' ? selectedDisplayIds : [],
        starts_at: startsAt ? new Date(startsAt).toISOString() : null,
        ends_at:   endsAt   ? new Date(endsAt).toISOString()   : null,
      };
      if (isEdit && slide) {
        await apiPatch(`/api/v1/slides/${slide.id}`, payload);
        toast.success('Slide updated');
      } else {
        await apiPost('/api/v1/slides', payload);
        toast.success('Slide created');
      }
      onSaved();
    } catch { toast.error('Failed to save slide'); }
    finally { setSaving(false); }
  };

  const toggleDisplay = (id: string) =>
    setSelectedDisplayIds(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);

  return (
    <Modal title={isEdit ? 'Edit Slide' : 'Add Slide'} onClose={onClose} wide>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

        {/* Slide type selector with visual cards */}
        <Field label="Type">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
            {(Object.entries(SLIDE_TYPE_LABELS) as [SlideType, string][]).map(([val, label]) => (
              <button key={val} type="button"
                onClick={() => setSlideType(val)}
                style={{
                  padding: '0.6rem 0.75rem', border: '2px solid',
                  borderColor: slideType === val ? slideTypeColor(val) : '#E5E7EB',
                  borderRadius: '8px', cursor: 'pointer', textAlign: 'left',
                  background: slideType === val ? slideTypeColor(val) + '10' : '#fff',
                  transition: 'all 0.15s',
                }}>
                <div style={{ fontSize: '1.1rem', marginBottom: '2px' }}>{slideTypeIcon(val)}</div>
                <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#111' }}>{label}</div>
                <div style={{ fontSize: '0.72rem', color: '#666' }}>{SLIDE_TYPE_DESC[val]}</div>
              </button>
            ))}
          </div>
        </Field>

        <Field label="Title">
          <input value={title} onChange={e => setTitle(e.target.value)}
            placeholder="Slide title (for reference)" style={iStyle} />
        </Field>

        {/* ── Content fields per type ── */}
        {slideType === 'text' && (<>
          <Field label="Heading">
            <input value={content.heading ?? ''} onChange={e => setC('heading', e.target.value)} placeholder="Notice Title (e.g. Office Closed Tomorrow)" style={iStyle} />
          </Field>
          <Field label="Body Text">
            <textarea value={content.body ?? ''} onChange={e => setC('body', e.target.value)}
              rows={4} placeholder="Enter the notice or announcement message..." style={{ ...iStyle, resize: 'vertical' }} />
          </Field>
        </>)}

        {slideType === 'quote_avatar' && (<>
          <Field label="Quote Text">
            <textarea value={content.text ?? ''} onChange={e => setC('text', e.target.value)}
              rows={4} placeholder="Enter quote..." style={{ ...iStyle, resize: 'vertical' }} />
          </Field>
          <Field label="Author Name">
            <input value={content.author ?? ''} onChange={e => setC('author', e.target.value)} placeholder="Mohandas Karamchand Gandhi" style={iStyle} />
          </Field>
          <Field label="Author Designation">
            <input value={content.designation ?? ''} onChange={e => setC('designation', e.target.value)} placeholder="Father of the Nation" style={iStyle} />
          </Field>
          <Field label="Avatar Image">
            <ImageInput value={content.avatar_url ?? ''} onChange={v => setC('avatar_url', v)}
              onUpload={f => handleUpload('avatar_url', f)} uploading={uploading === 'avatar_url'} />
          </Field>
        </>)}

        {slideType === 'image' && (<>
          <Field label="Event Image">
            <ImageInput value={content.image_url ?? ''} onChange={v => setC('image_url', v)}
              onUpload={f => handleUpload('image_url', f)} uploading={uploading === 'image_url'} />
          </Field>
          <Field label="Event Title">
            <input value={content.title ?? ''} onChange={e => setC('title', e.target.value)} placeholder="Happy Labour Day" style={iStyle} />
          </Field>
          <Field label="Subtitle / Date (optional)">
            <input value={content.subtitle ?? ''} onChange={e => setC('subtitle', e.target.value)} placeholder="May 1st 2024" style={iStyle} />
          </Field>
        </>)}

        {slideType === 'birthday' && (<>
          <Field label="Person Name">
            <input value={content.name ?? ''} onChange={e => setC('name', e.target.value)} placeholder="Hugo Hwangjoo Cho" style={iStyle} />
          </Field>
          <Field label="Role / Designation">
            <input value={content.designation ?? ''} onChange={e => setC('designation', e.target.value)} placeholder="Head of Technical Engineering, CTO" style={iStyle} />
          </Field>
          <Field label="Person Photo">
            <ImageInput value={content.image_url ?? ''} onChange={v => setC('image_url', v)}
              onUpload={f => handleUpload('image_url', f)} uploading={uploading === 'image_url'} />
          </Field>
        </>)}

        {/* Duration + sort */}
        <div style={{ display: 'flex', gap: '1rem' }}>
          <Field label="Duration (seconds)" style={{ flex: 1 }}>
            <input type="number" value={duration} min={2} max={60} onChange={e => setDuration(Number(e.target.value))} style={iStyle} />
          </Field>
          <Field label="Sort Order" style={{ flex: 1 }}>
            <input type="number" value={sortOrder} min={0} onChange={e => setSortOrder(Number(e.target.value))} style={iStyle} />
          </Field>
        </div>

        {/* Schedule */}
        <div style={{ background: '#F9FAFB', borderRadius: '8px', padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', fontWeight: 600, color: '#374151' }}>
            <Clock size={14} /> Schedule (optional — leave blank to always show)
          </div>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <Field label="Start date & time" style={{ flex: 1 }}>
              <input type="datetime-local" value={startsAt} onChange={e => setStartsAt(e.target.value)} style={iStyle} />
            </Field>
            <Field label="End date & time" style={{ flex: 1 }}>
              <input type="datetime-local" value={endsAt} onChange={e => setEndsAt(e.target.value)} style={iStyle} />
            </Field>
          </div>
          {endsAt && new Date(endsAt) < new Date() && (
            <div style={{ color: '#DC2626', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              ⚠ End time is in the past — this slide will not be shown on displays.
            </div>
          )}
        </div>

        {/* Target */}
        <Field label="Target Displays">
          <select value={target} onChange={e => setTarget(e.target.value as 'all' | 'specific')} style={iStyle}>
            <option value="all">All Displays</option>
            <option value="specific">Specific Displays</option>
          </select>
        </Field>

        {target === 'specific' && (
          <div style={{ background: '#F9FAFB', borderRadius: '8px', padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {displays.length === 0
              ? <p style={{ color: '#666', fontSize: '0.8rem', margin: 0 }}>No displays registered yet.</p>
              : displays.map(d => (
                <label key={d.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', cursor: 'pointer' }}>
                  <input type="checkbox" checked={selectedDisplayIds.includes(d.id)} onChange={() => toggleDisplay(d.id)} />
                  <span style={{ fontWeight: 500 }}>{d.name}</span>
                  {d.room_name && <span style={{ color: '#666', fontSize: '0.78rem' }}>({d.room_name})</span>}
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: d.is_online ? '#10B981' : '#D1D5DB', flexShrink: 0 }} />
                </label>
              ))
            }
          </div>
        )}

        <Field label="Status">
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.875rem' }}>
            <input type="checkbox" checked={isActive} onChange={e => setIsActive(e.target.checked)} />
            Active (visible on displays)
          </label>
        </Field>

        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', paddingTop: '0.5rem' }}>
          <button className="btn btn-outline" onClick={onClose} disabled={saving}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={saving}>
            {saving ? 'Saving...' : isEdit ? 'Update Slide' : 'Create Slide'}
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ── Image Input — URL or Upload ────────────────────────────────
function ImageInput({ value, onChange, onUpload, uploading }: {
  value: string; onChange: (v: string) => void;
  onUpload: (f: File) => void; uploading: boolean;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <input value={value} onChange={e => onChange(e.target.value)}
          placeholder="Paste URL or upload below" style={{ ...iStyle, flex: 1 }} />
      </div>
      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
        <button type="button" className="btn btn-outline"
          style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', padding: '0.35rem 0.75rem' }}
          onClick={e => { e.stopPropagation(); fileRef.current?.click(); }} disabled={uploading}>
          <Upload size={13} /> {uploading ? 'Uploading...' : 'Upload Photo'}
        </button>
        {value && (
          <img src={value} alt="preview" style={{ height: '32px', width: '32px', objectFit: 'cover', borderRadius: '4px', border: '1px solid #E5E7EB' }}
            onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
        )}
      </div>
      <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }}
        onClick={e => e.stopPropagation()}
        onChange={e => { const f = e.target.files?.[0]; if (f) onUpload(f); e.target.value = ''; }} />
    </div>
  );
}

// ── Branding Tab (Logo + Theme Color) ─────────────────────────
const PRESET_COLORS = ['#290D68', '#1A3A5C', '#0D5C3A', '#5C1A1A', '#1A5C5C', '#3A1A5C', '#5C3A1A', '#2D2D2D'];

function LogoTab() {
  // ── Logo state ────────────────────────────────────────────
  const [currentUrl, setCurrentUrl] = useState<string | null>(null);
  const [uploading, setUploading]   = useState(false);
  const [saving, setSaving]         = useState(false);
  const [manualUrl, setManualUrl]   = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  // ── Theme color state ─────────────────────────────────────
  const [savedColor, setSavedColor]   = useState('#290D68');
  const [colorInput, setColorInput]   = useState('#290D68');
  const [savingColor, setSavingColor] = useState(false);

  useEffect(() => {
    apiGet<{ url: string | null }>('/api/v1/logo').then(r => {
      setCurrentUrl(r.url); setManualUrl(r.url ?? '');
    }).catch(() => {});
    apiGet<{ color: string | null }>('/api/v1/displays/theme').then(r => {
      if (r.color) { setSavedColor(r.color); setColorInput(r.color); }
    }).catch(() => {});
  }, []);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData(); fd.append('file', file);
      const result = await apiUpload<{ url: string }>('/api/v1/uploads', fd);
      const fullUrl = result.url.startsWith('http') ? result.url : `${BASE}${result.url}`;
      setManualUrl(fullUrl); toast.success('Image uploaded — click Save to apply');
    } catch { toast.error('Upload failed'); }
    finally { setUploading(false); }
  };

  const handleSave = async () => {
    if (!manualUrl.trim()) { toast.error('URL is required'); return; }
    setSaving(true);
    try {
      await apiPatch('/api/v1/logo', { url: manualUrl.trim() });
      setCurrentUrl(manualUrl.trim()); toast.success('Logo updated — displays will refresh');
    } catch { toast.error('Failed to save logo'); }
    finally { setSaving(false); }
  };

  const handleColorSave = async () => {
    if (!/^#[0-9a-fA-F]{6}$/.test(colorInput)) { toast.error('Enter a valid 6-digit hex color (e.g. #290D68)'); return; }
    setSavingColor(true);
    try {
      await apiPatch('/api/v1/displays/theme', { color: colorInput });
      setSavedColor(colorInput); toast.success('Theme color updated — TV displays will refresh');
    } catch { toast.error('Failed to save theme color'); }
    finally { setSavingColor(false); }
  };

  const syncColorInput = (hex: string) => {
    setColorInput(hex);
  };

  return (
    <div style={{ maxWidth: '560px', display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>

      {/* ── Logo Section ──────────────────────────────────────── */}
      <div>
        <h2 style={{ fontSize: '1rem', fontWeight: 600, color: '#111', marginBottom: '1.5rem' }}>TV Sidebar Logo</h2>

        {currentUrl && (
          <div style={{ marginBottom: '1.5rem', background: '#1A1A2E', padding: '1.25rem', borderRadius: '12px', display: 'inline-block' }}>
            <img src={currentUrl} alt="Current TV logo" style={{ height: '48px', display: 'block', objectFit: 'contain' }}
              onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
            <div style={{ color: '#6B7280', fontSize: '0.75rem', marginTop: '0.5rem' }}>Current logo (on dark background)</div>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <Field label="Logo URL">
            <input value={manualUrl} onChange={e => setManualUrl(e.target.value)}
              placeholder="https://... or upload below" style={iStyle} />
          </Field>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <button className="btn btn-outline"
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
              onClick={() => fileRef.current?.click()} disabled={uploading}>
              <Upload size={15} /> {uploading ? 'Uploading...' : 'Upload Image'}
            </button>
            <span style={{ color: '#9CA3AF', fontSize: '0.8rem' }}>or paste URL above</span>
          </div>
          <input ref={fileRef} type="file" accept="image/*,image/svg+xml" style={{ display: 'none' }} onChange={handleUpload} />
          <button className="btn btn-primary" style={{ alignSelf: 'flex-start' }}
            onClick={handleSave} disabled={saving || !manualUrl.trim()}>
            {saving ? 'Saving...' : 'Save Logo'}
          </button>
        </div>
      </div>

      {/* ── Theme Color Section ────────────────────────────────── */}
      <div style={{ borderTop: '1px solid #E9ECEF', paddingTop: '2rem' }}>
        <h2 style={{ fontSize: '1rem', fontWeight: 600, color: '#111', marginBottom: '0.35rem' }}>Sidebar Theme Color</h2>
        <p style={{ color: '#888', fontSize: '0.82rem', marginBottom: '1.5rem' }}>
          Sets the main color of the TV sidebar. Changes reflect on all connected TV displays instantly.
        </p>

        {/* Color picker row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
          {/* Native color picker */}
          <div style={{ position: 'relative' }}>
            <input
              type="color"
              value={colorInput}
              onChange={e => syncColorInput(e.target.value)}
              style={{ width: '48px', height: '48px', padding: 0, border: '2px solid #E9ECEF', borderRadius: '8px', cursor: 'pointer', background: 'none' }}
              title="Pick a color"
            />
          </div>

          {/* Hex text input */}
          <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #E9ECEF', borderRadius: '8px', overflow: 'hidden', height: '40px' }}>
            <span style={{ padding: '0 0.6rem', background: '#F9FAFB', color: '#888', fontSize: '0.9rem', borderRight: '1px solid #E9ECEF', height: '100%', display: 'flex', alignItems: 'center' }}>#</span>
            <input
              type="text"
              value={colorInput.replace('#', '')}
              onChange={e => {
                const v = '#' + e.target.value.replace(/[^0-9a-fA-F]/g, '').slice(0, 6);
                setColorInput(v);
              }}
              maxLength={6}
              placeholder="290D68"
              style={{ border: 'none', outline: 'none', padding: '0 0.75rem', width: '90px', fontSize: '0.88rem', fontFamily: 'monospace' }}
            />
          </div>

          {/* Live preview square */}
          <div style={{ width: '48px', height: '48px', borderRadius: '8px', backgroundColor: colorInput, border: '2px solid #E9ECEF', flexShrink: 0, transition: 'background-color 0.2s' }} title="Preview" />
        </div>

        {/* Preset swatches */}
        <div style={{ marginBottom: '1.25rem' }}>
          <p style={{ fontSize: '0.75rem', color: '#888', marginBottom: '0.6rem', fontWeight: 500 }}>Presets</p>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {PRESET_COLORS.map(c => (
              <button key={c} type="button" onClick={() => syncColorInput(c)}
                title={c}
                style={{
                  width: '32px', height: '32px', borderRadius: '6px', backgroundColor: c, border: 'none',
                  cursor: 'pointer', flexShrink: 0,
                  outline: savedColor === c ? '3px solid #1A1A1A' : colorInput === c ? '3px solid #6B7280' : '2px solid transparent',
                  outlineOffset: '2px', transition: 'outline 0.1s',
                }} />
            ))}
          </div>
        </div>

        <button className="btn btn-primary" style={{ alignSelf: 'flex-start' }}
          onClick={handleColorSave} disabled={savingColor}>
          {savingColor ? 'Saving...' : 'Save Theme Color'}
        </button>
      </div>

    </div>
  );
}

// ── Shared UI helpers ──────────────────────────────────────────
function Modal({ title, onClose, children, wide }: {
  title: string; onClose: () => void; children: React.ReactNode; wide?: boolean;
}) {
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
      zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem',
    }} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{
        background: '#fff', borderRadius: '12px', padding: '1.75rem',
        width: '100%', maxWidth: wide ? '640px' : '440px',
        maxHeight: '90vh', overflowY: 'auto',
        boxShadow: '0 20px 60px rgba(0,0,0,0.18)',
      }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0 }}>{title}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#666' }}>
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Field({ label, children, style }: { label: string; children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={style}>
      <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 500, marginBottom: '0.4rem', color: '#374151' }}>{label}</label>
      {children}
    </div>
  );
}

function EmptyState({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div style={{ padding: '3rem', textAlign: 'center', background: '#F9FAFB', borderRadius: '8px', color: '#666' }}>
      {icon && <div style={{ margin: '0 auto 1rem', display: 'flex', justifyContent: 'center', opacity: 0.4 }}>{icon}</div>}
      {text}
    </div>
  );
}

// ── Style constants ────────────────────────────────────────────
const iStyle: React.CSSProperties = {
  width: '100%', padding: '0.5rem 0.75rem',
  border: '1px solid #D1D5DB', borderRadius: '6px',
  fontSize: '0.875rem', boxSizing: 'border-box', outline: 'none',
};

function slideTypeColor(type: SlideType): string {
  return { text: '#7C3AED', quote_avatar: '#2563EB', image: '#059669', birthday: '#D97706' }[type];
}

function slideTypeIcon(type: SlideType): string {
  return { text: '📢', quote_avatar: '💬', image: '🖼️', birthday: '🎂' }[type];
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function toLocalDt(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
