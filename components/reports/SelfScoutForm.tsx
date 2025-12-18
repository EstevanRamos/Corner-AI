import React, { useState } from 'react';
import VideoUploader from '../video/VideoUploader';
import { UploadedVideo } from '../../hooks/useVideoUpload';

export interface SelfScoutInput {
  videos: UploadedVideo[];
  analysisType: 'full' | 'quick' | 'progress';
  context: {
    sessionType?: 'sparring' | 'fight' | 'drilling' | 'other';
    notes?: string;
    focusAreas?: string[];
  };
}

interface SelfScoutFormProps {
  onSubmit: (data: SelfScoutInput) => void;
  isLoading: boolean;
}

const SelfScoutForm: React.FC<SelfScoutFormProps> = ({ onSubmit, isLoading }) => {
  const [uploadedVideo, setUploadedVideo] = useState<UploadedVideo | null>(null);
  const [analysisType, setAnalysisType] = useState<'full' | 'quick'>('full'); // Progress not yet implemented fully
  const [sessionType, setSessionType] = useState<'sparring' | 'fight' | 'drilling' | 'other'>('sparring');
  const [notes, setNotes] = useState('');
  const [focusAreas, setFocusAreas] = useState<string[]>([]);

  const toggleFocus = (area: string) => {
    if (focusAreas.includes(area)) {
      setFocusAreas(prev => prev.filter(a => a !== area));
    } else {
      setFocusAreas(prev => [...prev, area]);
    }
  };

  const handleSubmit = () => {
    if (!uploadedVideo) return;
    onSubmit({
      videos: [uploadedVideo],
      analysisType,
      context: {
        sessionType,
        notes,
        focusAreas
      }
    });
  };

  return (
    <div className="bg-slate-800 rounded-xl border border-slate-700 p-6 md:p-8 shadow-xl">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <h3 className="text-xl font-heading text-white flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-emerald-600 text-xs flex items-center justify-center">1</span>
            Your Footage
          </h3>
          
          {uploadedVideo ? (
            <div className="bg-black rounded-lg overflow-hidden border border-slate-600 relative group">
              <video src={uploadedVideo.url} className="w-full h-48 object-cover opacity-60" />
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <p className="text-white font-mono text-sm mb-2">{uploadedVideo.filename}</p>
                <button 
                  onClick={() => setUploadedVideo(null)}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded text-sm transition-colors"
                >
                  Change Video
                </button>
              </div>
            </div>
          ) : (
             <VideoUploader 
               onUploadComplete={setUploadedVideo}
               onError={(e) => alert(e.message)}
               label="Upload Training/Fight Video"
               className="h-48"
             />
          )}

          <div className="pt-4">
             <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">Analysis Depth</h3>
             <div className="flex gap-2 p-1 bg-slate-900 rounded-lg">
               <button
                 onClick={() => setAnalysisType('full')}
                 className={`flex-1 py-2 rounded text-sm font-medium transition-colors ${analysisType === 'full' ? 'bg-slate-700 text-white shadow' : 'text-slate-500 hover:text-slate-300'}`}
               >
                 Full Self-Scout
               </button>
               <button
                 onClick={() => setAnalysisType('quick')}
                 className={`flex-1 py-2 rounded text-sm font-medium transition-colors ${analysisType === 'quick' ? 'bg-slate-700 text-white shadow' : 'text-slate-500 hover:text-slate-300'}`}
               >
                 Quick Session Review
               </button>
             </div>
          </div>
        </div>

        <div className="space-y-5">
           <h3 className="text-xl font-heading text-white flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-slate-600 text-xs flex items-center justify-center">2</span>
            Session Context
          </h3>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Session Type</label>
              <select 
                value={sessionType}
                onChange={(e) => setSessionType(e.target.value as any)}
                className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white text-sm focus:border-emerald-500 focus:outline-none"
              >
                <option value="sparring">Sparring</option>
                <option value="fight">Competition Fight</option>
                <option value="drilling">Drilling / Mitts</option>
                <option value="other">Bag Work / Other</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Date</label>
              <input type="date" className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white text-sm focus:border-emerald-500 focus:outline-none" />
            </div>
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-2">Focus Areas (Optional)</label>
            <div className="flex flex-wrap gap-2">
              {['Striking', 'Grappling', 'Movement', 'Cardio', 'Defense'].map(area => (
                <button
                  key={area}
                  onClick={() => toggleFocus(area)}
                  className={`px-3 py-1 rounded-full text-xs border transition-colors ${focusAreas.includes(area) ? 'bg-emerald-900/40 border-emerald-500 text-emerald-300' : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-500'}`}
                >
                  {area}
                </button>
              ))}
            </div>
          </div>

          <div>
             <label className="block text-xs text-slate-400 mb-1">Notes / Specific Questions</label>
             <textarea 
               value={notes}
               onChange={(e) => setNotes(e.target.value)}
               placeholder="E.g. I felt tired in round 3. Am I dropping my hands when kicking?"
               className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white text-sm focus:border-emerald-500 focus:outline-none h-20 resize-none"
             />
          </div>
        </div>
      </div>

      <div className="mt-8 border-t border-slate-700 pt-6">
        <button
          onClick={handleSubmit}
          disabled={!uploadedVideo || isLoading}
          className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-heading text-2xl py-3 rounded-lg shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          {isLoading ? 'ANALYZING PERFORMANCE...' : 'ANALYZE MY GAME'}
        </button>
      </div>
    </div>
  );
};

export default SelfScoutForm;