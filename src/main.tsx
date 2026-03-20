import React, { Component, ErrorInfo, ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// --- Error Boundary: prevents black screen if a component crashes ---
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class GuardianErrorBoundary extends Component<{ children: ReactNode }, ErrorBoundaryState> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[Guardian Error Boundary]', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100dvh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#121212',
          color: 'white',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          padding: '2rem',
          textAlign: 'center',
        }}>
          <div style={{
            width: '64px', height: '64px', borderRadius: '50%',
            background: 'rgba(255,59,48,0.15)', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            marginBottom: '1.5rem', fontSize: '28px',
          }}>
            🛡️
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 900, marginBottom: '0.5rem', letterSpacing: '-0.02em' }}>
            Guardian — Recovery Mode
          </h1>
          <p style={{ fontSize: '0.85rem', color: '#999', maxWidth: '360px', lineHeight: 1.6, marginBottom: '1.5rem' }}>
            A component failed to load. Your data is safe. Tap below to restart.
          </p>
          <p style={{ fontSize: '0.7rem', color: '#555', fontFamily: 'monospace', marginBottom: '1.5rem', maxWidth: '400px', wordBreak: 'break-all' }}>
            {this.state.error?.message}
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              background: '#FF3B30', color: 'black', border: 'none',
              padding: '14px 32px', borderRadius: '16px',
              fontWeight: 900, fontSize: '0.75rem',
              textTransform: 'uppercase', letterSpacing: '0.1em',
              cursor: 'pointer',
            }}
          >
            Restart Guardian
          </button>
          <div style={{ marginTop: '2rem' }}>
            <a href="tel:140" style={{ color: '#FF3B30', fontWeight: 700, fontSize: '0.85rem', textDecoration: 'none' }}>
              🚨 Emergency: Call 140
            </a>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <GuardianErrorBoundary>
      <App />
    </GuardianErrorBoundary>
  </React.StrictMode>,
);
