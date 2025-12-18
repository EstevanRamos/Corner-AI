import React, { useRef, useEffect } from 'react';
import { OpponentReport, ReportSection, DecisionNode, Finding, Technique } from '../../lib/report-parser';
import { UploadedVideo } from '../../hooks/useVideoUpload';
import { Timestamp } from '../video/TimestampMarker';
import VideoPlayer from '../video/VideoPlayer';
import TimestampChip from './TimestampChip';

interface OpponentReportDisplayProps {
  report: OpponentReport;
  video: UploadedVideo;
}

const DecisionTreeVisual: React.FC<{ nodes: DecisionNode[] }> = ({ nodes }) => {
  if (!nodes || nodes.length === 0) return null;

  return (
    <div className="space-y-4">
      <div className="bg-slate-900/50 p-4 rounded-xl border border-blue-500/20">
         <h3 className="text-blue-400 font-heading text-xl mb-4 flex items-center gap-2">
           <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
           </svg>
           Decision Tree (Counter Logic)
         </h3>
         <div className="space-y-4">
           {nodes.map((node, i) => (
             <div key={i} className="flex flex-col md:flex-row items-stretch gap-0 md:gap-4 relative group">
               {/* Connector Line for Mobile */}
               <div className="md:hidden absolute left-4 top-10 bottom-0 w-0.5 bg-slate-700 -z-10"></div>

               {/* Trigger Side */}
               <div className="flex-1 bg-red-900/20 border border-red-500/30 rounded-lg p-3 relative">
                 <div className="text-[10px] uppercase text-red-400 font-bold mb-1 tracking-wider">IF Opponent...</div>
                 <div className="text-slate-200 text-sm font-medium">{node.trigger}</div>
                 {node.timestamp && (
                   <div className="mt-2 text-right">
                     <span className="text-xs font-mono bg-black/30 px-1.5 py-0.5 rounded text-red-300">
                       [{node.timestamp.time}]
                     </span>
                   </div>
                 )}
               </div>

               {/* Arrow Icon */}
               <div className="hidden md:flex flex-col justify-center items-center text-slate-500">
                 <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                 </svg>
               </div>
               
               {/* Mobile Arrow */}
               <div className="md:hidden flex justify-center -my-2 z-10">
                 <div className="bg-slate-800 rounded-full p-1 border border-slate-700">
                   <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 13l-7 7-7-7m14-8l-7 7-7-7" />
                   </svg>
                 </div>
               </div>

               {/* Response Side */}
               <div className="flex-1 bg-green-900/20 border border-green-500/30 rounded-lg p-3">
                 <div className="text-[10px] uppercase text-green-400 font-bold mb-1 tracking-wider">THEN You...</div>
                 <div className="text-slate-200 text-sm font-medium">{node.response}</div>
               </div>
             </div>
           ))}
         </div>
      </div>
    </div>
  );
};

const TechniquesVisual: React.FC<{ techniques: Technique[] }> = ({ techniques }) => {
    if (!techniques || techniques.length === 0) return null;
  
    return (
      <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-700">
         <h3 className="text-purple-400 font-heading text-xl mb-4 flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Most Utilized Techniques
         </h3>
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {techniques.map((tech, i) => (
               <div key={i} className="bg-slate-800 p-3 rounded-lg border border-slate-700 hover:border-purple-500/50 transition-colors">
                  <div className="text-white font-bold text-sm mb-2">{tech.name}</div>
                  <div className="flex flex-wrap gap-1">
                     {tech.timestamps.slice(0, 3).map((ts, idx) => (
                        <span key={idx} className="text-[10px] font-mono bg-purple-900/30 text-purple-300 px-1.5 py-0.5 rounded">
                           [{ts.time}]
                        </span>
                     ))}
                  </div>
               </div>
            ))}
         </div>
      </div>
    );
};

const FindingList: React.FC<{ items: Finding[], type: 'good' | 'bad' }> = ({ items, type }) => {
  const isGood = type === 'good';
  const borderColor = isGood ? 'border-emerald-500/30' : 'border-red-500/30';
  const headerColor = isGood ? 'text-emerald-400' : 'text-red-400';
  const title = isGood ? '5 THINGS THEY DO GOOD' : '5 THINGS THEY DO BAD';

  // Take top 5
  const topItems = items.slice(0, 5);

  return (
    <div className={`bg-slate-900/50 rounded-xl border ${borderColor} p-4 h-full`}>
      <h3 className={`${headerColor} font-heading text-lg mb-4 flex items-center gap-2`}>
        {isGood ? (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        ) : (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
        )}
        {title}
      </h3>
      <div className="space-y-3">
        {topItems.length > 0 ? topItems.map((item, i) => (
          <div key={i} className="flex gap-3">
             <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${isGood ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
               {i + 1}
             </div>
             <div>
               <div className="text-slate-200 font-bold text-sm">{cleanTitle(item.title)}</div>
               <div className="text-slate-400 text-xs mt-1 leading-snug">{stripTimestampText(item.description)}</div>
               {item.timestamps.length > 0 && (
                 <div className="mt-1 flex flex-wrap gap-1">
                   {item.timestamps.slice(0, 2).map((ts, idx) => (
                     <span key={idx} className="text-[10px] font-mono bg-slate-800 text-slate-400 px-1 rounded">
                       [{ts.time}]
                     </span>
                   ))}
                 </div>
               )}
             </div>
          </div>
        )) : (
          <div className="text-slate-500 text-sm italic">No items identified.</div>
        )}
      </div>
    </div>
  );
};

const OpponentReportDisplay: React.FC<OpponentReportDisplayProps> = ({ report, video }) => {
  const profileSection = report.sections.find(s => s.title.toLowerCase().includes('profile'));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-140px)]">
      
      {/* Left Col: Video (Sticky) */}
      <div className="lg:col-span-1 lg:sticky lg:top-4 h-fit space-y-4">
        <div className="bg-black rounded-xl overflow-hidden border border-slate-700 shadow-2xl">
          <VideoPlayer 
            src={video.url} 
            timestamps={report.timestamps}
          />
        </div>
        <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
           <h3 className="text-white font-heading text-lg mb-2">Metadata</h3>
           <div className="grid grid-cols-2 gap-2 text-xs text-slate-400">
             <div>Fighter: <span className="text-slate-200">{report.fighterName || 'Unknown'}</span></div>
             <div>Duration: <span className="text-slate-200">{Math.floor(video.duration)}s</span></div>
           </div>
        </div>
      </div>

      {/* Right Col: Report Content */}
      <div className="lg:col-span-2 bg-slate-800 rounded-xl border border-slate-700 shadow-xl overflow-hidden flex flex-col">
        {/* Header and Profile */}
        <div className="p-6 border-b border-slate-700 bg-slate-900/50">
          <div className="flex justify-between items-start mb-4">
            <div className="border-l-4 border-blue-500 pl-4">
               <h2 className="text-2xl font-heading text-white uppercase">
                 Corner AI Scouting Report: <span className="text-blue-400">{report.fighterName || 'Unknown'}</span>
               </h2>
            </div>
            <div className="flex gap-2">
              <button className="text-xs bg-slate-700 hover:bg-slate-600 text-white px-3 py-1 rounded transition-colors" onClick={() => window.print()}>
                Print / PDF
              </button>
            </div>
          </div>
          
          {profileSection && (
             <div className="mt-6 pl-5">
                <h3 className="text-lg font-heading text-slate-300 mb-3 uppercase flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                  {profileSection.title}
                </h3>
                <div className="prose prose-invert prose-sm max-w-none text-slate-300 leading-relaxed">
                    {profileSection.content.split('\n').map((line, i) => {
                      const cleanLine = line.trim();
                      if (cleanLine.startsWith('-') || cleanLine.startsWith('*')) {
                        return (
                          <li key={i} className="ml-4 mb-1 list-disc marker:text-blue-500">
                             {highlightTimestamps(cleanLine.replace(/^[-*]\s/, ''))}
                          </li>
                        );
                      }
                      if (cleanLine.length === 0) return null;
                      return <p key={i} className="mb-2">{highlightTimestamps(cleanLine)}</p>;
                    })}
                </div>
             </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
           
           {/* Section: Good vs Bad */}
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <FindingList items={report.strengths || []} type="good" />
             <FindingList items={report.weaknesses || []} type="bad" />
           </div>

            {/* Section: Techniques */}
            {report.mostUtilizedTechniques && report.mostUtilizedTechniques.length > 0 && (
                <TechniquesVisual techniques={report.mostUtilizedTechniques} />
            )}

           {/* Section: Decision Tree */}
           {report.decisionTree && report.decisionTree.length > 0 && (
             <DecisionTreeVisual nodes={report.decisionTree} />
           )}

           {/* Section: Rest of the Report (Exclude specific sections to avoid duplication) */}
           <div className="space-y-6">
             {report.sections
               .filter(s => 
                   !s.title.toLowerCase().includes('decision') && 
                   !s.title.toLowerCase().includes('counter logic') &&
                   !s.title.toLowerCase().includes('strength') && 
                   !s.title.toLowerCase().includes('good') && 
                   !s.title.toLowerCase().includes('weakness') && 
                   !s.title.toLowerCase().includes('bad') &&
                   !s.title.toLowerCase().includes('utilized') &&
                   !s.title.toLowerCase().includes('techniques') &&
                   !s.title.toLowerCase().includes('profile') &&
                   !s.title.toLowerCase().includes('introduction')
               )
               .map((section) => (
               <div key={section.id} className="bg-slate-900/30 rounded-lg p-4 border border-slate-700/50">
                 <h3 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-slate-200 mb-4 border-l-4 border-blue-500 pl-3 uppercase tracking-wider">
                   {section.title}
                 </h3>
                 <div className="prose prose-invert prose-sm max-w-none text-slate-300 leading-relaxed">
                   {section.content.split('\n').map((line, i) => {
                     // Simple formatting for lists
                     if (line.trim().startsWith('-') || line.trim().startsWith('*')) {
                       return (
                         <li key={i} className="ml-4 mb-2 list-disc marker:text-blue-500">
                           {highlightTimestamps(line.replace(/^[-*]\s/, ''))}
                         </li>
                       );
                     }
                     if (line.trim().length === 0) return <br key={i} />;
                     
                     return <p key={i} className="mb-2">{highlightTimestamps(line)}</p>;
                   })}
                 </div>
               </div>
             ))}
           </div>

        </div>
      </div>
    </div>
  );
};

// Helpers
const cleanTitle = (title: string | undefined): string => {
  if (!title) return 'Untitled';
  return title.replace(/\*\*/g, '').replace(/\s*[\[\(]\d*.*$/, '').trim();
};

const stripTimestampText = (text: string): string => {
  return text.replace(/[\[\(]\d{1,2}:\d{2}(?:-\d{1,2}:\d{2})?[\]\)]/g, '').trim();
}

const highlightTimestamps = (text: string) => {
  const parts = text.split(/([\[\(]\d{1,2}:\d{2}[\]\)])/g);
  return parts.map((part, i) => {
    if (part.match(/[\[\(]\d{1,2}:\d{2}[\]\)]/)) {
      return <span key={i} className="text-blue-400 font-mono font-bold text-xs bg-blue-900/30 px-1 rounded mx-1">{part}</span>;
    }
    const boldParts = part.split(/(\*\*[^\*]+\*\*)/g);
    return boldParts.map((bp, j) => {
        if (bp.startsWith('**') && bp.endsWith('**')) {
            return <strong key={`${i}-${j}`} className="text-white">{bp.slice(2, -2)}</strong>;
        }
        return bp;
    });
  });
};

export default OpponentReportDisplay;