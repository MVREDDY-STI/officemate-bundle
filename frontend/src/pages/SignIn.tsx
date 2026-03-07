import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

export default function SignIn() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const ok = await login(email, password);
    if (ok) {
      toast.success(`Welcome back!`);
      navigate('/dashboard');
    } else {
      setError('Invalid email or password.');
    }
  };

  const quickLogin = async (role: 'admin' | 'user') => {
    const creds = role === 'admin'
      ? { email: 'admin@solum.com', password: 'admin123' }
      : { email: 'user@solum.com', password: 'user123' };
    setEmail(creds.email);
    setPassword(creds.password);
    setError('');
    const ok = await login(creds.email, creds.password);
    if (ok) {
      toast.success(`Welcome back!`);
      navigate('/dashboard');
    }
  };

  return (
    <div className="screen-wrapper justify-center align-center" style={{ backgroundColor: '#F8F9FA' }}>
      <div className="card" style={{ width: '100%', maxWidth: '400px', padding: '3rem 2.5rem', border: 'none' }}>

        <div style={{ marginBottom: '2.5rem' }}>
          <h1 style={{ fontSize: '1.5rem', letterSpacing: '1px', marginBottom: '0.25rem' }}>SOLUM</h1>
          <p className="text-muted" style={{ fontSize: '1.2rem' }}>Officemate</p>
        </div>

        <form onSubmit={handleLogin} className="d-flex flex-column gap-3">
          <div>
            <input
              type="email"
              className="input"
              placeholder="Email address"
              required
              value={email}
              onChange={e => { setEmail(e.target.value); setError(''); }}
            />
          </div>
          <div>
            <input
              type="password"
              className="input"
              placeholder="Password"
              required
              value={password}
              onChange={e => { setPassword(e.target.value); setError(''); }}
            />
          </div>

          {error && (
            <p style={{ color: '#DC2626', fontSize: '0.875rem', margin: 0 }}>{error}</p>
          )}

          <div style={{ textAlign: 'left', marginTop: '-0.5rem' }}>
            <a href="#" className="text-muted text-sm footer-link" style={{ textDecoration: 'none' }}>
              Forget Password?
            </a>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', padding: '1rem', fontSize: '1rem', marginTop: '0.5rem' }}
          >
            Member Login
          </button>
        </form>

        {/* Quick login for demo */}
        <div style={{ marginTop: '2rem', borderTop: '1px solid #E5E5E5', paddingTop: '1.5rem' }}>
          <p style={{ fontSize: '0.75rem', color: '#A3A3A3', marginBottom: '0.75rem', textAlign: 'center' }}>
            Quick access (demo)
          </p>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button
              type="button"
              onClick={() => quickLogin('admin')}
              style={{
                flex: 1, padding: '0.6rem', fontSize: '0.8rem',
                backgroundColor: '#111', color: '#fff',
                border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 500,
              }}
            >
              Login as Admin
            </button>
            <button
              type="button"
              onClick={() => quickLogin('user')}
              style={{
                flex: 1, padding: '0.6rem', fontSize: '0.8rem',
                backgroundColor: '#fff', color: '#111',
                border: '1px solid #E5E5E5', borderRadius: '6px', cursor: 'pointer', fontWeight: 500,
              }}
            >
              Login as User
            </button>
          </div>
          <div style={{ marginTop: '1rem', fontSize: '0.75rem', color: '#A3A3A3' }}>
            <p>Admin: admin@solum.com / admin123</p>
            <p>User: user@solum.com / user123</p>
          </div>
        </div>

      </div>
    </div>
  );
}
