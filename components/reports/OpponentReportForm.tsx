import React, { useState } from 'react';
import VideoUploader from '../video/VideoUploader';
import { UploadedVideo } from '../../hooks/useVideoUpload';

export interface OpponentReportInput {
  videos: UploadedVideo[];
  context: {
    fighterName?: string;
    weightClass?: string;
    record?: string;
    knownBackground?: string;
    additionalNotes?: string;
  };
  reportType: 'full' | 'quick';
}

interface OpponentReportFormProps {
  onSubmit: (data: OpponentReportInput) => void;
  isLoading: boolean;
}

const OpponentReportForm: React.FC<OpponentReportFormProps> = ({ onSubmit, isLoading }) => {
  const [uploadedVideo, setUploadedVideo] = useState<UploadedVideo | null>(null);
  const [reportType, setReportType] = useState<'full' | 'quick'>('full');
  
  const [context, setContext] = useState({
    fighterName: '',
    weightClass: '',
    record: '',
    knownBackground: '',
    additionalNotes: ''
  });

  const handleSubmit = () => {
    if (!uploadedVideo) return;
    onSubmit({
      videos: [uploadedVideo],
      context,
      reportType
    });
  };

  const handleVideoError = (err: Error) => {
    console.error(err);
    alert(err.message);
  };

  return (
    <div className="bg-slate-800 rounded-xl border border-slate-700 p-6 md:p-8 shadow-xl">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Left: Video Upload */}
        <div className="space-y-6">
          <h3 className="text-xl font-heading text-white flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-red-600 text-xs flex items-center justify-center">1</span>
            Opponent Footage
          </h3>
          
          {uploadedVideo ? (
            <div className="bg-black rounded-lg overflow-hidden border border-slate-600 relative group">
              <video src={uploadedVideo.url} className="w-full h-48 object-cover opacity-60" />
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <p className="text-white font-mono text-sm mb-2">{uploadedVideo.filename}</p>
                <button 
                  onClick={() => setUploadedVideo(null)}
                  className="bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded text-sm transition-colors"
                >
                  Change Video
                </button>
              </div>
            </div>
          ) : (
             <VideoUploader 
               onUploadComplete={setUploadedVideo}
               onError={handleVideoError}
               label="Upload Fight Video"
               className="h-48"
             />
          )}

          <h3 className="text-xl font-heading text-white flex items-center gap-2 pt-4">
            <span className="w-6 h-6 rounded-full bg-blue-600 text-xs flex items-center justify-center">2</span>
            Report Settings
          </h3>
          
          <div className="flex gap-4">
            <button
              onClick={() => setReportType('full')}
              className={`flex-1 py-3 px-4 rounded-lg border text-left transition-all ${reportType === 'full' ? 'bg-blue-900/30 border-blue-500 ring-1 ring-blue-500' : 'bg-slate-900/50 border-slate-600 hover:border-slate-500'}`}
            >
              <span className={`block font-bold text-sm mb-1 ${reportType === 'full' ? 'text-blue-400' : 'text-slate-300'}`}>Full Breakdown</span>
              <span className="block text-xs text-slate-500">Deep dive into strikes, grappling, and specific habits.</span>
            </button>
            <button
              onClick={() => setReportType('quick')}
              className={`flex-1 py-3 px-4 rounded-lg border text-left transition-all ${reportType === 'quick' ? 'bg-blue-900/30 border-blue-500 ring-1 ring-blue-500' : 'bg-slate-900/50 border-slate-600 hover:border-slate-500'}`}
            >
              <span className={`block font-bold text-sm mb-1 ${reportType === 'quick' ? 'text-blue-400' : 'text-slate-300'}`}>Quick Scout</span>
              <span className="block text-xs text-slate-500">30-sec summary, top 5 threats, and danger zones.</span>
            </button>
          </div>
        </div>

        {/* Right: Context */}
        <div className="space-y-4">
          <h3 className="text-xl font-heading text-white flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-slate-600 text-xs flex items-center justify-center">3</span>
            Context (Optional)
          </h3>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Fighter Name</label>
              <input 
                type="text" 
                className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white text-sm focus:border-blue-500 focus:outline-none"
                value={context.fighterName}
                onChange={e => setContext({...context, fighterName: e.target.value})}
                placeholder="e.g. Jon Jones"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Weight Class</label>
              <select 
                className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white text-sm focus:border-blue-500 focus:outline-none"
                value={context.weightClass}
                onChange={e => setContext({...context, weightClass: e.target.value})}
              >
                <option value="">Select...</option>
                <option value="Flyweight">Flyweight (125)</option>
                <option value="Bantamweight">Bantamweight (135)</option>
                <option value="Featherweight">Featherweight (145)</option>
                <option value="Lightweight">Lightweight (155)</option>
                <option value="Welterweight">Welterweight (170)</option>
                <option value="Middleweight">Middleweight (185)</option>
                <option value="Light Heavyweight">Light Heavyweight (205)</option>
                <option value="Heavyweight">Heavyweight (265)</option>
              </select>
            </div>
          </div>

          <div>
             <label className="block text-xs text-slate-400 mb-1">Known Background</label>
             <input 
                type="text" 
                className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white text-sm focus:border-blue-500 focus:outline-none"
                value={context.knownBackground}
                onChange={e => setContext({...context, knownBackground: e.target.value})}
                placeholder="e.g. NCAA Wrestler, Muay Thai Champion"
              />
          </div>

          <div>
             <label className="block text-xs text-slate-400 mb-1">Specific Notes / What to look for</label>
             <textarea 
                className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white text-sm focus:border-blue-500 focus:outline-none h-24 resize-none"
                value={context.additionalNotes}
                onChange={e => setContext({...context, additionalNotes: e.target.value})}
                placeholder="Is there a specific injury? A pattern you suspect? Type it here."
              />
          </div>
        </div>
      </div>

      <div className="mt-8 border-t border-slate-700 pt-6">
        <button
          onClick={handleSubmit}
          disabled={!uploadedVideo || isLoading}
          className="w-full bg-gradient-to-r from-red-600 to-blue-600 hover:from-red-500 hover:to-blue-500 text-white font-heading text-2xl py-3 rounded-lg shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          {isLoading ? 'GENERATING INTELLIGENCE...' : 'GENERATE SCOUTING REPORT'}
        </button>
      </div>
    </div>
  );
};

export default OpponentReportForm;