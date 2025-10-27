// Fix: Replaced placeholder content with a complete implementation of the ResearchJobMonitor component.
import React, { useState } from 'react';
import { ResearchJob, PipelineStageStatus, ProductSchema, ResearchBatch } from '../types';
import CombineIcon from './icons/CombineIcon';
import PipelineStage from './PipelineStage';
import SpinnerIcon from './icons/SpinnerIcon';
import AggregationStage from './AggregationStage';

interface DriveFile {
  id: string;
  name: string;
}

interface ResearchJobMonitorProps {
  batch: ResearchBatch;
  knowledgeBase: ProductSchema[];
  onAddToKnowledgeBase: (results: ProductSchema[]) => void;
  onDismiss: (batchId: number) => void;
  // Drive props
  isSignedIn: boolean;
  driveFile: DriveFile | null;
  onSaveToDrive: (results: ProductSchema[]) => Promise<void>;
  onChangeFile: () => void;
}

const getOverallStatus = (jobs: ResearchJob[]): PipelineStageStatus => {
  if (jobs.length === 0) return PipelineStageStatus.IDLE;
  if (jobs.some(j => j.status === PipelineStageStatus.IN_PROGRESS)) return PipelineStageStatus.IN_PROGRESS;
  if (jobs.every(j => j.status === PipelineStageStatus.COMPLETE || j.status === PipelineStageStatus.ERROR)) {
    return jobs.some(j => j.status === PipelineStageStatus.ERROR) ? PipelineStageStatus.ERROR : PipelineStageStatus.COMPLETE;
  }
  return PipelineStageStatus.PENDING;
};

const ResearchJobMonitor: React.FC<ResearchJobMonitorProps> = ({ 
    batch, 
    knowledgeBase, 
    onAddToKnowledgeBase, 
    onDismiss,
    isSignedIn,
    driveFile,
    onSaveToDrive,
    onChangeFile
}) => {
  const [view, setView] = useState<'monitoring' | 'aggregation'>('monitoring');
  
  const { id, jobs } = batch;
  const overallStatus = getOverallStatus(jobs);
  const completedJobs = jobs.filter(j => j.status === PipelineStageStatus.COMPLETE && j.result);
  const erroredJobs = jobs.filter(j => j.status === PipelineStageStatus.ERROR);
  const successfulResults = completedJobs.map(j => j.result!).filter((r): r is ProductSchema => r !== null);

  const handleProceedToAggregation = () => {
    setView('aggregation');
  };

  const handleFinish = (results: ProductSchema[]) => {
    onAddToKnowledgeBase(results);
    onDismiss(id);
  }

  if (view === 'aggregation') {
    return (
        <AggregationStage 
            results={successfulResults}
            knowledgeBase={knowledgeBase}
            onAddToKnowledgeBase={handleFinish}
            onReset={() => onDismiss(id)}
            // Drive Props
            isSignedIn={isSignedIn}
            driveFile={driveFile}
            onSaveToDrive={onSaveToDrive}
            onChangeFile={onChangeFile}
        />
    );
  }
  
  return (
    <div className="relative">
    <PipelineStage title={`Pipeline #${id}`} icon={<CombineIcon />} status={overallStatus}>
      <div className="flex flex-col h-full min-h-[200px]">
        <ul className="space-y-2 overflow-y-auto flex-grow mb-4 pr-2">
          {jobs.map((job) => (
            <li key={job.productName} className="flex items-center justify-between p-2 bg-gray-900/50 rounded-md">
              <span className="text-gray-300">{job.productName} <span className="text-gray-500 text-xs">({job.category})</span></span>
              <div className="flex items-center gap-2">
                {job.status === PipelineStageStatus.IN_PROGRESS && <SpinnerIcon className="w-4 h-4 text-blue-400" />}
                {job.status === PipelineStageStatus.COMPLETE && <span className="text-green-400">✓</span>}
                {job.status === PipelineStageStatus.ERROR && <span className="text-red-400">✗</span>}
                <span className="text-xs text-gray-400 capitalize">{job.status}</span>
              </div>
            </li>
          ))}
        </ul>
        {erroredJobs.length > 0 && (
            <div className="text-red-400 text-xs mb-2 flex-shrink-0">
                <p className="font-semibold">{erroredJobs.length} job(s) failed. Check console for details.</p>
            </div>
        )}
        <div className="flex gap-2 mt-auto flex-shrink-0">
            <button
                onClick={() => onDismiss(id)}
                className="w-full bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-md transition-colors"
            >
                Dismiss
            </button>
            <button
                onClick={handleProceedToAggregation}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:cursor-not-allowed text-white font-bold py-2 px-4 rounded-md transition-colors"
                disabled={completedJobs.length === 0}
            >
                Aggregate {completedJobs.length} Result(s)
            </button>
        </div>
      </div>
    </PipelineStage>
    <button onClick={() => onDismiss(id)} className="absolute top-3 right-3 text-gray-500 hover:text-white transition-colors">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
    </button>
    </div>
  );
};

export default ResearchJobMonitor;