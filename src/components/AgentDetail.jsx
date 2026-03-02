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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 sm:p-6" onClick={onClose}>
      <div
        className="bg-[#0a0a14]/90 backdrop-blur-md border border-[#2a2a4e] rounded-xl w-full max-w-[480px] max-h-[90vh] overflow-hidden shadow-[0_0_30px_rgba(0,0,0,0.8)] flex flex-col font-mono"
        style={{ boxShadow: `0 0 20px ${agent.color}33, inset 0 0 20px ${agent.color}11`, borderColor: `${agent.color}44` }}
        onClick={e => e.stopPropagation()}
      >
        {/* Glow Top Edge */}
        <div className="h-[2px] w-full shrink-0" style={{ background: `linear-gradient(90deg, transparent, ${agent.color}, transparent)` }}></div>

        {/* Header */}
        <div className="flex items-start justify-between px-6 py-5 border-b border-[#1a1a2e] relative overflow-hidden shrink-0">
          <div className="absolute top-0 right-0 w-40 h-40 opacity-10 blur-2xl rounded-full" style={{ backgroundColor: agent.color }}></div>
          
          <div className="flex items-center gap-4 relative z-10 w-full">
            <div className="w-12 h-12 rounded-lg border flex items-center justify-center text-xl font-bold shadow-lg shrink-0" 
                 style={{ backgroundColor: agent.color + '22', borderColor: agent.color, color: agent.color, textShadow: `0 0 8px ${agent.color}` }}>
              {agent.name.charAt(0)}
            </div>
            <div className="flex-1 min-w-0 pr-4">
              <div className="text-lg font-bold tracking-wide truncate" style={{ color: agent.color, textShadow: `0 0 10px ${agent.color}88` }}>
                {agent.name.toUpperCase()}
              </div>
              <div className="text-[11px] text-[#8a8aaa] mt-1 flex flex-wrap items-center gap-2">
                <span>{agent.role || 'GENERAL AGENT'}</span>
                <span className="text-[#3a3a5a]">//</span>
                <span>ID: {agent.db_id || agent.id}</span>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="absolute top-4 right-4 text-[#4a4a6a] hover:text-white text-2xl px-2 transition-colors z-10 leading-none pb-1 rounded hover:bg-[#1a1a2e]">×</button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-[#1a1a2e] shrink-0 px-2 pt-2 gap-2">
          <button 
            className={`flex-1 py-3 px-4 text-[10px] sm:text-xs font-bold tracking-widest transition-all rounded-t-lg ${activeTab === 'metrics' ? 'text-[#4ecdc4] border-b-2 border-[#4ecdc4] bg-[#4ecdc4]/10' : 'text-[#4a4a6a] hover:text-[#8a8aaa] bg-[#050508]/50 hover:bg-[#1a1a2e]/50'}`}
            onClick={() => setActiveTab('metrics')}
          >
            METRICS & CONTROL
          </button>
          <button 
            className={`flex-1 py-3 px-4 text-[10px] sm:text-xs font-bold tracking-widest transition-all rounded-t-lg ${activeTab === 'thoughts' ? 'text-[#a29bfe] border-b-2 border-[#a29bfe] bg-[#a29bfe]/10' : 'text-[#4a4a6a] hover:text-[#8a8aaa] bg-[#050508]/50 hover:bg-[#1a1a2e]/50'}`}
            onClick={() => setActiveTab('thoughts')}
          >
            THOUGHT TRACES
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-6 space-y-6 custom-scrollbar">
          {activeTab === 'metrics' ? (
            <>
              {/* Status & Control */}
              <div className="bg-[#050508]/80 border border-[#1a1a2e] rounded-xl p-4 sm:p-5 relative overflow-hidden shadow-inner">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="flex items-center gap-2 text-xs font-bold px-3 py-1.5 rounded-md shadow-sm"
                          style={{ backgroundColor: sColor + '15', color: sColor, border: `1px solid ${sColor}44` }}>
                      <span className={`w-2 h-2 rounded-full ${isPaused ? '' : 'animate-pulse'}`} style={{ backgroundColor: sColor }}></span>
                      {isOff ? 'SIN DATOS' : isPaused ? 'AGENT PAUSED' : (state || 'idle').toUpperCase()}
                    </span>
                    
                    {canalIcon && (
                      <span className="text-[10px] px-2.5 py-1.5 rounded-md border shadow-sm"
                            style={{ backgroundColor: canalIcon.color + '10', color: canalIcon.color, borderColor: canalIcon.color + '33' }}>
                        {canalIcon.symbol} {canal.toUpperCase()}
                      </span>
                    )}
                  </div>

                  {!isOff && (
                    <button 
                      onClick={togglePause}
                      disabled={isUpdating}
                      className={`w-full sm:w-auto px-4 py-2 text-[10px] font-bold tracking-wider rounded-md transition-all duration-300 border ${
                        isUpdating ? 'opacity-50 cursor-not-allowed' :
                        isPaused 
                          ? 'bg-[#2ecc71]/10 text-[#2ecc71] border-[#2ecc71]/50 hover:bg-[#2ecc71]/20 hover:shadow-[0_0_15px_rgba(46,204,113,0.3)] active:scale-95'
                          : 'bg-[#e74c3c]/10 text-[#e74c3c] border-[#e74c3c]/50 hover:bg-[#e74c3c]/20 hover:shadow-[0_0_15px_rgba(231,76,60,0.3)] active:scale-95'
                      }`}
                    >
                      {isUpdating ? 'UPDATING...' : isPaused ? '▶ RESUME AGENT' : '⏸ PAUSE AGENT'}
                    </button>
                  )}
                </div>

                {extra?.actionText && !isPaused && (
                  <div className="text-xs text-[#bbb] font-mono flex items-start gap-3 bg-[#1a1a2e]/30 p-3 rounded-md border border-[#2a2a4e]/50">
                    <span className="text-[#4ecdc4] mt-0.5 animate-pulse">❯</span>
                    <span className="typing-effect leading-relaxed">{extra.actionText}</span>
                  </div>
                )}
                
                {isPaused && (
                  <div className="text-[11px] text-[#e74c3c] mt-3 flex items-start gap-2 bg-[#e74c3c]/10 p-3 rounded-md border border-[#e74c3c]/30">
                    <span className="text-sm">⚠</span> 
                    <span className="leading-relaxed">Agente detenido. No procesará nuevos mensajes ni ejecutará herramientas hasta ser reanudado.</span>
                  </div>
                )}
              </div>

              {/* FinOps / Token Usage */}
              <div className="space-y-3">
                <div className="text-[10px] text-[#4a4a6a] font-bold tracking-[0.2em] flex items-center justify-between border-b border-[#1a1a2e] pb-2">
                  <span>FINOPS (1H COST)</span>
                  {extra?.tokens_1h > 10000 && <span className="text-[#e74c3c] animate-pulse bg-[#e74c3c]/10 px-2 py-0.5 rounded text-[9px]">⚠ HIGH CONSUMPTION</span>}
                </div>
                <div className="bg-[#050508]/80 border border-[#1a1a2e] rounded-xl p-5 hover:border-[#2a2a4e] transition-colors">
                  <div className="flex justify-between items-end mb-3">
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-bold text-[#f1c40f] drop-shadow-[0_0_5px_rgba(241,196,15,0.3)]">~{(extra?.tokens_1h || 0).toLocaleString()}</span>
                    </div>
                    <span className="text-[10px] text-[#8a8aaa] tracking-widest font-semibold mb-1">ESTIMATED TOKENS</span>
                  </div>
                  <LoadBar value={extra?.tokens_1h || 0} max={15000} colorMode="finops" />
                  <div className="flex justify-between text-[8px] text-[#3a3a5a] mt-2">
                    <span>0</span>
                    <span>7.5K</span>
                    <span>15K+</span>
                  </div>
                </div>
              </div>

              {/* Metrics Grid */}
              <div className="space-y-3">
                <div className="text-[10px] text-[#4a4a6a] font-bold tracking-[0.2em] border-b border-[#1a1a2e] pb-2">PERFORMANCE METRICS</div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <MetricBox label="MSGS/2M" value={extra?.msgs2min || 0} color="#2ecc71" />
                  <MetricBox label="MSGS/5M" value={extra?.msgs5min || 0} color="#4ecdc4" />
                  <MetricBox label="MSGS/1H" value={extra?.msgs1h || 0} color="#74b9ff" />
                  <MetricBox label="SENT/24H" value={extra?.msgs24hAgent || 0} color="#a29bfe" />
                  <MetricBox label="RECV/24H" value={extra?.msgs24hUser || 0} color="#fd79a8" />
                  <MetricBox label="OPEN CONVS" value={extra?.convsOpen || 0} color="#fdcb6e" />
                </div>
                
                {/* Load Bar */}
                <div className="bg-[#050508]/80 p-4 rounded-xl border border-[#1a1a2e] hover:border-[#2a2a4e] transition-colors mt-2">
                  <div className="flex justify-between items-end mb-2.5">
                    <span className="text-[10px] text-[#4a4a6a] font-bold tracking-widest">WORKLOAD LEVEL</span>
                    <span className="text-[11px] font-bold bg-[#1a1a2e] px-2 py-0.5 rounded" style={{ color: getLoadColor(extra?.convsActive5min || 0, 10) }}>
                      {extra?.convsActive5min || 0} ACTIVE
                    </span>
                  </div>
                  <LoadBar value={extra?.convsActive5min || 0} max={10} />
                </div>
              </div>

              {/* System Info */}
              <div className="space-y-3">
                <div className="text-[10px] text-[#4a4a6a] font-bold tracking-[0.2em] border-b border-[#1a1a2e] pb-2">SYSTEM INFO</div>
                <div className="bg-[#050508]/80 rounded-xl border border-[#1a1a2e] p-4 space-y-3">
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
            <div className="bg-[#000] border border-[#1a1a2e] rounded-xl p-4 font-mono min-h-[300px] flex flex-col shadow-inner relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#a29bfe]/30 to-transparent"></div>
              
              <div className="text-[10px] text-[#a29bfe] mb-4 flex items-center gap-2 border-b border-[#1a1a2e] pb-3 tracking-widest font-bold">
                <span className="animate-pulse">▶</span> 
                LIVE EXECUTION LOGS (LAST 5 MIN)
              </div>
              
              <div className="space-y-4 flex-1 pr-2">
                {!extra?.thought_traces || extra.thought_traces.length === 0 ? (
                  <div className="text-xs text-[#4a4a6a] italic flex items-center justify-center h-32 bg-[#050508]/50 rounded-lg border border-[#1a1a2e] border-dashed">
                    No hay logs de ejecución recientes.
                  </div>
                ) : (
                  extra.thought_traces.map((trace, i) => (
                    <div key={i} className="text-[11px] border-l-2 border-[#2a2a4e] pl-4 py-2 bg-[#050508]/30 rounded-r-lg hover:bg-[#0a0a14] transition-colors">
                      <div className="text-[#8a8aaa] mb-2 flex items-center justify-between">
                        <span className="font-bold opacity-70">[ {new Date(trace.ts).toLocaleTimeString()} ]</span>
                        {trace.tools && <span className="text-[#e67e22] text-[9px] font-bold tracking-wider bg-[#e67e22]/10 border border-[#e67e22]/30 px-2 py-0.5 rounded">TOOL_CALL</span>}
                      </div>
                      <div className="text-[#dcdcdc] whitespace-pre-wrap break-words leading-relaxed font-light">
                        {trace.content || (trace.tools ? '<Empty response, executing tool...>' : '<Empty>')}
                      </div>
                      {trace.tools && (
                        <div className="mt-3 p-3 bg-[#0a0a14] rounded-md border border-[#1a1a2e] text-[#a29bfe] text-[10px] overflow-x-auto shadow-inner">
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
    <div className="bg-[#050508]/80 rounded-xl p-3 border border-[#1a1a2e] flex flex-col items-center justify-center transition-all duration-300 hover:border-[#2a2a4e] hover:shadow-[0_4px_12px_rgba(0,0,0,0.5)] group">
      <div className="text-xl font-bold drop-shadow-md mb-1 transition-transform group-hover:scale-110" style={{ color }}>{value}</div>
      <div className="text-[8px] sm:text-[9px] text-[#6a6a8a] tracking-widest text-center font-bold">{label}</div>
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
