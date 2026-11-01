import React from "react";

export class ErrorBoundary extends React.Component {
  constructor(props){ super(props); this.state = { hasError:false }; }
  static getDerivedStateFromError(){ return { hasError:true }; }
  componentDidCatch(err, info){
    console.error("Boundary:", err, info);
    // După un deploy, un tab vechi cere fișiere JS care nu mai există: reîncărcăm o singură dată.
    const chunk = /dynamically imported module|Failed to fetch|Loading chunk|Importing a module script failed/i.test(String(err?.message || err));
    try {
      if (chunk && !sessionStorage.getItem("pipesan-chunk-reload")) {
        sessionStorage.setItem("pipesan-chunk-reload", "1");
        window.location.reload();
      }
    } catch { /* fără sessionStorage, rămâne ecranul de eroare */ }
  }
  render(){
    if (this.state.hasError) {
      return (
        <div className="max-w-3xl mx-auto py-20 text-center text-gray-700">
          <h2 className="text-2xl font-semibold mb-2">Something went wrong</h2>
          <p className="mb-4">Please refresh the page. If the problem persists, contact support.</p>
          <button onClick={()=>location.reload()} className="px-4 py-2 bg-primary text-white rounded-lg">
            Refresh
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
