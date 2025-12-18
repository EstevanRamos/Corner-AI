import React from 'react';
import OpponentReportForm, { OpponentReportInput } from '../../components/reports/OpponentReportForm';
import OpponentReportDisplay from '../../components/reports/OpponentReportDisplay';
import useOpponentAnalysis from '../../hooks/useOpponentAnalysis';
import LoadingOverlay from '../../components/LoadingOverlay';

const OpponentScoutPage: React.FC = () => {
  const { analyze, report, isAnalyzing, error, reset } = useOpponentAnalysis();
  
  // We need to keep track of the input video to pass to the display
  // In a real app with proper state management, this would be cleaner.
  const [currentInput, setCurrentInput] = React.useState<OpponentReportInput | null>(null);

  const handleAnalyze = async (data: OpponentReportInput) => {
    setCurrentInput(data);
    await analyze(data);
  };

  const handleReset = () => {
    reset();
    setCurrentInput(null);
  };

  if (isAnalyzing) return <LoadingOverlay />;

  return (
    <div className="w-full max-w-7xl mx-auto p-4 md:p-8">
      <header className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl md:text-5xl font-heading font-bold text-white mb-2">
            OPPONENT <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">SCOUT</span>
          </h1>
          <p className="text-slate-400 text-sm md:text-base max-w-2xl">
            Upload fight footage to generate tactical intelligence. Identify habits, patterns, and holes in their game before the cage door closes.
          </p>
        </div>
        {report && (
          <button 
            onClick={handleReset}
            className="text-sm text-slate-400 hover:text-white underline decoration-slate-600 underline-offset-4"
          >
            Start New Scout
          </button>
        )}
      </header>

      {report && currentInput && currentInput.videos[0] ? (
        <OpponentReportDisplay report={report} video={currentInput.videos[0]} />
      ) : (
        <div className="max-w-4xl mx-auto">
          {error && (
            <div className="mb-6 p-4 bg-red-900/30 border border-red-500 rounded text-red-200">
              <span className="font-bold block mb-1">Error Generating Report</span>
              {error.message}
            </div>
          )}
          <OpponentReportForm onSubmit={handleAnalyze} isLoading={isAnalyzing} />
        </div>
      )}
    </div>
  );
};

export default OpponentScoutPage;
