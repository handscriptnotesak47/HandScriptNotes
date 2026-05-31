/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Download, Eye, Lock, CheckCircle2, AlertCircle, Copy, Printer } from 'lucide-react';
import { NotesUnit, HandwrittenPage } from '../types';

interface DocReaderProps {
  unit: NotesUnit;
  isUnlocked: boolean;
  onBuy: (unit: NotesUnit) => void;
  onClose: () => void;
}

export default function DocReader({ unit, isUnlocked, onBuy, onClose }: DocReaderProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const pages = isUnlocked ? unit.fullPages : unit.demoPages;
  const totalPages = pages.length;

  const pageInfo = pages.find(p => p.pageNumber === currentPage) || pages[0];

  const handlePrev = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    } else if (!isUnlocked && currentPage === totalPages) {
      // Prompt user to purchase on trying to go beyond demo
    }
  };

  // Printing/Saving note simulation
  const handlePrint = () => {
    window.print();
  };

  return (
    <div id="notebook-reader-overlay" className="fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-fadeIn">
      <div id="notebook-reader-container" className="bg-white rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden border border-slate-200 flex flex-col h-[92vh]">
        
        {/* Header Panel */}
        <div className="bg-slate-50 p-4 sm:px-6 sm:py-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex flex-col">
            <div className="flex items-center space-x-2">
              <span className="text-xs bg-amber-50 text-amber-700 font-semibold px-2.5 py-0.5 rounded-full border border-amber-300/30">
                {unit.examId.replace(/_/g, ' ')}
              </span>
              {isUnlocked ? (
                <span className="text-xs bg-emerald-50 text-emerald-700 font-semibold px-2.5 py-0.5 rounded-full border border-emerald-200 flex items-center space-x-1">
                  <CheckCircle2 className="h-3 w-3" />
                  <span>Full Notes Unlocked</span>
                </span>
              ) : (
                <span className="text-xs bg-orange-50 text-brand-orange font-semibold px-2.5 py-0.5 rounded-full border border-orange-200 flex items-center space-x-1">
                  <Eye className="h-3 w-3" />
                  <span>Free Demo Mode</span>
                </span>
              )}
            </div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 mt-1 leading-tight tracking-tight">
              {unit.name}
            </h3>
          </div>
          
          <button 
            onClick={onClose} 
            className="text-slate-505 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 p-2 rounded-xl transition-all duration-205 cursor-pointer text-slate-500"
            title="Close notepad"
          >
            ✕
          </button>
        </div>

        {/* Reader Core Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-100 flex justify-center items-start">
          <div className="w-full max-w-2xl relative shadow-2xl transition-all duration-300">
            
            {/* Holographic Spiral Notebook Bound */}
            <div className="absolute -left-3 top-6 bottom-6 w-5 flex flex-col justify-between items-center z-20 pointer-events-none">
              {Array.from({ length: 15 }).map((_, i) => (
                <div key={i} className="w-6 h-3 bg-gradient-to-r from-slate-400 to-slate-200 rounded-full border-b border-slate-500 opacity-90 shadow" />
              ))}
            </div>

            {/* Notebook Ruled Paper Sheet */}
            <div className="ruled-paper bg-white text-slate-800 rounded-lg shadow-2xl px-8 sm:px-14 py-8 min-h-[550px] border-l-4 border-slate-300 flex flex-col justify-between relative select-none">
              
              {/* Paper Watermark */}
              <div className="absolute inset-0 flex items-center justify-center opacity-3 pointer-events-none origin-center -rotate-12">
                <span className="font-display font-black text-slate-900 border-4 border-slate-900 px-6 py-2 rounded-xl text-3xl uppercase tracking-wider">
                  HandScript Notes
                </span>
              </div>

              {/* Note Content */}
              <div className="z-10">
                {/* Rule paper top padding */}
                <div className="h-2"></div>
                
                {/* Note title */}
                <div className="border-b-2 border-red-200 pb-2 mb-6 uppercase tracking-wide">
                  <span className="font-handwritten text-xl font-bold text-blue-800 ml-4">
                    📚 {pageInfo.title || `Unit ${unit.unitNumber} Notes`}
                  </span>
                </div>

                {/* Handwritten paragraphs */}
                <div className="space-y-4 text-justify font-handwritten text-base leading-[2rem] font-medium tracking-wide">
                  {pageInfo.paragraphs.map((p, idx) => (
                    <p key={idx} className={p.startsWith('✍️') || p.startsWith('📍') || p.startsWith('👉') ? 'text-amber-800 font-bold ml-4' : 'text-slate-800 ml-4'}>
                      {p}
                    </p>
                  ))}
                </div>

                {/* Hand-drawn drawings/tables/charts */}
                {pageInfo.drawings && pageInfo.drawings.length > 0 && (
                  <div className="mt-8 space-y-4">
                    {pageInfo.drawings.map((draw, idx) => (
                      <div key={idx} className="bg-amber-50/70 border border-amber-200 rounded-xl p-4 ml-4 shadow-sm animate-fadeIn">
                        <span className="font-sans text-[11px] font-bold text-amber-700 block uppercase tracking-wider mb-2 text-center border-b border-amber-200 pb-1">
                          {draw.title}
                        </span>
                        
                        {draw.type === 'table' ? (
                          <div className="font-mono text-xs text-slate-700 whitespace-pre-wrap leading-relaxed overflow-x-auto bg-amber-100/50 p-2.5 rounded-lg border border-amber-200">
                            {draw.items.join('\n')}
                          </div>
                        ) : (
                          <div className="font-mono text-xs text-blue-900 font-bold whitespace-pre-wrap leading-snug tracking-tighter bg-amber-100/50 p-3 rounded-lg border border-amber-200 shadow-inner flex justify-center text-center">
                            <code>{draw.items.join('\n')}</code>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Page Number Footer */}
              <div className="mt-12 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400 font-mono z-10">
                <span>HandScript Notes System © 2026</span>
                <span className="bg-slate-100 px-3 py-1 rounded-full font-bold ml-4 text-slate-850">
                  PAGE {currentPage} OF {totalPages}
                </span>
                <span>Category: {unit.examId}</span>
              </div>

            </div>

            {/* locked page prompt (behind demo pages) */}
            {!isUnlocked && currentPage === totalPages && (
              <div className="absolute inset-0 bg-slate-50/95 rounded-lg flex flex-col items-center justify-center p-6 text-center z-30 backdrop-blur-[2px]">
                <div className="bg-amber-500/10 p-4 rounded-full border border-amber-400/30 mb-4 animate-bounce">
                  <Lock className="h-8 w-8 text-amber-600" />
                </div>
                <h4 className="text-xl font-bold text-slate-900 mb-2 font-display">
                  Syllabus Deep-Dive Locked 🔒
                </h4>
                <p className="text-slate-650 text-sm max-w-sm mb-6 leading-relaxed">
                  You have finished reading the free demo. Get instant, permanent access to all syllabus units of this exam for only <b>₹20 each</b>! Includes practice questions and exam keys.
                </p>
                <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3 w-full max-w-md">
                  <button
                    onClick={() => onBuy(unit)}
                    className="flex-1 bg-brand-orange hover:bg-brand-orange-hover text-white py-3 px-6 rounded-2xl font-bold shadow-lg shadow-brand-orange/20 transition-all duration-300 hover:scale-[1.02] cursor-pointer"
                  >
                    Buy Unit For ₹20 Now
                  </button>
                  <button
                    onClick={() => setCurrentPage(1)}
                    className="bg-white hover:bg-slate-50 text-slate-700 py-3 px-6 rounded-2xl font-semibold border border-slate-200 transition-all duration-300 cursor-pointer shadow-sm animate-fadeIn"
                  >
                    Review Demo Again
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>

        {/* Bottom Control Bar */}
        <div className="bg-slate-50 p-4 sm:px-6 border-t border-slate-200 flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:items-center sm:justify-between">
          
          <div className="flex items-center space-x-3 justify-center">
            <button
              onClick={handlePrev}
              disabled={currentPage === 1}
              className={`p-2.5 rounded-xl border transition-all duration-200 cursor-pointer ${
                currentPage === 1
                  ? 'border-slate-100 text-slate-300 bg-slate-50 cursor-not-allowed'
                  : 'border-slate-200 text-slate-700 bg-white hover:bg-slate-100 shadow-sm'
              }`}
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <span className="text-sm font-semibold text-slate-605 font-mono text-slate-600">
              Page <span className="text-slate-900 font-bold">{currentPage}</span> of {totalPages}
            </span>
            <button
              onClick={handleNext}
              disabled={currentPage === totalPages && isUnlocked}
              className={`p-2.5 rounded-xl border transition-all duration-200 cursor-pointer ${
                currentPage === totalPages && isUnlocked
                  ? 'border-slate-100 text-slate-300 bg-slate-50 cursor-not-allowed'
                  : 'border-slate-200 text-slate-700 bg-white hover:bg-slate-100 shadow-sm'
              }`}
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>

          <div className="flex items-center space-x-3 justify-center">
            {isUnlocked ? (
              <button
                onClick={handlePrint}
                className="bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold text-sm px-4.5 py-2.5 rounded-xl transition-all duration-200 flex items-center space-x-1.5 cursor-pointer shadow-sm"
              >
                <Printer className="h-4 w-4 text-emerald-500" />
                <span>Print & Save PDF</span>
              </button>
            ) : (
              <button
                onClick={() => onBuy(unit)}
                className="bg-gradient-to-r from-brand-orange to-amber-500 hover:from-brand-orange-hover hover:to-amber-600 text-white font-bold text-sm px-5 py-2.5 rounded-xl shadow-lg shadow-brand-orange/15 transition-all duration-200 hover:scale-[1.02] flex items-center space-x-1.5 cursor-pointer"
              >
                <Lock className="h-4 w-4" />
                <span>Unlock All Pages (₹20)</span>
              </button>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}
