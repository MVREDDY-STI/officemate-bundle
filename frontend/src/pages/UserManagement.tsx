import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { apiGet, apiPatch, apiDelete } from '../services/api';

/* ── Types ─────────────────────────────────────────────────────── */
interface ManagedUser {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'user';
  avatar_url: string | null;
  is_approved: boolean;
  created_at: string;
}

/* ── Helpers ────────────────────────────────────────────────────── */
const fadeUp = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.2 } },
};

function formatDate(s: string) {
  return new Date(s).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

/* ── Main Page ──────────────────────────────────────────────────── */
export default function UserManagement() {
  const navigate    = useNavigate();
  const { user: me, isAdmin } = useAuth();
  const [users, setUsers]         = useState<ManagedUser[]>([]);
  const [loading, setLoading]     = useState(true);
  const [actioning, setActioning] = useState<string | null>(null);

  // Redirect non-admins
  useEffect(() => { if (!isAdmin) navigate('/dashboard', { replace: true }); }, [isAdmin, navigate]);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const data = await apiGet<ManagedUser[]>('/api/v1/users');
      setUsers(Array.isArray(data) ? data : []);
    } catch {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const approve = async (id: string) => {
    setActioning(id + ':approve');
    try {
      await apiPatch(`/api/v1/users/${id}`, { is_approved: true });
      toast.success('User approved');
      fetchUsers();
    } catch { toast.error('Failed to approve'); }
    finally { setActioning(null); }
  };

  const toggleRole = async (u: ManagedUser) => {
    const newRole = u.role === 'admin' ? 'user' : 'admin';
    if (!window.confirm(`Change ${u.name}'s role to ${newRole}?`)) return;
    setActioning(u.id + ':role');
    try {
      await apiPatch(`/api/v1/users/${u.id}`, { role: newRole });
      toast.success(`Role updated to ${newRole}`);
      fetchUsers();
    } catch { toast.error('Failed to update role'); }
    finally { setActioning(null); }
  };

  const deleteUser = async (u: ManagedUser) => {
    if (!window.confirm(`Delete ${u.name} (${u.email})? This cannot be undone.`)) return;
    setActioning(u.id + ':delete');
    try {
      await apiDelete(`/api/v1/users/${u.id}`);
      toast.success(`${u.name} deleted`);
      fetchUsers();
    } catch (e: any) {
      toast.error(e.message?.includes('own account') ? 'Cannot delete your own account' : 'Failed to delete');
    }
    finally { setActioning(null); }
  };

  const pending = users.filter(u => !u.is_approved);
  const all     = users;

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '2rem', fontFamily: 'sans-serif' }}>
      <motion.div initial="hidden" animate="show" variants={{ hidden: {}, show: { transition: { staggerChildren: 0.07 } } }}>

        <motion.div variants={fadeUp}>
          <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '0.5rem', color: '#1A1A1A' }}>User Management</h1>
          <p style={{ color: '#666', marginBottom: '2rem', fontSize: '0.9rem' }}>Manage user accounts, approve new registrations and assign roles.</p>
        </motion.div>

        {loading ? (
          <motion.div variants={fadeUp} style={{ textAlign: 'center', padding: '3rem', color: '#aaa' }}>Loading users…</motion.div>
        ) : (
          <>
            {/* ── Pending Approval ─────────────────────────────────── */}
            {pending.length > 0 && (
              <motion.div variants={fadeUp} style={{ marginBottom: '2rem' }}>
                <div style={{ background: '#FFFBEB', border: '1px solid #F59E0B', borderRadius: '10px', padding: '1rem 1.25rem', marginBottom: '1rem' }}>
                  <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#92400E', margin: '0 0 0.25rem' }}>
                    ⏳ Pending Approval ({pending.length})
                  </h3>
                  <p style={{ fontSize: '0.8rem', color: '#92400E', margin: 0 }}>
                    These users have registered and are waiting for approval before they can log in.
                  </p>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                  {pending.map(u => (
                    <div key={u.id} style={{ background: '#fff', border: '1px solid #FDE68A', borderRadius: '10px', padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
                      <div>
                        <p style={{ fontWeight: 600, color: '#111', margin: '0 0 0.2rem', fontSize: '0.92rem' }}>{u.name}</p>
                        <p style={{ color: '#666', fontSize: '0.8rem', margin: 0 }}>{u.email} · Registered {formatDate(u.created_at)}</p>
                      </div>
                      <button
                        onClick={() => approve(u.id)}
                        disabled={actioning === u.id + ':approve'}
                        style={{ padding: '0.45rem 1.1rem', borderRadius: '7px', border: 'none', background: '#059669', color: '#fff', fontWeight: 600, fontSize: '0.82rem', cursor: 'pointer', opacity: actioning === u.id + ':approve' ? 0.6 : 1 }}>
                        {actioning === u.id + ':approve' ? 'Approving…' : '✓ Approve'}
                      </button>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* ── All Users Table ───────────────────────────────────── */}
            <motion.div variants={fadeUp}>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#333', marginBottom: '1rem' }}>
                All Users ({all.length})
              </h2>
              <div style={{ background: '#fff', border: '1px solid #E9ECEF', borderRadius: '10px', overflow: 'hidden' }}>
                {/* Table header */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 120px 100px 160px', padding: '0.75rem 1.25rem', background: '#F9FAFB', borderBottom: '1px solid #E9ECEF', fontSize: '0.75rem', fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  <span>Name</span>
                  <span>Email</span>
                  <span>Role</span>
                  <span>Status</span>
                  <span style={{ textAlign: 'right' }}>Actions</span>
                </div>
                {all.map((u, i) => {
                  const isSelf = u.id === me?.email ? false : false; // compare by id stored in token
                  const busy   = actioning?.startsWith(u.id);
                  return (
                    <div key={u.id} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 120px 100px 160px', padding: '0.9rem 1.25rem', borderBottom: i < all.length - 1 ? '1px solid #F3F4F6' : 'none', alignItems: 'center' }}>
                      {/* Name */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: u.role === 'admin' ? '#EDE9FE' : '#DBEAFE', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 700, color: u.role === 'admin' ? '#7C3AED' : '#2563EB', flexShrink: 0 }}>
                          {u.name.charAt(0).toUpperCase()}
                        </div>
                        <span style={{ fontWeight: 500, fontSize: '0.88rem', color: '#111' }}>{u.name}</span>
                      </div>
                      {/* Email */}
                      <span style={{ fontSize: '0.82rem', color: '#555', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.email}</span>
                      {/* Role badge */}
                      <span style={{ display: 'inline-flex', alignItems: 'center', padding: '0.22rem 0.65rem', borderRadius: '20px', fontSize: '0.72rem', fontWeight: 600, backgroundColor: u.role === 'admin' ? '#EDE9FE' : '#DBEAFE', color: u.role === 'admin' ? '#7C3AED' : '#2563EB', width: 'fit-content' }}>
                        {u.role === 'admin' ? '👑 Admin' : '👤 User'}
                      </span>
                      {/* Approved badge */}
                      <span style={{ display: 'inline-flex', alignItems: 'center', padding: '0.22rem 0.65rem', borderRadius: '20px', fontSize: '0.72rem', fontWeight: 600, backgroundColor: u.is_approved ? '#D1FAE5' : '#FEF3C7', color: u.is_approved ? '#065F46' : '#92400E', width: 'fit-content' }}>
                        {u.is_approved ? '✓ Active' : '⏳ Pending'}
                      </span>
                      {/* Actions */}
                      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                        {!u.is_approved && (
                          <button onClick={() => approve(u.id)} disabled={!!busy}
                            style={{ padding: '0.3rem 0.7rem', borderRadius: '6px', border: 'none', background: '#059669', color: '#fff', fontSize: '0.72rem', fontWeight: 600, cursor: 'pointer', opacity: busy ? 0.6 : 1 }}>
                            Approve
                          </button>
                        )}
                        <button onClick={() => toggleRole(u)} disabled={!!busy}
                          style={{ padding: '0.3rem 0.7rem', borderRadius: '6px', border: '1px solid #D1D5DB', background: '#fff', color: '#374151', fontSize: '0.72rem', fontWeight: 500, cursor: 'pointer', opacity: busy ? 0.6 : 1 }}>
                          {u.role === 'admin' ? '→ User' : '→ Admin'}
                        </button>
                        <button onClick={() => deleteUser(u)} disabled={!!busy}
                          style={{ padding: '0.3rem 0.7rem', borderRadius: '6px', border: '1px solid #FCA5A5', background: '#fff', color: '#EF4444', fontSize: '0.72rem', fontWeight: 500, cursor: 'pointer', opacity: busy ? 0.6 : 1 }}
                          title={u.email === me?.email ? 'Cannot delete yourself' : `Delete ${u.name}`}>
                          Delete
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          </>
        )}

      </motion.div>
    </div>
  );
}
