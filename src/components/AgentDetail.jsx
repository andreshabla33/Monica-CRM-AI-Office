import { useState } from 'react';
import { CANAL_ICONS } from '../data/agents';

const STATUS_COLORS = {
  responding: '#2ecc71', scheduling: '#3498db', qualifying: '#9b59b6',
  sending: '#e67e22', thinking: '#1abc9c', working: '#2ecc71',
  waiting: '#f39c12', overloaded: '#e74c3c', idle: '#636e72',
  paused: '#e74c3c'
};

const SUPABASE_URL = 'https://vecspltvmyopwbjzerow.supabase.co';

export default function AgentDetail({ agent, state, extra, onClose, onStateChange }) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [activeTab, setActiveTab] = useState('metrics'); // 'metrics' | 'thoughts'
  
  if (!agent) return null;

  const isOff = !agent.hasRealData;
  const isPaused = state === 'paused';
  const displayState = isPaused ? 'paused' : state;
  const sColor = STATUS_COLORS[displayState] || '#636e72';
  const canal = extra?.canal;
  const canalIcon = canal && CANAL_ICONS[canal];

  const togglePause = async () => {
    if (isUpdating || isOff) return;
    setIsUpdating(true);
    
    const action = isPaused ? 'resume' : 'pause';
    
    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/agent-control`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentId: agent.db_id, action })
      });
      
      if (!res.ok) throw new Error('API error');
      
      // Optimistic update
      if (onStateChange) {
        onStateChange(agent.id, isPaused ? 'idle' : 'paused');
      }
    } catch (e) {
      console.error('Failed to update agent status:', e);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-[#0a0a14]/90 backdrop-blur-md border border-[#2a2a4e] rounded-xl w-[440px] max-h-[85vh] overflow-hidden shadow-[0_0_30px_rgba(0,0,0,0.8)] flex flex-col font-mono"
        style={{ boxShadow: `0 0 20px ${agent.color}33, inset 0 0 20px ${agent.color}11`, borderColor: `${agent.color}44` }}
        onClick={e => e.stopPropagation()}
      >
        {/* Glow Top Edge */}
        <div className="h-[2px] w-full" style={{ background: `linear-gradient(90deg, transparent, ${agent.color}, transparent)` }}></div>

        {/* Header */}
        <div className="flex items-start justify-between px-5 py-4 border-b border-[#1a1a2e] relative overflow-hidden shrink-0">
          <div className="absolute top-0 right-0 w-32 h-32 opacity-10 blur-xl rounded-full" style={{ backgroundColor: agent.color }}></div>
          
          <div className="flex items-center gap-3 relative z-10">
            <div className="w-10 h-10 rounded border flex items-center justify-center text-lg font-bold shadow-lg" 
                 style={{ backgroundColor: agent.color + '22', borderColor: agent.color, color: agent.color, textShadow: `0 0 8px ${agent.color}` }}>
              {agent.name.charAt(0)}
            </div>
            <div>
              <div className="text-base font-bold tracking-wide" style={{ color: agent.color, textShadow: `0 0 10px ${agent.color}88` }}>
                {agent.name.toUpperCase()}
              </div>
              <div className="text-[10px] text-[#8a8aaa] mt-0.5">
                {agent.role || 'GENERAL AGENT'} // ID: {agent.db_id || agent.id}
              </div>
            </div>
          </div>
          <button onClick={onClose} className="text-[#4a4a6a] hover:text-white text-xl px-2 transition-colors z-10">×</button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-[#1a1a2e] shrink-0">
          <button 
            className={`flex-1 py-2 text-[10px] font-bold tracking-widest transition-colors ${activeTab === 'metrics' ? 'text-[#4ecdc4] border-b-2 border-[#4ecdc4] bg-[#4ecdc4]/5' : 'text-[#4a4a6a] hover:text-[#8a8aaa] bg-[#050508]'}`}
            onClick={() => setActiveTab('metrics')}
          >
            METRICS & CONTROL
          </button>
          <button 
            className={`flex-1 py-2 text-[10px] font-bold tracking-widest transition-colors ${activeTab === 'thoughts' ? 'text-[#a29bfe] border-b-2 border-[#a29bfe] bg-[#a29bfe]/5' : 'text-[#4a4a6a] hover:text-[#8a8aaa] bg-[#050508]'}`}
            onClick={() => setActiveTab('thoughts')}
          >
            THOUGHT TRACES
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-5 space-y-5">
          {activeTab === 'metrics' ? (
            <>
              {/* Status & Control */}
              <div className="bg-[#050508] border border-[#1a1a2e] rounded-lg p-3 relative overflow-hidden">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="flex items-center gap-2 text-xs font-bold px-2.5 py-1 rounded"
                          style={{ backgroundColor: sColor + '22', color: sColor, border: `1px solid ${sColor}44` }}>
                      <span className={`w-2 h-2 rounded-full ${isPaused ? '' : 'animate-pulse'}`} style={{ backgroundColor: sColor }}></span>
                      {isOff ? 'SIN DATOS' : isPaused ? 'AGENT PAUSED' : (state || 'idle').toUpperCase()}
                    </span>
                    
                    {canalIcon && (
                      <span className="text-[10px] px-2 py-1 rounded border"
                            style={{ backgroundColor: canalIcon.color + '11', color: canalIcon.color, borderColor: canalIcon.color + '33' }}>
                        {canalIcon.symbol} {canal.toUpperCase()}
                      </span>
                    )}
                  </div>

                  {!isOff && (
                    <button 
                      onClick={togglePause}
                      disabled={isUpdating}
                      className={`px-3 py-1 text-[10px] font-bold rounded transition-all duration-300 border ${
                        isUpdating ? 'opacity-50 cursor-not-allowed' :
                        isPaused 
                          ? 'bg-[#2ecc71]/10 text-[#2ecc71] border-[#2ecc71]/50 hover:bg-[#2ecc71]/20 hover:shadow-[0_0_10px_rgba(46,204,113,0.3)]'
                          : 'bg-[#e74c3c]/10 text-[#e74c3c] border-[#e74c3c]/50 hover:bg-[#e74c3c]/20 hover:shadow-[0_0_10px_rgba(231,76,60,0.3)]'
                      }`}
                    >
                      {isUpdating ? 'UPDATING...' : isPaused ? '▶ RESUME' : '⏸ PAUSE'}
                    </button>
                  )}
                </div>

                {extra?.actionText && !isPaused && (
                  <div className="text-[11px] text-[#bbb] font-mono flex items-start gap-2">
                    <span className="text-[#4ecdc4] mt-0.5">❯</span>
                    <span className="typing-effect">{extra.actionText}</span>
                  </div>
                )}
                
                {isPaused && (
                  <div className="text-[10px] text-[#e74c3c] mt-2 flex items-center gap-1.5 bg-[#e74c3c]/10 p-2 rounded">
                    <span>⚠</span> Agente detenido. No procesará nuevos mensajes hasta ser reanudado.
                  </div>
                )}
              </div>

              {/* FinOps / Token Usage */}
              <div>
                <div className="text-[9px] text-[#4a4a6a] mb-2 font-bold tracking-[0.2em] flex justify-between">
                  <span>FINOPS (1H COST)</span>
                  {extra?.tokens_1h > 10000 && <span className="text-[#e74c3c] animate-pulse">⚠ HIGH CONSUMPTION</span>}
                </div>
                <div className="bg-[#050508] border border-[#1a1a2e] rounded-lg p-3">
                  <div className="flex justify-between items-end mb-2">
                    <span className="text-xl font-bold text-[#f1c40f]">~{(extra?.tokens_1h || 0).toLocaleString()}</span>
                    <span className="text-[10px] text-[#8a8aaa] mb-1">TOKENS ESTIMADOS</span>
                  </div>
                  <LoadBar value={extra?.tokens_1h || 0} max={15000} colorMode="finops" />
                </div>
              </div>

              {/* Metrics Grid */}
              <div>
                <div className="text-[9px] text-[#4a4a6a] mb-2 font-bold tracking-[0.2em]">PERFORMANCE METRICS</div>
                <div className="grid grid-cols-3 gap-2">
                  <MetricBox label="MSGS/2M" value={extra?.msgs2min || 0} color="#2ecc71" />
                  <MetricBox label="MSGS/5M" value={extra?.msgs5min || 0} color="#4ecdc4" />
                  <MetricBox label="MSGS/1H" value={extra?.msgs1h || 0} color="#74b9ff" />
                  <MetricBox label="SENT/24H" value={extra?.msgs24hAgent || 0} color="#a29bfe" />
                  <MetricBox label="RECV/24H" value={extra?.msgs24hUser || 0} color="#fd79a8" />
                  <MetricBox label="OPEN CONVS" value={extra?.convsOpen || 0} color="#fdcb6e" />
                </div>
                
                {/* Load Bar */}
                <div className="mt-3 bg-[#050508] p-2.5 rounded border border-[#1a1a2e]">
                  <div className="flex justify-between items-end mb-1.5">
                    <span className="text-[9px] text-[#4a4a6a] font-bold tracking-widest">WORKLOAD LEVEL</span>
                    <span className="text-[9px]" style={{ color: getLoadColor(extra?.convsActive5min || 0, 10) }}>
                      {extra?.convsActive5min || 0} ACTIVE
                    </span>
                  </div>
                  <LoadBar value={extra?.convsActive5min || 0} max={10} />
                </div>
              </div>

              {/* System Info */}
              <div>
                <div className="text-[9px] text-[#4a4a6a] mb-2 font-bold tracking-[0.2em]">SYSTEM INFO</div>
                <div className="bg-[#050508] rounded border border-[#1a1a2e] p-3 space-y-2">
                  <InfoRow label="MODEL" value={(agent.llm || '').split('/').pop() || 'Unknown'} />
                  {extra?.lastTool && <InfoRow label="LAST TOOL" value={extra.lastTool} />}
                  <InfoRow 
                    label="LAST SYNC" 
                    value={agent.lastActivity ? new Date(agent.lastActivity).toLocaleTimeString() : 'N/A'} 
                  />
                </div>
              </div>
            </>
          ) : (
            /* Thought Traces Tab (Console style) */
            <div className="bg-[#000] border border-[#1a1a2e] rounded-lg p-3 font-mono h-full flex flex-col">
              <div className="text-[9px] text-[#a29bfe] mb-3 flex items-center gap-2 border-b border-[#1a1a2e] pb-2">
                <span className="animate-pulse">▶</span> 
                LIVE EXECUTION LOGS (LAST 5 MIN)
              </div>
              
              <div className="space-y-4 flex-1 overflow-y-auto pr-2 custom-scrollbar">
                {!extra?.thought_traces || extra.thought_traces.length === 0 ? (
                  <div className="text-[10px] text-[#4a4a6a] italic">No hay logs recientes para este agente.</div>
                ) : (
                  extra.thought_traces.map((trace, i) => (
                    <div key={i} className="text-[10px] border-l-2 border-[#2a2a4e] pl-3 py-1">
                      <div className="text-[#8a8aaa] mb-1 flex items-center justify-between">
                        <span>[ {new Date(trace.ts).toLocaleTimeString()} ]</span>
                        {trace.tools && <span className="text-[#e67e22] text-[9px] bg-[#e67e22]/10 px-1 rounded">TOOL_CALL</span>}
                      </div>
                      <div className="text-[#bbb] whitespace-pre-wrap break-words leading-relaxed">
                        {trace.content || (trace.tools ? '<Empty response, executing tool...>' : '<Empty>')}
                      </div>
                      {trace.tools && (
                        <div className="mt-2 p-2 bg-[#1a1a2e] rounded text-[#a29bfe] text-[9px] overflow-x-auto">
                          {typeof trace.tools === 'string' ? trace.tools : JSON.stringify(trace.tools, null, 2)}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function MetricBox({ label, value, color }) {
  return (
    <div className="bg-[#050508] rounded p-2 border border-[#1a1a2e] flex flex-col items-center justify-center transition-colors hover:border-[#2a2a4e]">
      <div className="text-sm font-bold drop-shadow-md mb-0.5" style={{ color }}>{value}</div>
      <div className="text-[7px] text-[#4a4a6a] tracking-wider text-center">{label}</div>
    </div>
  );
}

function getLoadColor(value, max) {
  const pct = Math.min(value / max, 1);
  return pct >= 0.8 ? '#e74c3c' : pct >= 0.5 ? '#e67e22' : pct >= 0.3 ? '#f1c40f' : '#2ecc71';
}

function LoadBar({ value, max, colorMode = 'load' }) {
  const pct = Math.min(value / max, 1);
  
  let color;
  if (colorMode === 'finops') {
    color = pct >= 0.8 ? '#e74c3c' : pct >= 0.5 ? '#f39c12' : '#2ecc71';
  } else {
    color = getLoadColor(value, max);
  }
  
  // Render segmented bar for sci-fi look
  const segments = 20;
  const activeSegments = Math.floor(pct * segments);
  
  return (
    <div className="flex gap-0.5 h-2">
      {Array.from({ length: segments }).map((_, i) => (
        <div 
          key={i} 
          className="flex-1 rounded-sm transition-all duration-300"
          style={{ 
            backgroundColor: i < activeSegments ? color : '#1a1a2e',
            boxShadow: i < activeSegments ? `0 0 4px ${color}88` : 'none',
            opacity: i < activeSegments ? 1 : 0.5
          }}
        />
      ))}
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div className="flex items-center justify-between py-1 border-b border-[#1a1a2e] last:border-0 last:pb-0">
      <span className="text-[9px] text-[#4a4a6a] tracking-widest">{label}</span>
      <span className="text-[10px] text-[#8a8aaa] max-w-[200px] truncate text-right font-semibold">{value}</span>
    </div>
  );
}
