import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#111', color: '#fff', padding: '20px' }}>
          <h1 style={{ color: 'var(--accent-magenta)' }}>System Crash</h1>
          <p>The application encountered an unexpected error.</p>
          <pre style={{ background: '#000', padding: '15px', borderRadius: '8px', overflowX: 'auto', maxWidth: '80vw' }}>
            {this.state.error?.toString()}
          </pre>
          <button 
            onClick={() => window.location.reload()} 
            style={{ marginTop: '20px', padding: '10px 20px', background: 'var(--accent-cyan)', color: '#000', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}
          >
            Reboot Reality (Reload)
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
