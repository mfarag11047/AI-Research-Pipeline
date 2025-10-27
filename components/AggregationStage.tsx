import React, { useState, useMemo } from 'react';
import { ProductSchema } from '../types';
import DatabaseIcon from './icons/DatabaseIcon';
import ResetIcon from './icons/ResetIcon';
import ClipboardIcon from './icons/ClipboardIcon';
import GoogleDriveIcon from './icons/GoogleDriveIcon';

interface DriveFile {
  id: string;
  name: string;
}

interface AggregationStageProps {
  results: ProductSchema[];
  knowledgeBase: ProductSchema[];
  onAddToKnowledgeBase: (results: ProductSchema[]) => void;
  onReset: () => void;
  // Drive props
  isSignedIn: boolean;
  driveFile: DriveFile | null;
  onSaveToDrive: (results: ProductSchema[]) => Promise<void>;
  onChangeFile: () => void;
}

const AggregationStage: React.FC<AggregationStageProps> = ({ 
    results, 
    knowledgeBase, 
    onAddToKnowledgeBase, 
    onReset,
    isSignedIn,
    driveFile,
    onSaveToDrive,
    onChangeFile
}) => {
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());
  const [copySuccess, setCopySuccess] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  const { newResults, duplicateResults } = useMemo(() => {
    const kbIds = new Set(knowledgeBase.map(p => p.product_id));
    const initialSelected = new Set<string>();
    const categorized = results.reduce((acc: { newResults: ProductSchema[], duplicateResults: ProductSchema[] }, result) => {
      if (kbIds.has(result.product_id)) {
        acc.duplicateResults.push(result);
      } else {
        acc.newResults.push(result);
        initialSelected.add(result.product_id);
      }
      return acc;
    }, { newResults: [], duplicateResults: [] });
    
    setSelectedProducts(initialSelected);
    return categorized;
  }, [results, knowledgeBase]);

  const handleToggleProduct = (productId: string) => {
    setSelectedProducts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(productId)) newSet.delete(productId);
      else newSet.add(productId);
      return newSet;
    });
  };

  const handleFinalize = () => {
    const productsToAdd = newResults.filter(r => selectedProducts.has(r.product_id));
    onAddToKnowledgeBase(productsToAdd);
  };
  
  const handleCopyJson = () => {
    const productsToCopy = newResults.filter(r => selectedProducts.has(r.product_id));
    navigator.clipboard.writeText(JSON.stringify(productsToCopy, null, 2)).then(() => {
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
    });
  };
  
  const handleSave = async () => {
    const productsToSave = newResults.filter(r => selectedProducts.has(r.product_id));
    if (productsToSave.length === 0) return;
    setSaveStatus('saving');
    try {
        await onSaveToDrive(productsToSave);
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (error) {
        console.error("Save to drive failed:", error);
        setSaveStatus('error');
        setTimeout(() => setSaveStatus('idle'), 3000);
    }
  };


  const isSelected = (productId: string) => selectedProducts.has(productId);

  return (
    <div className="flex-1 min-w-[300px] bg-gray-800/50 backdrop-blur-sm rounded-xl border border-blue-500 shadow-lg">
      <div className="p-4 border-b border-gray-700 flex items-center justify-between">
        <h2 className="text-lg font-bold text-gray-200">Aggregation & Review</h2>
      </div>
      <div className="p-4">
        <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 mb-4">
          {newResults.length > 0 ? (
            <div>
              <h3 className="text-sm font-semibold text-green-400 mb-2">New Products ({newResults.length})</h3>
              {newResults.map(res => (
                <div key={res.product_id} onClick={() => handleToggleProduct(res.product_id)} className="flex items-center gap-3 p-2 rounded-md cursor-pointer bg-gray-900/50 hover:bg-gray-700/50">
                  <input type="checkbox" checked={isSelected(res.product_id)} readOnly className="form-checkbox h-4 w-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500" />
                  <span className="text-gray-300">{res.product_name}</span>
                </div>
              ))}
            </div>
          ) : (
             <p className="text-gray-400 text-center py-4">No new products found in this research batch.</p>
          )}
          {duplicateResults.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-yellow-400 mb-2">Duplicates Found ({duplicateResults.length})</h3>
              {duplicateResults.map(res => (
                <div key={res.product_id} className="flex items-center gap-3 p-2 rounded-md opacity-60">
                  <input type="checkbox" checked={false} disabled className="form-checkbox h-4 w-4 text-blue-800 bg-gray-800 border-gray-700 rounded" />
                  <span className="text-gray-500 line-through">{res.product_name}</span>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="space-y-2">
            <button
                onClick={handleFinalize}
                disabled={selectedProducts.size === 0}
                className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white font-bold py-2 px-4 rounded-md"
            >
                <DatabaseIcon className="w-5 h-5"/>
                Add {selectedProducts.size} To Knowledge Base
            </button>
            {isSignedIn && (
                <div className="bg-gray-900/50 p-2 rounded-md">
                     <button
                        onClick={handleSave}
                        disabled={selectedProducts.size === 0 || saveStatus === 'saving'}
                        className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 disabled:bg-green-800 text-white font-bold py-2 px-4 rounded-md"
                    >
                        <GoogleDriveIcon className="w-5 h-5"/>
                        {saveStatus === 'saving' ? 'Saving...' : saveStatus === 'saved' ? 'Saved!' : `Save ${selectedProducts.size} to Drive`}
                    </button>
                    {driveFile && <div className="text-xs text-center text-gray-400 mt-2">Saving to: <span className="font-semibold">{driveFile.name}</span> (<button onClick={onChangeFile} className="underline hover:text-white">change</button>)</div>}
                </div>
            )}
            <div className="flex gap-2">
                <button onClick={onReset} className="w-full flex items-center justify-center gap-2 bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-md">
                    <ResetIcon className="w-5 h-5" />
                    Dismiss
                </button>
                <button onClick={handleCopyJson} className="w-full flex items-center justify-center gap-2 bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-md">
                    <ClipboardIcon className="w-5 h-5" />
                    {copySuccess ? 'Copied!' : 'Copy JSON'}
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default AggregationStage;