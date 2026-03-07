import { useNavigate } from 'react-router-dom';

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="screen-wrapper justify-center align-center" style={{ position: 'relative', overflow: 'hidden' }}>
      
      {/* Background blobs simulating the abstract art */}
      <div 
        className="blob" 
        style={{ 
          width: '500px', height: '400px', 
          backgroundColor: '#E6E1FF', 
          borderRadius: '50%', 
          top: '10%', left: '50%', transform: 'translateX(-50%)' 
        }} 
      />

      <div style={{ zIndex: 10, maxWidth: '600px', width: '100%', padding: '2rem', textAlign: 'center' }}>
        
        {/* Placeholder for illustration */}
        <div style={{ marginBottom: '3rem' }}>
          <img src="/landing-1.png" alt="Illustration" style={{ maxWidth: '100%', height: 'auto', borderRadius: '16px', objectFit: 'contain', maxHeight:'300px' }} />
        </div>

        <div style={{ textAlign: 'left', marginBottom: '1.5rem' }}>
          <h1 style={{ fontSize: '1.5rem', letterSpacing: '1px' }}>SOLUM</h1>
          <p className="text-muted" style={{ fontSize: '1.2rem' }}>Officemate</p>
        </div>

        <h2 style={{ fontSize: '1.5rem', fontWeight: 500, marginBottom: '2.5rem', textAlign: 'left' }}>
          Welcome to a new era of adaptable world.
        </h2>

        <div className="d-flex flex-column gap-2">
          <button 
            className="btn btn-primary" 
            style={{ width: '100%', padding: '1rem', fontSize: '1rem' }}
            onClick={() => navigate('/login')}
          >
            Member Login
          </button>
          <button 
            className="btn btn-outline"
            style={{ width: '100%', padding: '1rem', fontSize: '1rem' }}
          >
            Sign up for Solum onboard
          </button>
        </div>
      </div>
    </div>
  );
}
