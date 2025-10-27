import React, { useState, useCallback, useEffect } from 'react';
import { ProductSchema, ResearchBatch, ResearchJob, PipelineStageStatus } from './types';
import { discoverProductCategories, identifyProducts, researchProduct } from './services/geminiService';
import * as GoogleDriveService from './services/googleDriveService';
import DiscoveryStage from './components/DiscoveryStage';
import ResearchJobMonitor from './components/ResearchJobMonitor';
import KnowledgeBaseBrowser from './components/KnowledgeBaseBrowser';
import DatabaseIcon from './components/icons/DatabaseIcon';
import GoogleDriveIcon from './components/icons/GoogleDriveIcon';

interface DriveFile {
  id: string;
  name: string;
}

const App: React.FC = () => {
  const [knowledgeBase, setKnowledgeBase] = useState<ProductSchema[]>([]);
  const [researchBatches, setResearchBatches] = useState<ResearchBatch[]>([]);
  const [nextBatchId, setNextBatchId] = useState(1);
  const [isKbBrowserOpen, setIsKbBrowserOpen] = useState(false);

  // Google Drive State
  const [gapiReady, setGapiReady] = useState(false);
  const [gisReady, setGisReady] = useState(false);
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [driveFile, setDriveFile] = useState<DriveFile | null>(null);

  useEffect(() => {
    // The Google API scripts are now loaded statically in index.html.
    // This effect waits for them to be ready and then initializes the clients.
    const intervalId = setInterval(() => {
        if (window.gapi && window.gapi.client && window.google && window.google.accounts) {
            clearInterval(intervalId);
            
            // Initialize GAPI Client for Sheets and Picker
            GoogleDriveService.initGapiClient(() => setGapiReady(true));

            // Initialize GIS Client for Auth, which handles sign-in status
            GoogleDriveService.initGisClient((tokenResponse) => {
                if (tokenResponse.access_token) {
                    setIsSignedIn(true);
                    // The token needs to be set on the gapi client for authenticated requests
                    window.gapi.client.setToken(tokenResponse); 
                } else {
                    // Handle cases where token is invalid or expired
                    setIsSignedIn(false);
                }
            });
            setGisReady(true);
        }
    }, 100);

    return () => clearInterval(intervalId); // Cleanup on unmount
  }, []);

  const handleSignIn = () => {
      if (gapiReady && gisReady) {
          GoogleDriveService.handleAuthClick();
      }
  };

  const handleSignOut = () => {
      GoogleDriveService.handleSignoutClick();
      setIsSignedIn(false);
      setDriveFile(null);
  };
  
  const handleStartResearch = useCallback((productsToResearch: { name: string; category: string }[]) => {
    // ... (rest of the function is unchanged)
    const newJobs: ResearchJob[] = productsToResearch.map(p => ({
      productName: p.name,
      category: p.category,
      status: PipelineStageStatus.PENDING,
      result: null,
    }));

    const newBatch: ResearchBatch = {
      id: nextBatchId,
      jobs: newJobs,
    };

    setNextBatchId(prev => prev + 1);
    setResearchBatches(prev => [...prev, newBatch]);

    newJobs.forEach(job => {
      setResearchBatches(prevBatches => prevBatches.map(batch =>
        batch.id === newBatch.id
          ? {
              ...batch,
              jobs: batch.jobs.map(j =>
                j.productName === job.productName ? { ...j, status: PipelineStageStatus.IN_PROGRESS } : j
              ),
            }
          : batch
      ));

      researchProduct(job.productName, job.category)
        .then(result => {
          setResearchBatches(prevBatches => prevBatches.map(batch =>
            batch.id === newBatch.id
              ? {
                  ...batch,
                  jobs: batch.jobs.map(j =>
                    j.productName === job.productName
                      ? { ...j, status: PipelineStageStatus.COMPLETE, result }
                      : j
                  ),
                }
              : batch
          ));
        })
        .catch(error => {
          console.error(`Research failed for ${job.productName}:`, error);
          setResearchBatches(prevBatches => prevBatches.map(batch =>
            batch.id === newBatch.id
              ? {
                  ...batch,
                  jobs: batch.jobs.map(j =>
                    j.productName === job.productName
                      ? { ...j, status: PipelineStageStatus.ERROR, error: (error as Error).message }
                      : j
                  ),
                }
              : batch
          ));
        });
    });
  }, [nextBatchId]);

  const handleAddToKnowledgeBase = useCallback((results: ProductSchema[]) => {
    setKnowledgeBase(prev => {
      const existingIds = new Set(prev.map(p => p.product_id));
      const newProducts = results.filter(r => !existingIds.has(r.product_id));
      return [...prev, ...newProducts];
    });
  }, []);

  const handleDismissBatch = useCallback((batchId: number) => {
    setResearchBatches(prev => prev.filter(b => b.id !== batchId));
  }, []);

  const handleChangeFile = () => {
      GoogleDriveService.createOrPickFile((file) => setDriveFile(file));
  }

  const handleSaveToDrive = async (results: ProductSchema[]) => {
      if (!driveFile) {
          GoogleDriveService.createOrPickFile(async (file) => {
              setDriveFile(file);
              await GoogleDriveService.appendToSheet(file.id, results);
          });
      } else {
          await GoogleDriveService.appendToSheet(driveFile.id, results);
      }
  };


  return (
    <div className="bg-gray-900 text-white min-h-screen font-sans">
      <div className="absolute top-0 left-0 w-full h-full bg-grid-gray-700/[0.2] [mask-image:linear-gradient(to_bottom,white_5%,transparent_95%)]"></div>
      <div className="relative container mx-auto p-4 sm:p-6 lg:p-8">
        <header className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
             <div className="w-12 h-12 bg-purple-600/20 border border-purple-500/30 rounded-lg flex items-center justify-center">
               <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-purple-400"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/><path d="m9 12 2 2 4-4"/></svg>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-100">Product Research Pipeline</h1>
              <p className="text-gray-400">Automated data collection and analysis with Gemini.</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
             {isSignedIn ? (
                <div className="flex items-center gap-2 text-sm">
                    <span className="text-gray-300">Connected</span>
                    <button onClick={handleSignOut} className="bg-red-600 hover:bg-red-700 text-white font-bold py-1 px-3 rounded-md text-xs">Disconnect</button>
                </div>
             ) : (
                <button 
                    onClick={handleSignIn}
                    disabled={!gapiReady || !gisReady}
                    className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 border border-gray-600 text-white font-bold py-2 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <GoogleDriveIcon className="w-5 h-5" />
                    <span>Connect Google Drive</span>
                </button>
             )}
            <button 
              onClick={() => setIsKbBrowserOpen(true)}
              className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 border border-gray-600 text-white font-bold py-2 px-4 rounded-lg transition-colors"
            >
              <DatabaseIcon className="w-5 h-5" />
              <span>Knowledge Base ({knowledgeBase.length})</span>
            </button>
          </div>
        </header>

        <main className="space-y-8">
          <DiscoveryStage
            knowledgeBase={knowledgeBase}
            researchBatches={researchBatches}
            onStartResearch={handleStartResearch}
            discoverFunction={discoverProductCategories}
            identifyFunction={identifyProducts}
          />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {researchBatches.map(batch => (
              <ResearchJobMonitor
                key={batch.id}
                batch={batch}
                knowledgeBase={knowledgeBase}
                onAddToKnowledgeBase={handleAddToKnowledgeBase}
                onDismiss={handleDismissBatch}
                // Pass drive props
                isSignedIn={isSignedIn}
                driveFile={driveFile}
                onSaveToDrive={handleSaveToDrive}
                onChangeFile={handleChangeFile}
              />
            ))}
          </div>
        </main>
      </div>
      {isKbBrowserOpen && <KnowledgeBaseBrowser products={knowledgeBase} onClose={() => setIsKbBrowserOpen(false)} />}
    </div>
  );
};

export default App;