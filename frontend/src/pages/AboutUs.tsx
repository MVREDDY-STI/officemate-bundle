import { useState, useEffect, useRef } from 'react';
import { ChevronDown, ChevronUp, Plus, Trash2, UserPlus, X, User, Mail, Phone, Calendar, AlertCircle, CreditCard, Camera } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import EditableField from '../components/EditableField';
import EditableImage from '../components/EditableImage';
import ImageEditorModal from '../components/ImageEditorModal';
import { useAuth } from '../context/AuthContext';

/* ── Team/Employee types ─────────────────────────────────────── */
interface Employee {
  id: string; team_id: string; employee_id: string; name: string;
  designation: string; email: string; phone: string; dob: string;
  emergency_contact: string; photo_url: string;
}
interface Team { id: string; name: string; description: string; employees: Employee[]; }

function getToken() { try { return JSON.parse(sessionStorage.getItem('solum_auth') ?? '{}').token; } catch { return null; } }
function authHeaders() { const t = getToken(); return t ? { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' }; }

/* ── Employee Avatar ─────────────────────────────────────────── */
function EmployeeAvatar({ emp, size = 80 }: { emp: Employee; size?: number }) {
  return emp.photo_url
    ? <img src={emp.photo_url} alt={emp.name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
    : <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg,#e5e7eb,#d1d5db)', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%' }}>
        <User size={size * 0.4} color="#9ca3af" />
      </div>;
}

/* ── Employee Detail Modal ───────────────────────────────────── */
function EmployeeDetailModal({ emp, onClose, onDelete, isAdmin }: {
  emp: Employee; onClose: () => void;
  onDelete?: () => void; isAdmin: boolean;
}) {
  const fmt = (d: string) => { try { return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }); } catch { return d; } };
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}
      onClick={onClose}>
      <motion.div initial={{ opacity: 0, scale: 0.93, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.93, y: 10 }}
        transition={{ duration: 0.18 }}
        onClick={e => e.stopPropagation()}
        style={{ background: '#fff', borderRadius: '16px', width: '420px', maxWidth: '95vw', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 24px 64px rgba(0,0,0,0.22)' }}>

        {/* Header with photo */}
        <div style={{ background: 'linear-gradient(135deg,#1a1a1a,#2d2d2d)', borderRadius: '16px 16px 0 0', padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
          <button onClick={onClose} style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '50%', width: '28px', height: '28px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <X size={14} color="#fff" />
          </button>
          <div style={{ width: '96px', height: '96px', borderRadius: '50%', overflow: 'hidden', border: '3px solid rgba(255,255,255,0.3)', marginBottom: '1rem' }}>
            <EmployeeAvatar emp={emp} size={96} />
          </div>
          <div style={{ color: '#fff', fontWeight: 700, fontSize: '1.1rem', textAlign: 'center' }}>{emp.name}</div>
          {emp.designation && <div style={{ color: 'rgba(255,255,255,0.65)', fontSize: '0.8rem', marginTop: '0.25rem' }}>{emp.designation}</div>}
          {emp.employee_id && <div style={{ marginTop: '0.5rem', background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.8)', fontSize: '0.7rem', padding: '0.2rem 0.6rem', borderRadius: '20px' }}>ID: {emp.employee_id}</div>}
        </div>

        {/* Detail rows */}
        <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {[
            { icon: <Mail size={15} color="#6b7280" />, label: 'Email', value: emp.email },
            { icon: <Phone size={15} color="#6b7280" />, label: 'Phone', value: emp.phone },
            { icon: <Calendar size={15} color="#6b7280" />, label: 'Date of Birth', value: emp.dob ? fmt(emp.dob) : null },
            { icon: <AlertCircle size={15} color="#6b7280" />, label: 'Emergency Contact', value: emp.emergency_contact },
            { icon: <CreditCard size={15} color="#6b7280" />, label: 'Employee ID', value: emp.employee_id },
          ].filter(r => r.value).map(row => (
            <div key={row.label} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', padding: '0.65rem 0.75rem', background: '#f9fafb', borderRadius: '8px' }}>
              <div style={{ marginTop: '1px', flexShrink: 0 }}>{row.icon}</div>
              <div>
                <div style={{ fontSize: '0.65rem', color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.15rem' }}>{row.label}</div>
                <div style={{ fontSize: '0.85rem', color: '#111', fontWeight: 500 }}>{row.value}</div>
              </div>
            </div>
          ))}

          {isAdmin && onDelete && (
            <button onClick={onDelete} style={{ marginTop: '0.5rem', width: '100%', padding: '0.55rem', border: '1px solid #fecaca', borderRadius: '8px', background: '#fff5f5', color: '#ef4444', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>
              <Trash2 size={14} /> Remove Employee
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}

/* ── Add Team Modal ──────────────────────────────────────────── */
function AddTeamModal({ onClose, onAdd }: { onClose: () => void; onAdd: (t: Team) => void }) {
  const [name, setName] = useState(''); const [desc, setDesc] = useState(''); const [saving, setSaving] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); if (!name.trim()) return;
    setSaving(true);
    try {
      const r = await fetch('/api/v1/teams', { method: 'POST', headers: authHeaders(), body: JSON.stringify({ name: name.trim(), description: desc.trim() }) });
      if (!r.ok) { const j = await r.json(); alert(j.error ?? 'Failed'); setSaving(false); return; }
      onAdd({ ...(await r.json()), employees: [] }); onClose();
    } catch { alert('Network error'); setSaving(false); }
  };
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 400, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
        style={{ background: '#fff', borderRadius: '12px', padding: '1.75rem', width: '380px', maxWidth: '95vw', boxShadow: '0 16px 48px rgba(0,0,0,0.18)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <h3 style={{ fontWeight: 700, fontSize: '1rem', margin: 0 }}>Add Team</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={18} color="#888" /></button>
        </div>
        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
          <input placeholder="Team name *" value={name} onChange={e => setName(e.target.value)} required
            style={{ border: '1px solid #ddd', borderRadius: '6px', padding: '0.5rem 0.75rem', fontSize: '0.875rem', outline: 'none' }} />
          <input placeholder="Description (optional)" value={desc} onChange={e => setDesc(e.target.value)}
            style={{ border: '1px solid #ddd', borderRadius: '6px', padding: '0.5rem 0.75rem', fontSize: '0.875rem', outline: 'none' }} />
          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.25rem' }}>
            <button type="button" onClick={onClose} style={{ flex: 1, padding: '0.55rem', border: '1px solid #ddd', borderRadius: '8px', background: '#fff', cursor: 'pointer', fontSize: '0.875rem' }}>Cancel</button>
            <button type="submit" disabled={saving} style={{ flex: 1, padding: '0.55rem', border: 'none', borderRadius: '8px', background: '#1a1a1a', color: '#fff', cursor: saving ? 'default' : 'pointer', fontSize: '0.875rem', fontWeight: 600, opacity: saving ? 0.7 : 1 }}>{saving ? 'Adding…' : 'Add Team'}</button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

/* ── Add Employee Modal ──────────────────────────────────────── */
function AddEmployeeModal({ teamId, onClose, onAdd }: { teamId: string; onClose: () => void; onAdd: (e: Employee) => void }) {
  const EMPTY = { name: '', employee_id: '', designation: '', email: '', phone: '', dob: '', emergency_contact: '' };
  const [form, setForm] = useState(EMPTY);
  const [editorFile, setEditorFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string>('');
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const f = (k: keyof typeof EMPTY) => (e: React.ChangeEvent<HTMLInputElement>) => setForm(p => ({ ...p, [k]: e.target.value }));

  const pickPhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    setEditorFile(file);
  };

  // Called when ImageEditorModal finishes — url is already uploaded to MinIO
  const handleEditorSave = (url: string) => {
    setEditorFile(null);
    setPhotoUrl(url);
    setPhotoPreview(url);
  };

  const submit = async (ev: React.FormEvent) => {
    ev.preventDefault(); if (!form.name.trim()) return;
    setSaving(true);
    try {
      // Photo already uploaded via editor — just pass the URL
      const payload = { ...form, ...(photoUrl ? { photo_url: photoUrl } : {}) };
      const r = await fetch(`/api/v1/teams/${teamId}/employees`, { method: 'POST', headers: authHeaders(), body: JSON.stringify(payload) });
      if (!r.ok) { const j = await r.json(); alert(j.error ?? 'Failed'); setSaving(false); return; }
      onAdd(await r.json()); onClose();
    } catch { alert('Network error'); setSaving(false); }
  };

  const fields: { label: string; key: keyof typeof EMPTY; type?: string }[] = [
    { label: 'Full Name *', key: 'name' }, { label: 'Employee ID', key: 'employee_id' },
    { label: 'Designation', key: 'designation' }, { label: 'Email', key: 'email', type: 'email' },
    { label: 'Phone', key: 'phone', type: 'tel' }, { label: 'Date of Birth', key: 'dob', type: 'date' },
    { label: 'Emergency Contact', key: 'emergency_contact' },
  ];

  return (
    <>
      {editorFile && (
        <ImageEditorModal
          file={editorFile}
          onClose={() => setEditorFile(null)}
          onSave={handleEditorSave}
        />
      )}
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 400, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
        style={{ background: '#fff', borderRadius: '12px', padding: '1.75rem', width: '480px', maxWidth: '100%', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 16px 48px rgba(0,0,0,0.18)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <h3 style={{ fontWeight: 700, fontSize: '1rem', margin: 0 }}>Add Employee</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={18} color="#888" /></button>
        </div>
        <form onSubmit={submit}>
          {/* Photo picker */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '1.25rem' }}>
            <div
              onClick={(e) => { e.stopPropagation(); fileRef.current?.click(); }}
              style={{ width: '80px', height: '80px', borderRadius: '50%', overflow: 'hidden', border: '2px dashed #d1d5db', cursor: 'pointer', position: 'relative', background: '#f9fafb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {photoPreview
                ? <img src={photoPreview} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="preview" />
                : <User size={32} color="#9ca3af" />}
              <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: photoPreview ? 0 : 1, transition: 'opacity 0.15s' }}
                onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
                onMouseLeave={e => (e.currentTarget.style.opacity = photoPreview ? '0' : '1')}>
                <Camera size={18} color="#fff" />
              </div>
            </div>
            <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }}
              onClick={e => e.stopPropagation()}
              onChange={pickPhoto} />
            <span style={{ fontSize: '0.65rem', color: '#9ca3af', marginTop: '0.4rem' }}>Click to add photo</span>
          </div>

          {/* Fields grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
            {fields.map(({ label, key, type }) => (
              <div key={key} style={{ gridColumn: key === 'emergency_contact' || key === 'name' ? 'span 2' : undefined }}>
                <label style={{ display: 'block', fontSize: '0.7rem', color: '#555', marginBottom: '0.25rem', fontWeight: 500 }}>{label}</label>
                <input type={type ?? 'text'} value={form[key]} onChange={f(key)} required={key === 'name'}
                  style={{ width: '100%', border: '1px solid #ddd', borderRadius: '6px', padding: '0.45rem 0.65rem', fontSize: '0.8rem', outline: 'none', boxSizing: 'border-box' }} />
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button type="button" onClick={onClose} style={{ flex: 1, padding: '0.55rem', border: '1px solid #ddd', borderRadius: '8px', background: '#fff', cursor: 'pointer', fontSize: '0.875rem' }}>Cancel</button>
            <button type="submit" disabled={saving}
              style={{ flex: 1, padding: '0.55rem', border: 'none', borderRadius: '8px', background: '#1a1a1a', color: '#fff', cursor: saving ? 'default' : 'pointer', fontSize: '0.875rem', fontWeight: 600, opacity: saving ? 0.7 : 1 }}>
              {saving ? 'Adding…' : 'Add Employee'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
    </>
  );
}

const fadeUp = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } } };
const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.1 } } };

/* ── Avatar card for grid ────────────────────────────────────── */
function AvatarCard({ emp, onClick, onDelete, isAdmin }: {
  emp: Employee; onClick: () => void;
  onDelete: (e: React.MouseEvent) => void; isAdmin: boolean;
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer', width: '100px', position: 'relative', padding: '0.5rem', borderRadius: '12px', background: hovered ? '#f3f4f6' : 'transparent', transition: 'background 0.15s' }}>
      <div style={{ width: '80px', height: '80px', borderRadius: '50%', overflow: 'hidden', border: `2px solid ${hovered ? '#1a1a1a' : '#e5e7eb'}`, transition: 'border-color 0.15s', flexShrink: 0, transform: hovered ? 'scale(1.04)' : 'scale(1)', transitionProperty: 'border-color, transform' }}>
        <EmployeeAvatar emp={emp} size={80} />
      </div>
      <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', fontWeight: 600, color: '#111', textAlign: 'center', lineHeight: 1.3 }}>{emp.name}</div>
      <div style={{ fontSize: '0.68rem', color: '#6b7280', textAlign: 'center', marginTop: '0.15rem' }}>{emp.designation || 'Designation'}</div>
      {isAdmin && hovered && (
        <button
          onClick={onDelete}
          style={{ position: 'absolute', top: '4px', right: '4px', background: '#fff', border: '1px solid #fecaca', borderRadius: '50%', width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 1px 4px rgba(0,0,0,0.12)', zIndex: 2 }}>
          <X size={10} color="#ef4444" />
        </button>
      )}
    </div>
  );
}

const PLACEHOLDER = 'This text is only used to give you a visual feel of things & will in reality be replaced by original Content. Currently placed by SoLuM Technologies India Pvt. Ltd.';
const PLACEHOLDER_SHORT = 'This text is only used to give you a visual feel of things & will in reality be replaced by original Content. Currently placed by SoLuM Technologies India Pvt. Ltd.';


const AboutUs = () => {
  const { isAdmin } = useAuth();
  const [teams, setTeams]               = useState<Team[]>([]);
  const [teamsLoading, setTeamsLoading] = useState(true);
  const [openTeamId, setOpenTeamId]     = useState<string | null>(null);
  const [showAddTeam, setShowAddTeam]   = useState(false);
  const [addEmpTeamId, setAddEmpTeamId] = useState<string | null>(null);
  const [selectedEmp, setSelectedEmp]   = useState<Employee | null>(null);

  useEffect(() => {
    fetch('/api/v1/teams').then(r => r.json())
      .then(d => { setTeams(Array.isArray(d) ? d : []); setTeamsLoading(false); })
      .catch(() => setTeamsLoading(false));
  }, []);

  const deleteTeam = async (id: string) => {
    if (!confirm('Delete this team and all its employees?')) return;
    await fetch(`/api/v1/teams/${id}`, { method: 'DELETE', headers: authHeaders() });
    setTeams(p => p.filter(t => t.id !== id));
  };
  const deleteEmployee = async (teamId: string, empId: string) => {
    if (!confirm('Remove this employee?')) return;
    await fetch(`/api/v1/teams/${teamId}/employees/${empId}`, { method: 'DELETE', headers: authHeaders() });
    setTeams(p => p.map(t => t.id === teamId ? { ...t, employees: t.employees.filter(e => e.id !== empId) } : t));
    setSelectedEmp(null);
  };


  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem', fontFamily: 'sans-serif' }}>
      <motion.h1
        style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '4rem', color: '#111' }}
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}
      >
        About Us
      </motion.h1>

      {/* Top Section */}
      <motion.div
        style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4rem', marginBottom: '8rem', alignItems: 'center' }}
        variants={stagger} initial="hidden" animate="show"
      >
        <motion.div variants={fadeUp} style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem', position: 'relative' }}>
          <div style={{ position: 'absolute', top: '10%', left: '-10%', width: '120px', height: '120px', backgroundColor: '#3b6b90', zIndex: -1 }}></div>

          {/* Team member 1 */}
          <div style={{ position: 'relative', height: '300px' }}>
            <EditableImage
              storageKey="about.team.1.img"
              defaultSrc="https://placehold.co/400x400/333/fff?text=Sungho+Jun"
              alt="Team Member 1"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              wrapperStyle={{ width: '100%', height: '100%' }}
            />
            <div style={{ position: 'absolute', bottom: '1rem', right: '1rem', backgroundColor: '#111', color: 'white', padding: '0.5rem 1rem', textAlign: 'right' }}>
              <EditableField tag="div" storageKey="about.team.1.name" defaultValue="Sungho Jun" style={{ fontWeight: 'bold' }} />
              <EditableField tag="div" storageKey="about.team.1.title" defaultValue="CEO, SOLUM GLOBAL" style={{ fontSize: '0.75rem', opacity: 0.8 }} />
            </div>
          </div>

          {/* Team member 2 */}
          <div style={{ position: 'relative', height: '400px', alignSelf: 'start' }}>
            <EditableImage
              storageKey="about.team.2.img"
              defaultSrc="https://placehold.co/400x500/333/fff?text=J.H.+Yoo"
              alt="Team Member 2"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              wrapperStyle={{ width: '100%', height: '100%' }}
            />
            <div style={{ position: 'absolute', bottom: '1rem', right: '1rem', backgroundColor: '#111', color: 'white', padding: '0.5rem 1rem', textAlign: 'right' }}>
              <EditableField tag="div" storageKey="about.team.2.name" defaultValue="J.H. Yoo" style={{ fontWeight: 'bold' }} />
              <EditableField tag="div" storageKey="about.team.2.title" defaultValue="PRESIDENT, SOLUM AMERICA" style={{ fontSize: '0.75rem', opacity: 0.8 }} />
            </div>
          </div>
        </motion.div>

        <motion.div variants={fadeUp}>
          <EditableField
            tag="h2"
            storageKey="about.heading1"
            defaultValue="Our Dedicated Value Creation Team"
            style={{ fontSize: '2.5rem', lineHeight: '1.2', color: '#2b3b4f', marginBottom: '2rem' }}
          />
          <EditableField
            tag="p"
            storageKey="about.text1"
            defaultValue={PLACEHOLDER}
            style={{ color: '#666', marginBottom: '1.5rem', lineHeight: '1.6', fontSize: '0.875rem' }}
          />
          <EditableField
            tag="p"
            storageKey="about.text2"
            defaultValue={`${PLACEHOLDER} ${PLACEHOLDER}`}
            style={{ color: '#666', marginBottom: '1.5rem', lineHeight: '1.6', fontSize: '0.875rem' }}
          />
          <EditableField
            tag="p"
            storageKey="about.text3"
            defaultValue={`${PLACEHOLDER} ${PLACEHOLDER} ${PLACEHOLDER_SHORT}`}
            style={{ color: '#666', lineHeight: '1.6', fontSize: '0.875rem' }}
          />
        </motion.div>
      </motion.div>

      {/* Middle Section */}
      <motion.div
        style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4rem', marginBottom: '8rem', alignItems: 'center' }}
        initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.3 }}
      >
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem', position: 'relative' }}>
          <div style={{ position: 'absolute', bottom: '-10%', left: '-5%', width: '80px', height: '80px', backgroundColor: '#dbeafe', zIndex: -1 }}></div>

          {/* Team member 3 */}
          <div style={{ position: 'relative', height: '250px', alignSelf: 'end' }}>
            <EditableImage
              storageKey="about.team.3.img"
              defaultSrc="https://placehold.co/400x350/333/fff?text=Eugene+Paik"
              alt="Team Member 3"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              wrapperStyle={{ width: '100%', height: '100%' }}
            />
            <div style={{ position: 'absolute', bottom: '1rem', right: '1rem', backgroundColor: '#2b3b4f', color: 'white', padding: '0.5rem 1rem', textAlign: 'right' }}>
              <EditableField tag="div" storageKey="about.team.3.name" defaultValue="Eugene Paik" style={{ fontWeight: 'bold' }} />
              <EditableField tag="div" storageKey="about.team.3.title" defaultValue="SENIOR VP OF SALES" style={{ fontSize: '0.75rem', opacity: 0.8 }} />
            </div>
          </div>

          {/* Team member 4 */}
          <div style={{ position: 'relative', height: '350px' }}>
            <EditableImage
              storageKey="about.team.4.img"
              defaultSrc="https://placehold.co/400x450/333/fff?text=John+Revie"
              alt="Team Member 4"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              wrapperStyle={{ width: '100%', height: '100%' }}
            />
            <div style={{ position: 'absolute', bottom: '1rem', right: '1rem', backgroundColor: '#111', color: 'white', padding: '0.5rem 1rem', textAlign: 'right' }}>
              <EditableField tag="div" storageKey="about.team.4.name" defaultValue="John Revie" style={{ fontWeight: 'bold' }} />
              <EditableField tag="div" storageKey="about.team.4.title" defaultValue="SENIOR VP OF SALES, SOLUM AMERICA" style={{ fontSize: '0.75rem', opacity: 0.8 }} />
            </div>
          </div>
        </div>

        <div>
          <EditableField
            tag="h2"
            storageKey="about.heading2"
            defaultValue={"An Individual\nTeam Dedicated\nTo Creating Value"}
            style={{ fontSize: '2.5rem', lineHeight: '1.2', color: '#2b3b4f', whiteSpace: 'pre-line' }}
          />
        </div>
      </motion.div>

      {/* Bottom Section */}
      <motion.div
        style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4rem', marginBottom: '8rem' }}
        initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.3 }}
      >
        <div>
          <EditableField
            tag="h2"
            storageKey="about.heading3a"
            defaultValue="The leader of"
            style={{ fontSize: '2.5rem', lineHeight: '1.2', color: '#9ca3af', marginBottom: '0.5rem' }}
          />
          <EditableField
            tag="h2"
            storageKey="about.heading3b"
            defaultValue="Our Organization"
            style={{ fontSize: '2.5rem', lineHeight: '1.2', color: '#111', marginBottom: '3rem' }}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
          {[1, 2, 3, 4].map(i => (
            <EditableField
              key={i}
              tag="p"
              storageKey={`about.org.text${i}`}
              defaultValue={i <= 2 ? PLACEHOLDER_SHORT : `${PLACEHOLDER_SHORT} ${PLACEHOLDER_SHORT}`}
              style={{ color: '#666', lineHeight: '1.6', fontSize: '0.875rem' }}
            />
          ))}
        </div>
      </motion.div>

      {/* Quote and Company Info */}
      <motion.div
        style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4rem', marginBottom: '8rem' }}
        initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.3 }}
      >
        <div style={{ display: 'flex' }}>
          <div style={{ width: '40%', padding: '2rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div style={{ flex: 1, border: '4px solid #3b6b90', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ padding: '1rem', backgroundColor: '#e2e8f0', width: '100%', textAlign: 'center' }}>
                <EditableField tag="div" storageKey="about.director.name" defaultValue="GURUBASAVARAJA" style={{ fontWeight: 'bold', fontSize: '0.875rem' }} />
                <EditableField tag="div" storageKey="about.director.title" defaultValue="DIRECTOR" style={{ fontSize: '0.75rem', color: '#666' }} />
              </div>
            </div>
            <div style={{ backgroundColor: '#9ca3af', color: 'white', padding: '1.5rem', flex: 1, display: 'flex', alignItems: 'center' }}>
              <EditableField
                tag="p"
                storageKey="about.quote"
                defaultValue='"This text is only used to give you a visual feel of things & will in reality be replaced by original content."'
                style={{ fontSize: '1.25rem', lineHeight: '1.4', fontStyle: 'italic' }}
              />
            </div>
          </div>
          <div style={{ width: '60%', backgroundColor: '#cbd5e1', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <EditableImage
              storageKey="about.director.photo"
              defaultSrc="https://placehold.co/300x400/cbd5e1/888?text=Director+Photo"
              alt="Director"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              wrapperStyle={{ width: '100%', height: '100%' }}
            />
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#2b3b4f' }}>SOLUM</h2>
            <EditableField tag="span" storageKey="about.company.tagline" defaultValue="Solution provider." style={{ fontSize: '0.75rem', color: '#666' }} />
          </div>

          <EditableField
            tag="h3"
            storageKey="about.company.title"
            defaultValue="Solum Technologies India Private Limited is a Private incorporated on 29 April 2016."
            style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem', color: '#111' }}
          />
          <EditableField
            tag="p"
            storageKey="about.company.description"
            defaultValue={PLACEHOLDER}
            style={{ color: '#666', fontSize: '0.875rem', lineHeight: '1.6', marginBottom: '3rem' }}
          />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
            <div>
              <EditableField tag="h4" storageKey="about.whatwesee.title" defaultValue="What We See" style={{ fontWeight: 'bold', marginBottom: '1rem' }} />
              <EditableField
                tag="p"
                storageKey="about.whatwesee.text1"
                defaultValue={PLACEHOLDER_SHORT}
                style={{ color: '#666', fontSize: '0.875rem', lineHeight: '1.6', marginBottom: '1rem' }}
              />
              <EditableField
                tag="p"
                storageKey="about.whatwesee.text2"
                defaultValue={PLACEHOLDER_SHORT}
                style={{ color: '#666', fontSize: '0.875rem', lineHeight: '1.6' }}
              />
            </div>
            <div>
              <EditableField tag="h4" storageKey="about.operation.title" defaultValue="Our operation" style={{ fontWeight: 'bold', marginBottom: '1rem' }} />
              <EditableField
                tag="p"
                storageKey="about.operation.text1"
                defaultValue={PLACEHOLDER_SHORT}
                style={{ color: '#666', fontSize: '0.875rem', lineHeight: '1.6', marginBottom: '1rem' }}
              />
              <EditableField
                tag="p"
                storageKey="about.operation.text2"
                defaultValue={PLACEHOLDER_SHORT}
                style={{ color: '#666', fontSize: '0.875rem', lineHeight: '1.6' }}
              />
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── Team Information ── */}
      <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.3 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#111', margin: 0 }}>Team Information</h2>
          {isAdmin && (
            <button onClick={() => setShowAddTeam(true)}
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.45rem 0.9rem', background: '#1a1a1a', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}>
              <Plus size={14} /> Add Team
            </button>
          )}
        </div>

        {teamsLoading ? (
          <p style={{ color: '#aaa', fontSize: '0.875rem' }}>Loading teams…</p>
        ) : teams.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem 2rem', background: '#f9fafb', borderRadius: '12px', border: '2px dashed #e5e7eb' }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>👥</div>
            <p style={{ color: '#888', fontSize: '0.875rem', marginBottom: isAdmin ? '1rem' : 0 }}>No teams have been created yet.</p>
            {isAdmin && (
              <button onClick={() => setShowAddTeam(true)}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 1rem', background: '#1a1a1a', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}>
                <Plus size={14} /> Add First Team
              </button>
            )}
          </div>
        ) : (
          <div style={{ border: '1px solid #e5e7eb', borderRadius: '12px', overflow: 'hidden' }}>
            {teams.map((team, idx) => (
              <div key={team.id} style={{ borderBottom: idx < teams.length - 1 ? '1px solid #e5e7eb' : 'none' }}>
                {/* Team header row */}
                <div
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.1rem 1.5rem', cursor: 'pointer', background: openTeamId === team.id ? '#fafafa' : '#fff', userSelect: 'none' }}
                  onClick={() => setOpenTeamId(openTeamId === team.id ? null : team.id)}>
                  <span style={{ fontWeight: 700, fontSize: '0.95rem', color: '#111' }}>{team.name}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }} onClick={e => e.stopPropagation()}>
                    {isAdmin && openTeamId === team.id && (
                      <>
                        <button onClick={() => setAddEmpTeamId(team.id)}
                          style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', padding: '0.3rem 0.65rem', background: '#f0f9ff', color: '#0066FF', border: '1px solid #bfdbfe', borderRadius: '6px', cursor: 'pointer', fontSize: '0.7rem', fontWeight: 600 }}>
                          <UserPlus size={11} /> Add Employee
                        </button>
                        <button onClick={() => deleteTeam(team.id)}
                          style={{ padding: '0.3rem', background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444' }}>
                          <Trash2 size={14} />
                        </button>
                      </>
                    )}
                    <div onClick={() => setOpenTeamId(openTeamId === team.id ? null : team.id)} style={{ cursor: 'pointer', color: '#6b7280' }}>
                      {openTeamId === team.id ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </div>
                  </div>
                </div>

                {/* Employee avatar grid */}
                <AnimatePresence initial={false}>
                  {openTeamId === team.id && (
                    <motion.div
                      key={team.id}
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.22 }}
                      style={{ overflow: 'hidden' }}>
                      <div style={{ padding: '1rem 1.5rem 1.5rem', background: '#fafafa', borderTop: '1px solid #f0f0f0' }}>
                        {team.employees.length === 0 ? (
                          <p style={{ color: '#aaa', fontSize: '0.8rem', margin: 0 }}>No employees yet.{isAdmin ? ' Click "Add Employee" above.' : ''}</p>
                        ) : (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                            {team.employees.map(emp => (
                              <AvatarCard
                                key={emp.id}
                                emp={emp}
                                isAdmin={isAdmin}
                                onClick={() => setSelectedEmp(emp)}
                                onDelete={(e) => { e.stopPropagation(); deleteEmployee(team.id, emp.id); }}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Modals */}
      <AnimatePresence>
        {showAddTeam && <AddTeamModal onClose={() => setShowAddTeam(false)} onAdd={t => setTeams(p => [...p, t])} />}
        {addEmpTeamId && <AddEmployeeModal teamId={addEmpTeamId} onClose={() => setAddEmpTeamId(null)}
          onAdd={emp => setTeams(p => p.map(t => t.id === addEmpTeamId ? { ...t, employees: [...t.employees, emp] } : t))} />}
        {selectedEmp && (
          <EmployeeDetailModal
            emp={selectedEmp}
            isAdmin={isAdmin}
            onClose={() => setSelectedEmp(null)}
            onDelete={() => {
              const team = teams.find(t => t.employees.some(e => e.id === selectedEmp.id));
              if (team) deleteEmployee(team.id, selectedEmp.id);
            }}
          />
        )}
      </AnimatePresence>

    </div>
  );
};

export default AboutUs;
