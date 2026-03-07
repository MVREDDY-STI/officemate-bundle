export default function PageLoader() {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      backgroundColor: '#FAFAFA',
    }}>
      <div style={{
        width: '32px',
        height: '32px',
        border: '2px solid #E5E5E5',
        borderTopColor: '#1A1A1A',
        borderRadius: '50%',
        animation: 'spin 0.7s linear infinite',
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
