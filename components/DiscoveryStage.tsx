import React, { useState, useMemo } from 'react';
import { PipelineStageStatus, ProductSchema, ResearchBatch } from '../types';
import BrainIcon from './icons/BrainIcon';
import CheckSquareIcon from './icons/CheckSquareIcon';
import ListIcon from './icons/ListIcon';
import SearchIcon from './icons/SearchIcon';
import SquareIcon from './icons/SquareIcon';
import PipelineStage from './PipelineStage';
import ResetIcon from './icons/ResetIcon';

interface DiscoveryStageProps {
  knowledgeBase: ProductSchema[];
  researchBatches: ResearchBatch[];
  onStartResearch: (productsToResearch: { name: string; category: string }[]) => void;
  discoverFunction: (query: string) => Promise<string[]>;
  identifyFunction: (category: string) => Promise<string[]>;
}

const DiscoveryStage: React.FC<DiscoveryStageProps> = ({ knowledgeBase, researchBatches, onStartResearch, discoverFunction, identifyFunction }) => {
  const [query, setQuery] = useState('');
  const [discoveryStatus, setDiscoveryStatus] = useState<PipelineStageStatus>(PipelineStageStatus.IDLE);
  const [identificationStatus, setIdentificationStatus] = useState<PipelineStageStatus>(PipelineStageStatus.IDLE);

  const [discoveredCategories, setDiscoveredCategories] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set());
  
  const [identifiedProducts, setIdentifiedProducts] = useState<Record<string, string[]>>({});
  const [selectedProducts, setSelectedProducts] = useState<Record<string, Set<string>>>({});
  
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const allActiveOrCompletedProducts = useMemo(() => {
    const productSet = new Set<string>();
    knowledgeBase.forEach(p => productSet.add(p.product_name));
    researchBatches.forEach(batch => {
      batch.jobs.forEach(job => productSet.add(job.productName));
    });
    return productSet;
  }, [knowledgeBase, researchBatches]);

  const categoryCompletionStatus = useMemo(() => {
    const statuses: Record<string, boolean> = {};
    for (const category in identifiedProducts) {
        const products = identifiedProducts[category];
        if (products && products.length > 0) {
            statuses[category] = products.every(p => allActiveOrCompletedProducts.has(p));
        } else {
            statuses[category] = false;
        }
    }
    return statuses;
  }, [identifiedProducts, allActiveOrCompletedProducts]);


  const resetState = (clearQuery = false) => {
    if (clearQuery) setQuery('');
    setDiscoveryStatus(PipelineStageStatus.IDLE);
    setIdentificationStatus(PipelineStageStatus.IDLE);
    setDiscoveredCategories([]);
    setSelectedCategories(new Set());
    setIdentifiedProducts({});
    setSelectedProducts({});
    setErrorMessage(null);
  }

  const handleDiscover = async () => {
    if (!query.trim()) return;
    resetState();
    setDiscoveryStatus(PipelineStageStatus.IN_PROGRESS);
    try {
      const categories = await discoverFunction(query);
      setDiscoveredCategories(categories);
      setDiscoveryStatus(PipelineStageStatus.COMPLETE);
      if (categories.length === 0) setErrorMessage("No categories found for this query.");
    } catch (error: any) {
      setErrorMessage(error.message || 'Failed to discover categories.');
      setDiscoveryStatus(PipelineStageStatus.ERROR);
    }
  };

  const handleToggleCategory = (category: string) => {
    setSelectedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(category)) newSet.delete(category);
      else newSet.add(category);
      return newSet;
    });
  };

  const handleIdentifyProducts = async () => {
    if (selectedCategories.size === 0) return;
    setIdentificationStatus(PipelineStageStatus.IN_PROGRESS);
    setErrorMessage(null);
    try {
      const productPromises = Array.from(selectedCategories).map(cat => identifyFunction(cat));
      const productResults = await Promise.all(productPromises);
      
      const newIdentifiedProducts: Record<string, string[]> = {};
      const newSelectedProducts: Record<string, Set<string>> = {};
      
      Array.from(selectedCategories).forEach((cat, index) => {
        newIdentifiedProducts[cat] = productResults[index];
        newSelectedProducts[cat] = new Set(productResults[index].filter(p => !allActiveOrCompletedProducts.has(p)));
      });
      
      setIdentifiedProducts(newIdentifiedProducts);
      setSelectedProducts(newSelectedProducts);
      setIdentificationStatus(PipelineStageStatus.COMPLETE);
    } catch (error: any) {
      setErrorMessage(error.message || 'Failed to identify products.');
      setIdentificationStatus(PipelineStageStatus.ERROR);
    }
  };
  
  const handleToggleProduct = (category: string, productName: string) => {
    // Fix: Explicitly type `prev` in the state updater function. This helps TypeScript
    // correctly infer its type and prevents cascading `unknown` type errors.
    setSelectedProducts((prev: Record<string, Set<string>>) => {
        const newRecord = { ...prev };
        const newSet = new Set(newRecord[category] || []); // Create a new set, handling undefined safely.
        if (newSet.has(productName)) {
            newSet.delete(productName);
        } else {
            newSet.add(productName);
        }
        newRecord[category] = newSet;
        return newRecord;
    });
  }
  
  // Fix: Explicitly type the parameters of the reducer's callback function.
  // This resolves an issue where `totalSelectedCount` was being incorrectly typed as `unknown`.
  const totalSelectedCount = Object.values(selectedProducts).reduce(
    (sum: number, set: Set<string>) => sum + set.size,
    0
  );

  const handleLaunch = () => {
    const productsToResearch = Object.entries(selectedProducts).flatMap(([category, productSet]) => 
        Array.from(productSet).map(name => ({ name, category }))
    );
    if (productsToResearch.length === 0) return;
    
    onStartResearch(productsToResearch);
    setSelectedCategories(new Set());
    setSelectedProducts({});
  };
  
  return (
    <div className="flex flex-col lg:flex-row gap-6">
      <PipelineStage title="1. Discover & Select" icon={<SearchIcon className="w-6 h-6 text-gray-300" />} status={discoveryStatus}>
        <div className="flex flex-col h-full">
          <div className="flex gap-2">
            <input type="text" value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleDiscover()} placeholder="e.g., Gym supplements" className="flex-grow bg-gray-900 border border-gray-600 rounded-md px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"/>
            <button onClick={() => resetState(true)} className="p-2 bg-gray-700 hover:bg-gray-600 rounded-md"><ResetIcon className="w-5 h-5 text-gray-300"/></button>
            <button onClick={handleDiscover} disabled={discoveryStatus === PipelineStageStatus.IN_PROGRESS} className="bg-purple-600 hover:bg-purple-700 disabled:bg-purple-800 text-white font-bold py-2 px-4 rounded-md">Discover</button>
          </div>
          {discoveredCategories.length > 0 &&
            <div className="flex-grow overflow-y-auto mt-4 pr-2 space-y-2">
                {discoveredCategories.map(cat => {
                    const isCategoryCompleted = categoryCompletionStatus[cat] ?? false;
                    return (
                        <div 
                            key={cat} 
                            onClick={() => !isCategoryCompleted && handleToggleCategory(cat)} 
                            className={`flex items-center gap-3 p-2 rounded-md ${isCategoryCompleted ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer bg-gray-900/50 hover:bg-gray-700/50'}`}
                        >
                            {isCategoryCompleted ? (
                                <CheckSquareIcon className="w-5 h-5 text-gray-500" />
                            ) : (
                                selectedCategories.has(cat) ? <CheckSquareIcon className="w-5 h-5 text-green-400" /> : <SquareIcon className="w-5 h-5 text-gray-500" />
                            )}
                            <span className={`text-gray-300 ${isCategoryCompleted ? 'line-through' : ''}`}>
                                {cat}
                            </span>
                        </div>
                    )
                })}
            </div>
          }
          <button onClick={handleIdentifyProducts} disabled={selectedCategories.size === 0 || identificationStatus === PipelineStageStatus.IN_PROGRESS} className="mt-4 w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white font-bold py-2 px-4 rounded-md">
            Identify Products for Selection ({selectedCategories.size})
          </button>
        </div>
      </PipelineStage>
      
      <PipelineStage title="2. Identify & Select" icon={<ListIcon className="w-6 h-6 text-gray-300" />} status={identificationStatus}>
        <div className="flex flex-col h-full">
        {Object.keys(identifiedProducts).length > 0 ? (
          <div className="space-y-3 overflow-y-auto flex-grow pr-2">
            {Object.entries(identifiedProducts).map(([category, products]: [string, string[]]) => (
              <div key={category}>
                <h4 className="font-bold text-purple-300 mb-1">{category}</h4>
                <ul className="space-y-1">
                  {products.map(productName => {
                    const isCompleted = allActiveOrCompletedProducts.has(productName);
                    return (
                        <li key={productName} onClick={() => !isCompleted && handleToggleProduct(category, productName)} className={`flex items-center gap-3 p-2 rounded-md ${isCompleted ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer bg-gray-900/50 hover:bg-gray-700/50'}`}>
                            {isCompleted || selectedProducts[category]?.has(productName) ? <CheckSquareIcon className={`w-5 h-5 ${isCompleted ? 'text-gray-500' : 'text-green-400'}`} /> : <SquareIcon className="w-5 h-5 text-gray-500" />}
                            <span className={`text-gray-300 ${isCompleted ? 'line-through' : ''}`}>{productName}</span>
                        </li>
                    )
                  })}
                </ul>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-8">Select categories and click "Identify" to see products.</p>
        )}
        </div>
      </PipelineStage>

      <PipelineStage title="3. Launch Pipeline" icon={<BrainIcon className="w-6 h-6 text-gray-300" />} status={totalSelectedCount > 0 ? PipelineStageStatus.PENDING : PipelineStageStatus.IDLE}>
        <div className="flex flex-col items-center justify-center h-full text-center">
            {totalSelectedCount > 0 ? (
                <>
                    <p className="text-gray-300 mb-4">Ready to research <span className="font-bold text-lg text-cyan-400">{totalSelectedCount}</span> product(s).</p>
                    <button onClick={handleLaunch} className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-md text-lg">Start Research</button>
                </>
            ) : (<p className="text-gray-500">Select products to launch.</p>)}
        </div>
      </PipelineStage>
    </div>
  );
};

export default DiscoveryStage;