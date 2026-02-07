export function LoadingScreen() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="glass-card corner-marks p-8 text-center space-y-4 neon-border">
        <div className="text-4xl neon-text-cyan">⬡</div>
        <h2 className="text-lg font-semibold text-cyan-100" style={{ fontFamily: 'Orbitron' }}>Loading ALMASFUFA</h2>
        <p className="text-sm text-cyan-500/40" style={{ fontFamily: 'Share Tech Mono' }}>Syncing inventory, WIP, and finance data...</p>
        <div className="w-64 h-2 bg-cyan-500/10 rounded-full overflow-hidden">
          <div className="h-2 bg-gradient-to-r from-cyan-500 to-purple-500 w-1/2 animate-pulse" />
        </div>
      </div>
    </div>
  );
}

export function ErrorScreen({ title, details }: { title?: string; details?: string }) {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="glass-card corner-marks p-8 text-center space-y-4 border border-red-500/30">
        <div className="text-4xl neon-text-red">⚠</div>
        <h2 className="text-lg font-semibold text-cyan-100" style={{ fontFamily: 'Orbitron' }}>{title ?? "System Error"}</h2>
        <p className="text-sm text-cyan-500/40" style={{ fontFamily: 'Share Tech Mono' }}>{details ?? "Please reload the page or contact support."}</p>
        <button className="btn-cyber-magenta">Reload</button>
      </div>
    </div>
  );
}
