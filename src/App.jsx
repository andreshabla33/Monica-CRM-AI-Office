import { useState, useEffect, useRef, useCallback } from 'react'
import PixelOffice from './components/PixelOffice'
import StatusBar from './components/StatusBar'
import ActivityFeed from './components/ActivityFeed'
import AgentDetail from './components/AgentDetail'
import { useAgentStates } from './hooks/useAgentStates'
import { useSounds } from './hooks/useSounds'

function App() {
  const { agents, states, extras, kpis, activityLog, apiAvailable, isStale } = useAgentStates(5000)
  const { playSound, toggleSounds, isEnabled } = useSounds()
  const [selectedAgent, setSelectedAgent] = useState(null)
  const [soundOn, setSoundOn] = useState(true)
  const prevStatesRef = useRef({})

  // Play sounds on state transitions
  useEffect(() => {
    const prev = prevStatesRef.current;
    Object.keys(states).forEach(id => {
      const cur = states[id];
      const old = prev[id];
      if (old && old !== cur && cur !== 'idle') {
        playSound(cur);
      }
    });
    prevStatesRef.current = { ...states };
  }, [states, playSound]);

  const handleAgentClick = useCallback((agent) => {
    setSelectedAgent(agent);
  }, []);

  const handleToggleSound = useCallback(() => {
    const newVal = toggleSounds();
    setSoundOn(newVal);
  }, [toggleSounds]);

  return (
    <div className="min-h-screen bg-[#050508] bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#0a0a14] via-[#050508] to-[#000000] flex flex-col items-center justify-center p-4 font-mono">
      {/* Header - Mission Control Style */}
      <header className="w-full max-w-[1340px] flex items-center justify-between mb-4 px-6 py-3 bg-[#0a0a14]/60 backdrop-blur-md border border-[#1a1a2e] rounded-xl shadow-[0_0_15px_rgba(0,0,0,0.5)] relative overflow-hidden">
        {/* Glow effect on top edge */}
        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#4ecdc4]/50 to-transparent"></div>
        
        <div className="flex items-center gap-4">
          <div className="w-2 h-2 rounded-full bg-[#4ecdc4] animate-pulse shadow-[0_0_8px_#4ecdc4]"></div>
          <h1 className="text-xl font-bold text-[#4ecdc4] tracking-[0.2em] uppercase drop-shadow-[0_0_8px_rgba(78,205,196,0.3)]">
            Monica CRM <span className="text-[#8a8aaa] font-light text-sm ml-2">|| AI MISSION CONTROL</span>
          </h1>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-[#4a4a6a] tracking-widest">NETWORK STATUS:</span>
            <span className={`text-[10px] px-2 py-0.5 rounded border ${
              apiAvailable && !isStale 
                ? 'bg-[#2ecc71]/10 text-[#2ecc71] border-[#2ecc71]/30 shadow-[0_0_5px_rgba(46,204,113,0.2)]' 
                : 'bg-[#e74c3c]/10 text-[#e74c3c] border-[#e74c3c]/30 shadow-[0_0_5px_rgba(231,76,60,0.2)] animate-pulse'
            }`}>
              {isStale ? 'SYS_FAULT' : apiAvailable ? 'ONLINE' : 'DEMO_MODE'}
            </span>
          </div>

          <button
            onClick={handleToggleSound}
            className={`flex items-center gap-2 text-[10px] px-3 py-1.5 rounded border transition-all duration-300 ${
              soundOn 
                ? 'bg-[#4ecdc4]/10 text-[#4ecdc4] border-[#4ecdc4]/30 hover:bg-[#4ecdc4]/20 shadow-[0_0_5px_rgba(78,205,196,0.2)]' 
                : 'bg-[#1a1a2e] text-[#4a4a6a] border-[#2a2a4e] hover:border-[#4a4a6a]'
            }`}
          >
            {soundOn ? 'AUDIO: ENABLED' : 'AUDIO: MUTED'}
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex gap-4 items-start justify-center max-w-[1340px] w-full relative">
        {/* Canvas container with glassmorphism */}
        <div className="relative bg-[#0a0a14]/40 backdrop-blur-sm border border-[#1a1a2e] rounded-xl overflow-hidden shadow-[0_0_20px_rgba(0,0,0,0.6)]">
          <PixelOffice
            agents={agents}
            agentStates={states}
            extras={extras}
            kpis={kpis}
            onAgentClick={handleAgentClick}
          />
          {/* Subtle overlay scanline effect for the whole canvas container */}
          <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[length:100%_4px]"></div>
        </div>

        {/* Side Panel */}
        <div className="h-[700px]">
          <ActivityFeed log={activityLog} kpis={kpis} apiAvailable={apiAvailable} isStale={isStale} />
        </div>
      </div>

      {/* Status Bar */}
      <div className="mt-4 w-full max-w-[1340px]">
        <StatusBar agents={agents} agentStates={states} extras={extras} apiAvailable={apiAvailable} kpis={kpis} />
      </div>

      {/* Focus Mode Modal */}
      {selectedAgent && (
        <AgentDetail
          agent={selectedAgent}
          state={states[selectedAgent.id] || 'idle'}
          extra={extras[selectedAgent.id] || {}}
          onClose={() => setSelectedAgent(null)}
        />
      )}
    </div>
  )
}

export default App
