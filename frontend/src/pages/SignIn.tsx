import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { apiPost } from '../services/api';

type Tab = 'signin' | 'signup';

export default function SignIn() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [tab, setTab] = useState<Tab>('signin');

  // ── Sign-in state ─────────────────────────────────────────
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [pending, setPending]   = useState(false);

  // ── Sign-up state ─────────────────────────────────────────
  const [suName, setSuName]         = useState('');
  const [suEmail, setSuEmail]       = useState('');
  const [suPass, setSuPass]         = useState('');
  const [suConfirm, setSuConfirm]   = useState('');
  const [suError, setSuError]       = useState('');
  const [suLoading, setSuLoading]   = useState(false);
  const [suSuccess, setSuSuccess]   = useState(false);

  // ── Sign-in handler ───────────────────────────────────────
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setPending(false);
    const result = await login(email, password);
    if (result === 'ok') {
      toast.success('Welcome back!');
      navigate('/dashboard');
    } else if (result === 'approval_pending') {
      setPending(true);
    } else {
      setError('Invalid email or password.');
    }
  };

  const quickLogin = async (role: 'admin' | 'user') => {
    const creds = role === 'admin'
      ? { email: 'admin@solum.com', password: 'admin123' }
      : { email: 'user@solum.com',  password: 'user123' };
    setEmail(creds.email);
    setPassword(creds.password);
    setError('');
    setPending(false);
    const result = await login(creds.email, creds.password);
    if (result === 'ok') {
      toast.success('Welcome back!');
      navigate('/dashboard');
    }
  };

  // ── Sign-up handler ───────────────────────────────────────
  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuError('');

    if (suPass !== suConfirm) { setSuError('Passwords do not match.'); return; }
    if (suPass.length < 8)    { setSuError('Password must be at least 8 characters.'); return; }

    setSuLoading(true);
    try {
      await apiPost('/api/v1/auth/signup', { name: suName.trim(), email: suEmail.trim(), password: suPass });
      setSuSuccess(true);
    } catch (e: any) {
      if (e.message?.includes('409') || e.message?.includes('already registered')) {
        setSuError('Email already registered. Try signing in instead.');
      } else {
        setSuError('Registration failed. Please try again.');
      }
    } finally {
      setSuLoading(false);
    }
  };

  // ── Shared styles ─────────────────────────────────────────
  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '0.75rem 1rem',
    border: '1px solid #E5E5E5', borderRadius: '8px',
    fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box',
    fontFamily: 'inherit',
  };

  return (
    <div className="screen-wrapper justify-center align-center" style={{ backgroundColor: '#F8F9FA' }}>
      <div className="card" style={{ width: '100%', maxWidth: '420px', padding: '3rem 2.5rem', border: 'none' }}>

        {/* Brand */}
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '1.5rem', letterSpacing: '1px', marginBottom: '0.25rem' }}>SOLUM</h1>
          <p className="text-muted" style={{ fontSize: '1.2rem' }}>Officemate</p>
        </div>

        {/* Tab switcher */}
        <div style={{ display: 'flex', gap: '0', marginBottom: '2rem', borderRadius: '8px', overflow: 'hidden', border: '1px solid #E5E5E5' }}>
          {(['signin', 'signup'] as Tab[]).map(t => (
            <button
              key={t}
              type="button"
              onClick={() => { setTab(t); setError(''); setSuError(''); setPending(false); setSuSuccess(false); }}
              style={{
                flex: 1, padding: '0.6rem', fontSize: '0.875rem', fontWeight: tab === t ? 600 : 400,
                backgroundColor: tab === t ? '#111' : '#fff', color: tab === t ? '#fff' : '#555',
                border: 'none', cursor: 'pointer', transition: 'all 0.15s',
              }}
            >
              {t === 'signin' ? 'Sign In' : 'Sign Up'}
            </button>
          ))}
        </div>

        {/* ── SIGN IN ────────────────────────────────────────── */}
        {tab === 'signin' && (
          <>
            {/* Approval pending banner */}
            {pending && (
              <div style={{
                background: '#FEF3C7', border: '1px solid #F59E0B', borderRadius: '8px',
                padding: '0.875rem 1rem', marginBottom: '1.25rem', fontSize: '0.875rem', color: '#92400E',
              }}>
                ⏳ <strong>Account pending approval.</strong><br />
                Your account is awaiting admin approval. Contact admin to proceed.
              </div>
            )}

            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <input
                type="email" style={inputStyle} placeholder="Email address" required
                value={email} onChange={e => { setEmail(e.target.value); setError(''); setPending(false); }}
              />
              <input
                type="password" style={inputStyle} placeholder="Password" required
                value={password} onChange={e => { setPassword(e.target.value); setError(''); setPending(false); }}
              />

              {error && <p style={{ color: '#DC2626', fontSize: '0.875rem', margin: 0 }}>{error}</p>}

              <div style={{ textAlign: 'left' }}>
                <a href="#" className="text-muted text-sm" style={{ textDecoration: 'none', fontSize: '0.8rem' }}>
                  Forgot Password?
                </a>
              </div>

              <button type="submit" className="btn btn-primary"
                style={{ width: '100%', padding: '0.9rem', fontSize: '1rem' }}>
                Sign In
              </button>
            </form>

            {/* Quick login for demo */}
            <div style={{ marginTop: '2rem', borderTop: '1px solid #E5E5E5', paddingTop: '1.5rem' }}>
              <p style={{ fontSize: '0.75rem', color: '#A3A3A3', marginBottom: '0.75rem', textAlign: 'center' }}>
                Quick access (demo)
              </p>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button type="button" onClick={() => quickLogin('admin')}
                  style={{ flex: 1, padding: '0.6rem', fontSize: '0.8rem', backgroundColor: '#111', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 500 }}>
                  Login as Admin
                </button>
                <button type="button" onClick={() => quickLogin('user')}
                  style={{ flex: 1, padding: '0.6rem', fontSize: '0.8rem', backgroundColor: '#fff', color: '#111', border: '1px solid #E5E5E5', borderRadius: '6px', cursor: 'pointer', fontWeight: 500 }}>
                  Login as User
                </button>
              </div>
              <div style={{ marginTop: '0.75rem', fontSize: '0.75rem', color: '#A3A3A3' }}>
                <p style={{ margin: '0.1rem 0' }}>Admin: admin@solum.com / admin123</p>
                <p style={{ margin: '0.1rem 0' }}>User: user@solum.com / user123</p>
              </div>
            </div>
          </>
        )}

        {/* ── SIGN UP ────────────────────────────────────────── */}
        {tab === 'signup' && (
          <>
            {suSuccess ? (
              <div style={{ textAlign: 'center', padding: '1rem 0' }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✅</div>
                <p style={{ fontWeight: 600, color: '#111', marginBottom: '0.5rem', fontSize: '1.05rem' }}>
                  Registration submitted!
                </p>
                <p style={{ color: '#666', fontSize: '0.875rem', lineHeight: 1.5 }}>
                  Your account is pending admin approval.<br />
                  You can sign in once approved.
                </p>
                <button
                  type="button"
                  onClick={() => { setSuSuccess(false); setTab('signin'); setSuName(''); setSuEmail(''); setSuPass(''); setSuConfirm(''); }}
                  style={{ marginTop: '1.5rem', padding: '0.65rem 2rem', borderRadius: '8px', border: '1px solid #E5E5E5', background: '#fff', cursor: 'pointer', fontWeight: 500, fontSize: '0.9rem' }}
                >
                  Back to Sign In
                </button>
              </div>
            ) : (
              <form onSubmit={handleSignup} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <input
                  type="text" style={inputStyle} placeholder="Full Name" required minLength={2} maxLength={100}
                  value={suName} onChange={e => { setSuName(e.target.value); setSuError(''); }}
                />
                <input
                  type="email" style={inputStyle} placeholder="Email address" required
                  value={suEmail} onChange={e => { setSuEmail(e.target.value); setSuError(''); }}
                />
                <input
                  type="password" style={inputStyle} placeholder="Password (min 8 chars)" required minLength={8}
                  value={suPass} onChange={e => { setSuPass(e.target.value); setSuError(''); }}
                />
                <input
                  type="password" style={inputStyle} placeholder="Confirm Password" required
                  value={suConfirm} onChange={e => { setSuConfirm(e.target.value); setSuError(''); }}
                />

                {suError && <p style={{ color: '#DC2626', fontSize: '0.875rem', margin: 0 }}>{suError}</p>}

                <p style={{ fontSize: '0.78rem', color: '#888', margin: 0 }}>
                  After signing up, an admin will review and approve your account before you can log in.
                </p>

                <button
                  type="submit" disabled={suLoading}
                  style={{
                    width: '100%', padding: '0.9rem', fontSize: '1rem', borderRadius: '8px',
                    backgroundColor: suLoading ? '#888' : '#111', color: '#fff',
                    border: 'none', cursor: suLoading ? 'not-allowed' : 'pointer', fontWeight: 600,
                  }}
                >
                  {suLoading ? 'Submitting…' : 'Create Account'}
                </button>
              </form>
            )}
          </>
        )}

      </div>
    </div>
  );
}
