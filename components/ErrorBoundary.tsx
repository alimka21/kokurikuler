import React, { Component, ReactNode, ErrorInfo } from "react";
import { AlertTriangle } from "lucide-react";

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: any;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  static getDerivedStateFromError(error: any): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: any, errorInfo: ErrorInfo) {
    console.error("Uncaught Error caught by Boundary:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
            padding: 40, 
            fontFamily: 'system-ui, sans-serif', 
            color: '#334155', 
            textAlign: 'center', 
            backgroundColor: '#F8FAFC', 
            minHeight: '100vh', 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            justifyContent: 'center'
        }}>
          <div style={{
              backgroundColor: '#FECACA', 
              color: '#DC2626', 
              padding: 20, 
              borderRadius: '50%', 
              marginBottom: 20, 
              width: 80, 
              height: 80, 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center'
          }}>
             <AlertTriangle size={40} />
          </div>
          <h1 style={{fontSize: 24, marginBottom: 10, fontWeight: 'bold'}}>Terjadi Kesalahan Aplikasi</h1>
          <p style={{color: '#64748B', maxWidth: 500, lineHeight: 1.5, marginBottom: 20}}>
             Aplikasi mengalami kendala tak terduga. Silakan coba muat ulang halaman.
          </p>
          <div style={{
              backgroundColor: '#FFF', 
              padding: 15, 
              borderRadius: 8, 
              border: '1px solid #E2E8F0', 
              fontFamily: 'monospace', 
              fontSize: 12, 
              color: '#DC2626', 
              marginBottom: 20, 
              maxWidth: '90%', 
              overflow: 'auto',
              textAlign: 'left'
          }}>
             {this.state.error?.toString()}
          </div>
          <button 
            onClick={() => window.location.reload()} 
            style={{
                padding: '12px 24px', 
                backgroundColor: '#2563EB', 
                color: 'white', 
                border: 'none', 
                borderRadius: 12, 
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