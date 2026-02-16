import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Polyfills for browser environment (fixes "global is not defined" issues in some libs)
if (typeof window !== 'undefined') {
    if (!(window as any).global) (window as any).global = window;
    if (!(window as any).process) (window as any).process = { env: {} };
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: any;
}

// Simple Error Boundary to catch runtime errors and prevent white screen
class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error("Uncaught Error caught by Boundary:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{padding: 40, fontFamily: 'system-ui, sans-serif', color: '#334155', textAlign: 'center', backgroundColor: '#F8FAFC', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'}}>
          <div style={{backgroundColor: '#FECACA', color: '#DC2626', padding: 20, borderRadius: '50%', marginBottom: 20, width: 64, height: 64, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, fontWeight: 'bold'}}>!</div>
          <h1 style={{fontSize: 24, marginBottom: 10}}>Terjadi Kesalahan Aplikasi</h1>
          <p style={{color: '#64748B', maxWidth: 500, lineHeight: 1.5, marginBottom: 20}}>
             Aplikasi mengalami kendala tak terduga. Ini mungkin disebabkan oleh masalah koneksi atau konfigurasi.
          </p>
          <div style={{backgroundColor: '#FFF', padding: 15, borderRadius: 8, border: '1px solid #E2E8F0', fontFamily: 'monospace', fontSize: 12, color: '#DC2626', marginBottom: 20, maxWidth: '80%', overflow: 'auto'}}>
             {this.state.error?.toString()}
          </div>
          <button 
            onClick={() => window.location.reload()} 
            style={{
                padding: '12px 24px', 
                backgroundColor: '#2563EB', 
                color: 'white', 
                border: 'none', 
                borderRadius: 8, 
                fontWeight: 'bold', 
                cursor: 'pointer',
                boxShadow: '0 4px 6px -1px rgba(37, 99, 235, 0.2)'
            }}
          >
            Muat Ulang Halaman
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);