import React, { useState } from 'react';
import { useSelfScout } from '../../hooks/useSelfScout';
import { useVideoUpload, UploadedVideo } from '../../hooks/useVideoUpload';
import VideoUploader from '../../components/video/VideoUploader';
import SelfScoutReportDisplay from '../../components/reports/SelfScoutReportDisplay';
import LoadingOverlay from '../../components/LoadingOverlay';

type AnalysisType = 'full' | 'quick';

export default function SelfScoutPage() {
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [uploadedVideo, setUploadedVideo] = useState<UploadedVideo | null>(null);
  const [analysisType, setAnalysisType] = useState<AnalysisType>('full');
  const [context, setContext] = useState('');
  const [specificQuestions, setSpecificQuestions] = useState('');

  const { analyze, report, isAnalyzing, progress, error, reset } = useSelfScout();

  const handleVideoUpload = (video: UploadedVideo, file: File) => {
    setUploadedVideo(video);
    setUploadedFiles([file]);
  };

  const handleAnalyze = async () => {
    if (uploadedFiles.length === 0) {
      alert('Please upload a video first');
      return;
    }

    try {
      await analyze({
        videos: uploadedFiles,
        analysisType: analysisType as any, // Cast to match hook type which still might have progress
        context,
        specificQuestions,
      });
    } catch (err) {
      console.error('Analysis failed:', err);
    }
  };

  const handleReset = () => {
    reset();
    setUploadedFiles([]);
    setUploadedVideo(null);
    setContext('');
    setSpecificQuestions('');
  };

  if (isAnalyzing) {
    return (
      <LoadingOverlay 
        message={progress.message || "ANALYZING FOOTAGE"} 
        subMessage={`Progress: ${progress.percent}%`} 
      />
    );
  }

  // Show report if we have one
  if (report && uploadedVideo) {
    return (
      <div className="min-h-screen bg-slate-900 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold text-white">Self-Scout Report</h1>
              <p className="text-slate-400 text-sm mt-1">
                {analysisType} analysis • Generated {new Date(report.generatedAt).toLocaleString()}
              </p>
            </div>
            <button
              onClick={handleReset}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm transition-colors"
            >
              New Analysis
            </button>
          </div>

          <SelfScoutReportDisplay report={report} video={uploadedVideo} />
        </div>
      </div>
    );
  }

  // Show upload/analysis form
  return (
    <div className="min-h-screen bg-slate-900 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl md:text-5xl font-heading font-bold text-white mb-2">
            SELF <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">SCOUT</span>
          </h1>
          <p className="text-slate-400 text-sm md:text-base max-w-2xl">
            Upload your sparring or fight footage for a brutal, honest analysis of your game.
          </p>
        </header>

        {/* Video Upload */}
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-6 mb-6">
          <h2 className="text-lg font-semibold text-white mb-4">Upload Your Footage</h2>
          <VideoUploader
            onUploadComplete={(video, file) => handleVideoUpload(video, file)}
            onError={(err) => console.error('Upload error:', err)}
            label="Drop your sparring or fight video here"
          />
          
          {uploadedVideo && (
            <div className="mt-4 flex items-center gap-3 text-sm text-emerald-400">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>{uploadedVideo.filename} uploaded successfully</span>
            </div>
          )}
        </div>

        {/* Analysis Type */}
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-6 mb-6">
          <h2 className="text-lg font-semibold text-white mb-4">Analysis Type</h2>
          <div className="flex gap-3">
            {[
              { id: 'full', label: 'Full Analysis', desc: 'Comprehensive breakdown of all aspects' },
              { id: 'quick', label: 'Quick Review', desc: 'Key habits and one fix for today' },
            ].map((type) => (
              <button
                key={type.id}
                onClick={() => setAnalysisType(type.id as AnalysisType)}
                className={`flex-1 p-4 rounded-lg border transition-all text-left ${
                  analysisType === type.id
                    ? 'bg-emerald-600/20 border-emerald-500 text-white'
                    : 'bg-slate-900/50 border-slate-700 text-slate-400 hover:border-slate-600'
                }`}
              >
                <div className="font-medium">{type.label}</div>
                <div className="text-xs mt-1 opacity-70">{type.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Context */}
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-6 mb-6">
          <h2 className="text-lg font-semibold text-white mb-4">Context (Optional)</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-slate-400 mb-2">Session Notes</label>
              <textarea
                value={context}
                onChange={(e) => setContext(e.target.value)}
                placeholder="e.g., 'This is from my last sparring session. I was working on my jab...'"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                rows={3}
              />
            </div>
            
            <div>
              <label className="block text-sm text-slate-400 mb-2">Specific Concerns</label>
              <textarea
                value={specificQuestions}
                onChange={(e) => setSpecificQuestions(e.target.value)}
                placeholder="e.g., 'Am I dropping my hands? Is my head movement improving?'"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                rows={2}
              />
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-6">
            <p className="text-red-400">{error.message}</p>
          </div>
        )}

        {/* Analyze Button */}
        <button
          onClick={handleAnalyze}
          disabled={isAnalyzing || uploadedFiles.length === 0}
          className={`w-full py-4 rounded-xl font-semibold text-lg transition-all ${
            isAnalyzing || uploadedFiles.length === 0
              ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
              : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/20'
          }`}
        >
          {isAnalyzing ? 'Analyzing...' : 'Analyze My Footage'}
        </button>
      </div>
    </div>
  );
}