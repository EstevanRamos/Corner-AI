import React, { useState } from 'react';
import { FightAnalysis, RoundAnalysis } from '../types';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell } from 'recharts';

interface Props {
  data: FightAnalysis;
  onReset: () => void;
}

const ScoreCard: React.FC<{ round: RoundAnalysis }> = ({ round }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg overflow-hidden mb-3 transition-all">
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="p-4 flex justify-between items-center cursor-pointer hover:bg-slate-750"
      >
        <div className="flex items-center gap-4">
          <span className="font-heading text-2xl text-slate-400">R{round.round}</span>
          <div className="flex flex-col">
            <span className="font-bold text-lg text-white">Winner: {round.winner}</span>
            <span className={`text-sm font-mono ${round.score.includes('10-8') ? 'text-yellow-400' : 'text-slate-400'}`}>
              Score: {round.score}
            </span>
          </div>
        </div>
        <div className="text-slate-500">
          {isOpen ? '▲' : '▼'}
        </div>
      </div>

      {isOpen && (
        <div className="px-4 pb-4 bg-slate-800/50 border-t border-slate-700">
          <p className="py-3 text-slate-300 italic text-sm border-b border-slate-700/50 mb-3">
            "{round.explanation}"
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-red-400 font-bold block mb-1">STRIKING</span>
              <p className="text-slate-400">{round.striking}</p>
            </div>
            <div>
              <span className="text-blue-400 font-bold block mb-1">GRAPPLING</span>
              <p className="text-slate-400">{round.grappling}</p>
            </div>
            <div>
              <span className="text-orange-400 font-bold block mb-1">AGGRESSION</span>
              <p className="text-slate-400">{round.aggression}</p>
            </div>
            <div>
              <span className="text-emerald-400 font-bold block mb-1">CONTROL</span>
              <p className="text-slate-400">{round.control}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const AnalysisResults: React.FC<Props> = ({ data, onReset }) => {
  const nameA = data.fighter_a_name || 'Fighter A';
  const nameB = data.fighter_b_name || 'Fighter B';

  // Chart Data Preparation
  const chartData = data.rounds.map(r => ({
    round: `R${r.round}`,
    diff: r.score === '10-8' ? 2 : 1, // Simplified metric for visuals
    winner: r.winner
  }));

  return (
    <div className="max-w-6xl mx-auto pb-20">
      {/* Header Summary */}
      <div className="flex flex-col md:flex-row gap-6 mb-8">
        <div className="flex-1 bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-xl">
          <h2 className="text-slate-400 font-heading text-lg mb-2">Overall Rating</h2>
          <div className="flex items-end gap-3">
            <span className="text-6xl font-bold text-white font-heading">{data.overall_rating}</span>
            <span className="text-xl text-slate-500 mb-2">/ 100</span>
          </div>
          <div className="mt-4 h-2 w-full bg-slate-700 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-red-500 to-blue-500" 
              style={{ width: `${data.overall_rating}%` }}
            ></div>
          </div>
        </div>
        
        <div className="flex-[2] bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-xl flex flex-col justify-center">
          <h2 className="text-slate-400 font-heading text-lg mb-2">Fight Summary</h2>
          <p className="text-slate-200 leading-relaxed text-sm md:text-base">
            {data.overall_summary}
          </p>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Col: Round Scoring & Fighter Analysis */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Round by Round Section */}
          <div className="space-y-4">
            <h3 className="font-heading text-2xl text-white border-l-4 border-red-500 pl-3">Round by Round</h3>
            {data.rounds.map((round) => (
              <ScoreCard key={round.round} round={round} />
            ))}

            {/* Simple Momentum Chart */}
            <div className="mt-8 bg-slate-800 p-4 rounded-lg border border-slate-700">
               <h4 className="text-slate-400 text-sm font-bold mb-4 uppercase tracking-wider">Scoring Differential</h4>
               <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                    <XAxis dataKey="round" stroke="#94a3b8" tickLine={false} />
                    <YAxis hide />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f1f5f9' }}
                      itemStyle={{ color: '#e2e8f0' }}
                      cursor={{fill: 'transparent'}}
                    />
                    <Bar dataKey="diff" radius={[4, 4, 0, 0]}>
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.winner.includes(nameA) || entry.winner.includes('A') ? '#ef4444' : '#3b82f6'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
               </div>
               <div className="flex justify-center gap-6 mt-2 text-xs font-mono">
                 <div className="flex items-center gap-2"><div className="w-3 h-3 bg-red-500 rounded-sm"></div>{nameA}</div>
                 <div className="flex items-center gap-2"><div className="w-3 h-3 bg-blue-500 rounded-sm"></div>{nameB}</div>
               </div>
            </div>
          </div>

          {/* Fighter Analysis Section (Moved below rounds) */}
          <div>
            <h3 className="font-heading text-2xl text-white border-l-4 border-blue-500 pl-3 mb-4">Technical Breakdown</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Fighter A Stats */}
              <div className="bg-slate-800 p-5 rounded-lg border-t-4 border-red-500 shadow-lg">
                <h3 className="text-red-500 font-heading text-xl mb-4">{nameA}</h3>
                <div className="mb-4">
                  <h4 className="text-slate-300 text-xs font-bold uppercase tracking-wider mb-2">Strengths</h4>
                  <ul className="list-disc list-inside space-y-1 text-sm text-slate-400 marker:text-red-500">
                    {data.fighter_a_strengths.map((s, i) => <li key={i}>{s}</li>)}
                  </ul>
                </div>
                <div>
                  <h4 className="text-slate-300 text-xs font-bold uppercase tracking-wider mb-2">Weaknesses</h4>
                  <ul className="list-disc list-inside space-y-1 text-sm text-slate-400 marker:text-red-900">
                    {data.fighter_a_weaknesses.map((w, i) => <li key={i}>{w}</li>)}
                  </ul>
                </div>
              </div>

              {/* Fighter B Stats */}
              <div className="bg-slate-800 p-5 rounded-lg border-t-4 border-blue-500 shadow-lg">
                <h3 className="text-blue-500 font-heading text-xl mb-4">{nameB}</h3>
                <div className="mb-4">
                  <h4 className="text-slate-300 text-xs font-bold uppercase tracking-wider mb-2">Strengths</h4>
                  <ul className="list-disc list-inside space-y-1 text-sm text-slate-400 marker:text-blue-500">
                    {data.fighter_b_strengths.map((s, i) => <li key={i}>{s}</li>)}
                  </ul>
                </div>
                <div>
                  <h4 className="text-slate-300 text-xs font-bold uppercase tracking-wider mb-2">Weaknesses</h4>
                  <ul className="list-disc list-inside space-y-1 text-sm text-slate-400 marker:text-blue-900">
                    {data.fighter_b_weaknesses.map((w, i) => <li key={i}>{w}</li>)}
                  </ul>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Right Col: Detected Tells (Moved from bottom) */}
        <div className="space-y-6">
          <div className="bg-yellow-900/10 p-5 rounded-lg border border-yellow-500/30 sticky top-4">
            <h3 className="text-yellow-400 font-heading text-xl mb-4 flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
              Detected Tells
            </h3>
            <ul className="space-y-3">
              {data.detected_tells.length > 0 ? data.detected_tells.map((tell, i) => (
                <li key={i} className="text-sm text-yellow-100/80 bg-yellow-900/20 p-3 rounded border-l-2 border-yellow-500 leading-relaxed">
                  {tell}
                </li>
              )) : <li className="text-sm text-slate-500 italic">No significant tells detected.</li>}
            </ul>
          </div>
        </div>

      </div>

      <div className="mt-12 text-center">
        <button 
          onClick={onReset}
          className="bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 px-8 rounded-full transition-colors border border-slate-500"
        >
          Analyze Another Fight
        </button>
      </div>
    </div>
  );
};

export default AnalysisResults;