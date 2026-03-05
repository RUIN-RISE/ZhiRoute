import React, { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Basic Error Boundary to catch render errors
class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean, error: any }> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error("React Error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '40px', color: '#ff5555', background: '#111', fontFamily: 'monospace', height: '100vh' }}>
          <h1 style={{ fontSize: '24px', marginBottom: '20px' }}>Something went wrong.</h1>
          <div style={{ marginBottom: '10px' }}><strong>Error:</strong> {this.state.error?.toString()}</div>
          <pre style={{ opacity: 0.7, overflow: 'auto', maxHeight: '500px' }}>{this.state.error?.stack}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}

// Global error handler for uncaught exceptions (e.g. import errors)
window.addEventListener('error', (e) => {
  const root = document.getElementById('root');
  if (root && root.innerHTML === '') {
    document.body.innerHTML += `<div style="position:fixed; top:0; left:0; width:100%; padding:20px; color:red; background:rgba(0,0,0,0.9); z-index:9999;">Global Error: ${e.message}</div>`;
  }
});

console.log("App starting mount...");

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
