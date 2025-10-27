// Fix: Replaced invalid file content with a complete implementation of the KnowledgeBaseBrowser component.
import React, { useState } from 'react';
import { ProductSchema } from '../types';
import BackIcon from './icons/BackIcon';

interface KnowledgeBaseBrowserProps {
  products: ProductSchema[];
  onClose: () => void;
}

const KnowledgeBaseBrowser: React.FC<KnowledgeBaseBrowserProps> = ({ products, onClose }) => {
  const [selectedProduct, setSelectedProduct] = useState<ProductSchema | null>(null);

  const renderProductDetails = (product: ProductSchema) => (
    <div>
      <h3 className="text-2xl font-bold text-gray-100 mb-2">{product.product_name}</h3>
      <p className="text-sm text-gray-400 mb-4">
        <span className="font-semibold">Category:</span> {product.category} | <span className="font-semibold">Price:</span> ${product.price_usd?.toFixed(2)}
      </p>
      
      <div className="mb-4">
        <h4 className="text-lg font-semibold text-purple-300 mb-2">Summary</h4>
        <p className="text-gray-300 mb-3">{product.summary.description}</p>
        <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
                <h5 className="font-semibold text-green-400 mb-1">Pros</h5>
                <ul className="list-disc list-inside text-gray-300 text-sm space-y-1">
                    {product.summary.pros.map((pro, i) => <li key={i}>{pro}</li>)}
                </ul>
            </div>
            <div className="flex-1">
                <h5 className="font-semibold text-red-400 mb-1">Cons</h5>
                <ul className="list-disc list-inside text-gray-300 text-sm space-y-1">
                    {product.summary.cons.map((con, i) => <li key={i}>{con}</li>)}
                </ul>
            </div>
        </div>
      </div>

      <div className="mb-4">
        <h4 className="text-lg font-semibold text-purple-300 mb-2">Specifications</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 text-sm bg-gray-900/50 p-3 rounded-md">
            {Object.entries(product.specifications).map(([key, value]) => (
                value && <div key={key}>
                    <span className="font-semibold text-gray-400 capitalize">{key.replace(/_/g, ' ')}: </span>
                    <span className="text-gray-200">{value}</span>
                </div>
            ))}
        </div>
      </div>

      <div>
        <h4 className="text-lg font-semibold text-purple-300 mb-2">Sources</h4>
        <div className="text-sm space-y-2">
            <div>
                <h5 className="font-semibold text-gray-400 mb-1">Reviews</h5>
                {product.source_info.review_urls.map((url, i) => (
                    <a href={url} target="_blank" rel="noopener noreferrer" key={i} className="block text-cyan-400 hover:underline truncate">{url}</a>
                ))}
            </div>
            <div>
                <h5 className="font-semibold text-gray-400 mb-1">Retail</h5>
                {product.source_info.retail_urls.map((url, i) => (
                    <a href={url} target="_blank" rel="noopener noreferrer" key={i} className="block text-cyan-400 hover:underline truncate">{url}</a>
                ))}
            </div>
            <p className="text-xs text-gray-500 pt-2">Research Date: {new Date(product.source_info.research_date).toLocaleDateString()}</p>
        </div>
      </div>
    </div>
  );

  const renderProductList = () => (
    <div>
        {products.length === 0 ? (
            <p className="text-gray-400 text-center py-8">Your knowledge base is empty. Run a research query to add products.</p>
        ) : (
            <ul className="space-y-3">
                {products.map(product => (
                    <li key={product.product_id} onClick={() => setSelectedProduct(product)} className="bg-gray-800 p-4 rounded-lg hover:bg-gray-700 cursor-pointer transition-colors">
                        <h3 className="font-bold text-gray-100">{product.product_name}</h3>
                        <p className="text-sm text-gray-400">{product.category} - ${product.price_usd?.toFixed(2)}</p>
                    </li>
                ))}
            </ul>
        )}
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
        <div 
            className="w-full max-w-4xl h-[90vh] bg-gray-800/80 border border-gray-600 rounded-2xl shadow-2xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
        >
            <header className="p-4 border-b border-gray-700 flex items-center justify-between flex-shrink-0">
                <div className="flex items-center gap-3">
                    <button onClick={selectedProduct ? () => setSelectedProduct(null) : onClose} className="p-2 rounded-full hover:bg-gray-700 transition-colors">
                        <BackIcon className="w-6 h-6 text-gray-300" />
                    </button>
                    <h2 className="text-xl font-bold text-gray-200">
                        {selectedProduct ? 'Product Details' : 'Knowledge Base'}
                    </h2>
                </div>
            </header>
            <main className="p-6 overflow-y-auto flex-grow">
                {selectedProduct ? renderProductDetails(selectedProduct) : renderProductList()}
            </main>
        </div>
    </div>
  );
};

export default KnowledgeBaseBrowser;
