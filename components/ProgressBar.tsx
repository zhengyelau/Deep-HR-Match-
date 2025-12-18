import React from 'react';
import { Check, Eye, Star, Bookmark, ShoppingCart, FileCheck } from 'lucide-react';

interface ProgressBarProps {
  currentView: 'distribution' | 'rating' | 'checkout' | 'purchased' | 'shortlisted';
  onStepClick?: (stepId: 'distribution' | 'rating' | 'checkout' | 'purchased' | 'shortlisted') => void;
  variant?: 'full' | 'limited';
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ currentView, onStepClick, variant = 'full' }) => {
  const allSteps = [
    { id: 'distribution', label: 'Distribution', description: 'View distribution of candidates', icon: Eye },
    { id: 'rating', label: 'Rate', description: 'Rate candidates by fit', icon: Star },
    { id: 'checkout', label: 'Purchase', description: 'Purchase candidate CVs', icon: ShoppingCart },
    { id: 'purchased', label: 'Review', description: 'Review purchased CVs', icon: FileCheck },
    { id: 'shortlisted', label: 'Shortlisted', description: 'View shortlisted candidates', icon: Bookmark },
  ];

  const limitedSteps = [
    { id: 'rating', label: 'Rate', description: 'Rate candidates by fit', icon: Star },
    { id: 'checkout', label: 'Purchase', description: 'Purchase candidate CVs', icon: ShoppingCart },
    { id: 'purchased', label: 'Review', description: 'Review purchased CVs', icon: FileCheck },
    { id: 'shortlisted', label: 'Shortlisted', description: 'View shortlisted candidates', icon: Bookmark },
  ];

  const steps = variant === 'limited' ? limitedSteps : allSteps;

  const currentIndex = steps.findIndex(step => step.id === currentView);
  const progressPercentage = Math.min(100, Math.max(0, (currentIndex / (steps.length - 1)) * 100));

  return (
    <div className="bg-gradient-to-b from-slate-50 to-white border-b border-slate-200">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
        <div className="relative">
          {/* Progress Line Container */}
          {/* 
              Vertical Alignment:
              Mobile Circle = 44px (h-11). Center Y = 22px. Line H = 3px. Top = 22 - 1.5 = 20.5px.
              Desktop Circle = 46px. Center Y = 23px. Line H = 3px. Top = 23 - 1.5 = 21.5px.
              
              Horizontal Alignment:
              Mobile Item Width = 64px. Center X = 32px. Padding = 32px.
              Desktop Item Width = 80px. Center X = 40px. Padding = 40px.
          */}
          <div className="absolute top-[20.5px] sm:top-[21.5px] left-0 right-0 px-[32px] sm:px-[40px]" style={{ zIndex: 0 }}>
             <div className="relative w-full h-[3px] bg-slate-200 rounded-full">
                <div 
                   className="absolute left-0 top-0 h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-700 ease-in-out"
                   style={{ width: `${progressPercentage}%` }}
                ></div>
             </div>
          </div>

          {/* Steps */}
          <div className="relative z-10 flex justify-between">
            {steps.map((step, index) => {
              const isCompleted = index < currentIndex;
              const isCurrent = index === currentIndex;
              const isUpcoming = index > currentIndex;
              const StepIcon = step.icon;

              return (
                <div
                  key={step.id}
                  className={`flex flex-col items-center w-[64px] sm:w-[80px] ${isCompleted && onStepClick ? 'cursor-pointer' : ''}`}
                  style={{ flex: '0 0 auto' }}
                  onClick={() => isCompleted && onStepClick && onStepClick(step.id)}
                >
                  {/* Circle with icon */}
                  <div className="relative">
                    {/* Glow effect for current step */}
                    {isCurrent && (
                      <div className="absolute inset-0 bg-blue-400 rounded-full blur-md opacity-40 animate-pulse"></div>
                    )}

                    <div
                      className={`
                        relative w-11 h-11 sm:w-[46px] sm:h-[46px] rounded-full flex items-center justify-center
                        transition-all duration-300 border-[3px] z-20
                        ${isCompleted ? `bg-gradient-to-br from-green-500 to-green-600 border-green-400 shadow-lg shadow-green-200 ${onStepClick ? 'hover:scale-110 hover:shadow-xl hover:shadow-green-300' : ''}` : ''}
                        ${isCurrent ? 'bg-gradient-to-br from-blue-500 to-blue-600 border-blue-400 shadow-xl shadow-blue-200 scale-110' : ''}
                        ${isUpcoming ? 'bg-white border-slate-300 shadow-sm' : ''}
                      `}
                    >
                      {isCompleted ? (
                        <Check size={20} className="text-white font-bold" strokeWidth={3} />
                      ) : (
                        <StepIcon
                          size={isCurrent ? 20 : 18}
                          className={`
                            ${isCurrent ? 'text-white' : ''}
                            ${isUpcoming ? 'text-slate-400' : ''}
                          `}
                          strokeWidth={2.5}
                        />
                      )}
                    </div>
                  </div>

                  {/* Label */}
                  <div className="mt-6 text-center w-full relative z-20">
                    <div
                      className={`
                        text-[11px] sm:text-xs font-bold transition-all duration-300 leading-tight
                        ${isCompleted ? 'text-green-700' : ''}
                        ${isCurrent ? 'text-blue-700 scale-105' : ''}
                        ${isUpcoming ? 'text-slate-400' : ''}
                      `}
                    >
                      {step.label}
                    </div>
                    <div
                      className={`
                        text-[9px] sm:text-[10px] transition-colors duration-300 mt-1 leading-tight
                        ${isCompleted ? 'text-green-600' : ''}
                        ${isCurrent ? 'text-blue-600' : ''}
                        ${isUpcoming ? 'text-slate-300' : ''}
                      `}
                    >
                      {step.description}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};