import React from 'react';
import { Info } from 'lucide-react';

interface InstructionBannerProps {
  viewMode: 'distribution' | 'rating' | 'checkout';
}

export const InstructionBanner: React.FC<InstructionBannerProps> = ({ viewMode }) => {
  if (viewMode === 'distribution') {
    return (
      <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 mb-6 flex flex-col md:flex-row justify-between items-start md:items-center relative overflow-hidden shadow-sm">
        <div className="z-10 relative w-full">
           <ol className="space-y-2 text-blue-900/80 text-sm">
             <li className="flex gap-2">
               <span className="font-bold text-blue-700">1.</span>
               <span><span className="font-bold text-blue-800">View the distribution charts below</span> - Each chart shows candidates grouped by different criteria (salary, age, availability, etc.)</span>
             </li>
             <li className="flex gap-2">
               <span className="font-bold text-blue-700">2.</span>
               <span><span className="font-bold text-blue-800">Click on colored dots</span> in any chart to select candidates. Selected dots will turn <span className="inline-block w-3 h-3 bg-yellow-400 rounded-full mx-1 align-middle border border-yellow-500/20"></span> yellow.</span>
             </li>
             <li className="flex gap-2">
               <span className="font-bold text-blue-700">3.</span>
               <span><span className="font-bold text-blue-800">Scroll down and click</span> the "Proceed to indicate fit" button to proceed to the rating page.</span>
             </li>
           </ol>
        </div>
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-48 h-48 bg-blue-100 rounded-full opacity-50 blur-3xl pointer-events-none"></div>
      </div>
    );
  }

  if (viewMode === 'rating') {
    return (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 flex items-start gap-3">
            <div className="bg-blue-600 text-white rounded-full p-1.5 mt-0.5 shrink-0">
                <span className="font-bold text-base px-1.5">!</span>
            </div>
            <div>
                <ol className="space-y-1.5 text-blue-900/80 text-sm">
                    <li className="flex gap-2">
                        <span className="font-bold text-blue-700">1.</span>
                        <span><span className="font-bold">Review Profiles:</span> Analyze detailed candidate information, matching scores, and elimination criteria below.</span>
                    </li>
                  {/* <li className="flex gap-2">
                        <span className="font-bold text-blue-700">2.</span>
                        <span><span className="font-bold">Discover More:</span> Use the "Discover Similar Candidates" section to find others with similar skills or domain knowledge.</span>
                    </li> */}
                    <li className="flex gap-2">
                        <span className="font-bold text-blue-700">2.</span>
                        <span><span className="font-bold">Rate All Candidates:</span> Use the rating dropdown to classify each candidate as <span className="font-bold text-green-700">Top 10</span>, <span className="font-bold text-cyan-700">Top 20</span>, <span className="font-bold text-orange-700">Top 50</span>, or <span className="font-bold text-slate-700">Top 100</span> based on your evaluation.</span>
                    </li>
                    <li className="flex gap-2">
                        <span className="font-bold text-blue-700">3.</span>
                        <span><span className="font-bold">Proceed:</span> Once all candidates are rated, click "Proceed to purchase candidates" at the bottom to move to the purchase phase.</span>
                    </li>
                </ol>
            </div>
        </div>
    );
  }

  if (viewMode === 'checkout') {
      return (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 flex items-start gap-3">
            <div className="bg-blue-600 text-white rounded-full p-1.5 mt-0.5 shrink-0">
                <span className="font-bold text-base px-1.5">!</span>
            </div>
            <div>
                <ol className="space-y-1.5 text-blue-900/80 text-sm">
                    <li className="flex gap-2">
                        <span className="font-bold text-blue-700">1.</span>
                        <span><span className="font-bold">Review Rated Candidates:</span> All rated candidates are grouped by their ratings (<span className="font-bold text-green-700">Top 10</span>, <span className="font-bold text-cyan-700">Top 20</span>, <span className="font-bold text-orange-700">Top 50</span>, <span className="font-bold text-slate-700">Top 100</span>, or <span className="font-bold">Unrated</span>).</span>
                    </li>
                    <li className="flex gap-2">
                        <span className="font-bold text-blue-700">2.</span>
                        <span><span className="font-bold">Filter by Rating:</span> Use the filter dropdown in the header to view specific rating groups.</span>
                    </li>
                    <li className="flex gap-2">
                        <span className="font-bold text-blue-700">3.</span>
                        <span><span className="font-bold">Select Candidates:</span> Click the <span className="font-bold">Select</span> button on candidates you want to purchase.</span>
                    </li>
                    <li className="flex gap-2">
                        <span className="font-bold text-blue-700">4.</span>
                        <span><span className="font-bold">Complete Purchase:</span> Click "Proceed to Checkout" at the bottom to purchase selected candidate CVs.</span>
                    </li>
                </ol>
            </div>
        </div>
      );
  }

  return null;
};