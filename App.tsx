import React, { useState, useRef, useEffect } from 'react';
import { FightAnalysis } from './types';
import { analyzeFightData } from './services/geminiService';
import LoadingOverlay from './components/LoadingOverlay';
import AnalysisResults from './components/AnalysisResults';
import VideoUploader from './components/video/VideoUploader';
import VideoPlayer from './components/video/VideoPlayer';
import OpponentScoutPage from './app/opponent-scout/page';
import SelfScoutPage from './app/self-scout/page';
import { UploadedVideo } from './hooks/useVideoUpload';
import { MAX_FILE_SIZE_MB } from './constants';

type ViewMode = 'analyzer' | 'scout' | 'self-scout';

const SCORING_STORAGE_KEY = 'fight_analyzer_scoring_report';

const App: React.FC = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('analyzer');

  // --- FIGHT ANALYZER STATE ---
  const [uploadedVideo, setUploadedVideo] = useState<UploadedVideo | null>(null);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [textNotes, setTextNotes] = useState<string>('');
  
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<FightAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);

  const imageInputRef = useRef<HTMLInputElement>(null);

  // Load from local storage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(SCORING_STORAGE_KEY);
      if (stored) {
        setAnalysisResult(JSON.parse(stored));
      }
    } catch (e) {
      console.error('Failed to load scoring report', e);
    }
  }, []);

  const handleVideoUploadComplete = (video: UploadedVideo) => {
    setUploadedVideo(video);
    setError(null);
  };

  const handleVideoError = (err: Error) => {
    setError(err.message);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setImageFiles(prev => [...prev, ...files]);
    }
  };

  const removeImage = (index: number) => {
    setImageFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleAnalyze = async () => {
    if (!uploadedVideo && !textNotes && imageFiles.length === 0) {
      setError("Please provide at least one input (Video, Image, or Text).");
      return;
    }

    setIsAnalyzing(true);
    setError(null);

    try {
      const videoFile = uploadedVideo ? uploadedVideo.file : null;
      const result = await analyzeFightData(videoFile, imageFiles, textNotes);
      localStorage.setItem(SCORING_STORAGE_KEY, JSON.stringify(result));
      setAnalysisResult(result);
    } catch (err) {
      setError("Analysis failed. Please try again. Ensure your API Key supports the selected model.");
      console.error(err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleReset = () => {
    setAnalysisResult(null);
    setUploadedVideo(null);
    setImageFiles([]);
    setTextNotes('');
    setError(null);
    localStorage.removeItem(SCORING_STORAGE_KEY);
    if (imageInputRef.current) imageInputRef.current.value = '';
  };

  // --- RENDER ---

  if (isAnalyzing) {
    return <LoadingOverlay />;
  }

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col">
      {/* Navigation */}
      <nav className="w-full bg-slate-900/80 backdrop-blur border-b border-slate-800 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <span className="font-heading text-2xl font-bold text-white italic tracking-tighter">
              CORNER <span className="text-red-600">AI</span>
            </span>
            <div className="hidden md:flex gap-1">
              <button 
                onClick={() => setViewMode('analyzer')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${viewMode === 'analyzer' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'}`}
              >
                Fight Scoring
              </button>
              <button 
                onClick={() => setViewMode('scout')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${viewMode === 'scout' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'}`}
              >
                Opponent Scout
              </button>
              <button 
                onClick={() => setViewMode('self-scout')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${viewMode === 'self-scout' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'}`}
              >
                Self Scout
              </button>
            </div>
          </div>
          <div className="text-xs text-slate-500 font-mono">
            Powered by Gemini 3.0
          </div>
        </div>
        {/* Mobile Nav */}
        <div className="md:hidden flex border-t border-slate-800">
          <button 
            onClick={() => setViewMode('analyzer')}
            className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider ${viewMode === 'analyzer' ? 'text-white bg-slate-800' : 'text-slate-500'}`}
          >
            Scoring
          </button>
          <button 
            onClick={() => setViewMode('scout')}
            className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider ${viewMode === 'scout' ? 'text-white bg-slate-800' : 'text-slate-500'}`}
          >
            Scout
          </button>
          <button 
            onClick={() => setViewMode('self-scout')}
            className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider ${viewMode === 'self-scout' ? 'text-white bg-slate-800' : 'text-slate-500'}`}
          >
            Self
          </button>
        </div>
      </nav>

      <main className="flex-1">
        {viewMode === 'scout' ? (
          <OpponentScoutPage />
        ) : viewMode === 'self-scout' ? (
          <SelfScoutPage />
        ) : (
          <div className="flex flex-col items-center p-4 md:p-8">
            {analysisResult ? (
              <div className="w-full">
                 <div className="max-w-5xl mx-auto flex justify-end mb-4">
                   <button onClick={handleReset} className="text-slate-500 hover:text-white text-sm">Reset</button>
                 </div>
                 <AnalysisResults data={analysisResult} onReset={handleReset} />
              </div>
            ) : (
              <>
                <header className="w-full max-w-4xl mb-12 flex flex-col items-center text-center mt-8">
                  <h1 className="text-5xl md:text-7xl font-heading font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-600 via-slate-200 to-blue-600 italic tracking-tighter mb-4">
                    FIGHT SCORING
                  </h1>
                  <p className="text-slate-400 max-w-lg mx-auto">
                    AI-Powered Round-by-Round Scoring. Upload fight clips to generate professional judging scorecards and technical stats.
                  </p>
                </header>

                <div className="w-full max-w-3xl bg-slate-800 rounded-2xl border border-slate-700 shadow-2xl overflow-hidden relative">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-600 to-blue-600"></div>
                  
                  <div className="p-8 space-y-8">
                    {/* Section 1: Video */}
                    <div className="space-y-3">
                      <label className="flex items-center gap-2 text-white font-heading text-xl">
                        <span className="w-8 h-8 rounded-full bg-red-600 flex items-center justify-center text-xs">01</span>
                        Fight Footage
                      </label>
                      
                      {uploadedVideo ? (
                        <div className="bg-black rounded-xl overflow-hidden shadow-lg border border-slate-700">
                          <VideoPlayer src={uploadedVideo.url} />
                          <div className="bg-slate-800 p-3 flex justify-between items-center">
                            <span className="text-sm text-white font-mono">{uploadedVideo.filename}</span>
                            <button 
                              onClick={() => setUploadedVideo(null)} 
                              className="text-xs text-red-400 hover:text-red-300"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      ) : (
                        <VideoUploader 
                          onUploadComplete={handleVideoUploadComplete} 
                          onError={handleVideoError}
                          maxSizeMB={MAX_FILE_SIZE_MB}
                        />
                      )}
                    </div>

                    {/* Section 2: Images */}
                    <div className="space-y-3">
                      <label className="flex items-center gap-2 text-white font-heading text-xl">
                        <span className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-xs">02</span>
                        Stat Sheets / Fighter Profiles
                      </label>
                      <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-700">
                         <div className="flex flex-wrap gap-4 mb-3">
                           {imageFiles.map((file, idx) => (
                             <div key={idx} className="relative group">
                               <div className="w-20 h-20 bg-slate-800 rounded border border-slate-600 flex items-center justify-center overflow-hidden">
                                  <span className="text-xs text-slate-500 text-center break-all p-1">{file.name}</span>
                               </div>
                               <button 
                                 onClick={() => removeImage(idx)}
                                 className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  ×
                                </button>
                             </div>
                           ))}
                           <input 
                            ref={imageInputRef}
                            type="file" 
                            accept="image/*" 
                            multiple 
                            className="hidden"
                            id="image-upload"
                            onChange={handleImageUpload}
                           />
                           <label htmlFor="image-upload" className="w-20 h-20 border-2 border-dashed border-slate-600 hover:border-slate-400 rounded flex items-center justify-center cursor-pointer text-slate-500 hover:text-white transition-colors">
                             <span className="text-2xl">+</span>
                           </label>
                         </div>
                         <p className="text-xs text-slate-500">Upload screenshots of official stats or fighter profile cards.</p>
                      </div>
                    </div>

                    {/* Section 3: Notes */}
                    <div className="space-y-3">
                       <label className="flex items-center gap-2 text-white font-heading text-xl">
                        <span className="w-8 h-8 rounded-full bg-slate-600 flex items-center justify-center text-xs">03</span>
                        Context Notes
                      </label>
                      <textarea
                        className="w-full bg-slate-900/50 border border-slate-700 rounded-xl p-4 text-slate-300 focus:outline-none focus:border-blue-500 transition-colors h-24"
                        placeholder="E.g., Fighter A is a southpaw coming off a knee injury. Fighter B is a wrestler."
                        value={textNotes}
                        onChange={(e) => setTextNotes(e.target.value)}
                      />
                    </div>

                    {/* Action */}
                    <div className="pt-4">
                       {error && (
                         <div className="bg-red-900/20 border border-red-500/50 text-red-200 p-3 rounded-lg mb-4 text-sm text-center">
                           {error}
                         </div>
                       )}
                       <button
                         onClick={handleAnalyze}
                         disabled={!uploadedVideo && imageFiles.length === 0 && !textNotes}
                         className="w-full bg-gradient-to-r from-red-600 to-blue-600 hover:from-red-500 hover:to-blue-500 text-white font-heading text-2xl py-4 rounded-xl shadow-lg transform hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                       >
                         SCORE FIGHT
                       </button>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default App;