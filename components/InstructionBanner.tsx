import React from 'react';
import { Info } from 'lucide-react';

interface InstructionBannerProps {
  viewMode: 'distribution' | 'details' | 'shortlist';
}

export const InstructionBanner: React.FC<InstructionBannerProps> = ({ viewMode }) => {
  if (viewMode === 'distribution') {
    return (
      <div className="bg-blue-50 border border-blue-100 rounded-xl p-6 mb-8 flex flex-col md:flex-row justify-between items-start md:items-center relative overflow-hidden shadow-sm">
        <div className="z-10 relative w-full">
           <h2 className="text-xl font-bold text-blue-900 flex items-center gap-3 mb-4">
             <div className="bg-blue-600 text-white p-1.5 rounded-full"><Info size={20}/></div>
             How to Use This Page
           </h2>
           <ol className="space-y-3 text-blue-900/80 text-sm">
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
               <span><span className="font-bold text-blue-800">Scroll down and click</span> the "View Selected Candidates" button to see detailed information and shortlist them.</span>
             </li>
           </ol>
        </div>
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-48 h-48 bg-blue-100 rounded-full opacity-50 blur-3xl pointer-events-none"></div>
      </div>
    );
  }

  if (viewMode === 'details') {
    return (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-8 flex items-start gap-4">
            <div className="bg-blue-600 text-white rounded-full p-2 mt-1 shrink-0">
                <span className="font-bold text-xl px-2">!</span>
            </div>
            <div>
                <h3 className="text-xl font-bold text-blue-900 mb-3">Candidate Evaluation & Selection</h3>
                <ol className="space-y-2 text-blue-900/80 text-base">
                    <li className="flex gap-2">
                        <span className="font-bold text-blue-700">1.</span>
                        <span><span className="font-bold">Review Profiles:</span> Analyze detailed candidate information, matching scores, and elimination criteria below.</span>
                    </li>
                    <li className="flex gap-2">
                        <span className="font-bold text-blue-700">2.</span>
                        <span><span className="font-bold">Discover More:</span> Use the "Discover Similar Candidates" section to find others with similar skills or domain knowledge.</span>
                    </li>
                    <li className="flex gap-2">
                        <span className="font-bold text-blue-700">3.</span>
                        <span><span className="font-bold">Rate Candidates:</span> Use the rating dropdown to classify each candidate as <span className="font-bold text-green-700">Top Fit</span>, <span className="font-bold text-orange-700">Maybe</span>, or <span className="font-bold text-red-700">Not a Fit</span> based on your evaluation.</span>
                    </li>
                    <li className="flex gap-2">
                        <span className="font-bold text-blue-700">4.</span>
                        <span><span className="font-bold">Shortlist:</span> Click the <span className="font-bold">Shortlist button</span> (Bookmark icon) to add promising candidates to your final shortlist.</span>
                    </li>
                    <li className="flex gap-2">
                        <span className="font-bold text-blue-700">5.</span>
                        <span><span className="font-bold">Proceed:</span> When ready, click "Proceed to Shortlist Page" at the bottom to review all shortlisted candidates and make your final selection.</span>
                    </li>
                </ol>
            </div>
        </div>
    );
  }

  if (viewMode === 'shortlist') {
      return (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-8 flex items-start gap-4">
            <div className="bg-blue-600 text-white rounded-full p-2 mt-1 shrink-0">
                <span className="font-bold text-xl px-2">!</span>
            </div>
            <div>
                <h3 className="text-xl font-bold text-blue-900 mb-3">Final Selection Process</h3>
                <ol className="space-y-2 text-blue-900/80 text-base">
                    <li className="flex gap-2">
                        <span className="font-bold text-blue-700">1.</span>
                        <span><span className="font-bold">Review & Filter:</span> Review all shortlisted candidates below. Use the filter dropdown in the header to view candidates by rating (<span className="font-bold text-green-700">Top Fit</span>, <span className="font-bold text-orange-700">Maybe</span>, <span className="font-bold text-red-700">Not a Fit</span>, or <span className="font-bold">Unrated</span>).</span>
                    </li>
                    <li className="flex gap-2">
                        <span className="font-bold text-blue-700">2.</span>
                        <span><span className="font-bold">Update Ratings:</span> You can still adjust candidate ratings using the dropdown on each card if needed.</span>
                    </li>
                    <li className="flex gap-2">
                        <span className="font-bold text-blue-700">3.</span>
                        <span><span className="font-bold">Select for Checkout:</span> Click the <span className="font-bold">Select</span> button on candidates you want to proceed with for final checkout.</span>
                    </li>
                    <li className="flex gap-2">
                        <span className="font-bold text-blue-700">4.</span>
                        <span><span className="font-bold">Complete:</span> Click "Proceed to Checkout" at the bottom to finalize your selection and complete the process.</span>
                    </li>
                </ol>
            </div>
        </div>
      );
  }

  return null;
};