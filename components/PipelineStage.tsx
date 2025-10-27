
import React from 'react';
import { PipelineStageStatus } from '../types';
import SpinnerIcon from './icons/SpinnerIcon';

interface PipelineStageProps {
  title: string;
  icon: React.ReactNode;
  status: PipelineStageStatus;
  children: React.ReactNode;
}

const statusStyles: { [key in PipelineStageStatus]: { badge: string; border: string } } = {
  [PipelineStageStatus.IDLE]: { badge: 'bg-gray-600', border: 'border-gray-600' },
  [PipelineStageStatus.PENDING]: { badge: 'bg-yellow-500', border: 'border-yellow-500' },
  [PipelineStageStatus.IN_PROGRESS]: { badge: 'bg-blue-500 animate-pulse', border: 'border-blue-500' },
  [PipelineStageStatus.COMPLETE]: { badge: 'bg-green-500', border: 'border-green-500' },
  [PipelineStageStatus.ERROR]: { badge: 'bg-red-500', border: 'border-red-500' },
};

const PipelineStage: React.FC<PipelineStageProps> = ({ title, icon, status, children }) => {
  const styles = statusStyles[status];

  return (
    <div className={`flex-1 min-w-[300px] bg-gray-800/50 backdrop-blur-sm rounded-xl border ${styles.border} shadow-lg transition-all duration-300`}>
      <div className="p-4 border-b border-gray-700 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {icon}
          <h2 className="text-lg font-bold text-gray-200">{title}</h2>
        </div>
        <div className="flex items-center gap-2">
          {status === PipelineStageStatus.IN_PROGRESS && <SpinnerIcon className="w-4 h-4 text-gray-300" />}
          <span className={`px-2 py-1 text-xs font-semibold rounded-full text-white ${styles.badge}`}>
            {status.replace('-', ' ')}
          </span>
        </div>
      </div>
      <div className="p-4 h-[calc(100%-65px)] overflow-y-auto">
        {children}
      </div>
    </div>
  );
};

export default PipelineStage;
