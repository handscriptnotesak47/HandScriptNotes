/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Lock, CheckCircle2, Eye, Printer, Layers, FileText, Check, Award } from 'lucide-react';
import { NotesUnit, HandwrittenPage } from '../types';
import { getPdf } from '../utils/pdfStorage';

interface DocReaderProps {
  unit: NotesUnit;
  isUnlocked: boolean;
  onBuy: (unit: NotesUnit) => void;
  onClose: () => void;
}

export default function DocReader({ unit, isUnlocked, onBuy, onClose }: DocReaderProps) {
  const isPedagogy1 = unit.examId === 'RSMSSB_BCI' && unit.unitNumber === 1;
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [viewMode, setViewMode] = useState<'scan' | 'pdf'>(
    unit.pdfUrl ? 'pdf' : ((isPedagogy1 && isUnlocked) ? 'pdf' : 'scan')
  );
  const [renderedPdfUrl, setRenderedPdfUrl] = useState<string>('');
  const [pdfError, setPdfError] = useState<string | null>(null);

  useEffect(() => {
    if (!unit.pdfUrl) {
      if (isPedagogy1 && isUnlocked) {
        try {
          const htmlContent = getOfflineHTMLContent();
          const blob = new Blob([htmlContent], { type: 'text/html' });
          const blobUrl = URL.createObjectURL(blob);
          setRenderedPdfUrl(blobUrl);
          setPdfError(null);
          return () => {
            URL.revokeObjectURL(blobUrl);
          };
        } catch (err: any) {
          console.error('Failed to generate offline HTML for pedagogy unit:', err);
          setPdfError('Failed to generate offline HTML view.');
        }
      } else {
        setRenderedPdfUrl('');
        setPdfError(null);
      }
      return;
    }

    let active = true;
    let objectUrl = '';

    const loadPdfData = async () => {
      try {
        let actualPdfUrl = unit.pdfUrl || '';
        
        // If not unlocked, load the secure 4-page preview from the server instead!
        if (!isUnlocked) {
          actualPdfUrl = `/api/pdf-preview/${unit.id}`;
        } else if (actualPdfUrl.startsWith('indexeddb://')) {
          const storedData = await getPdf(unit.id);
          if (storedData) {
            actualPdfUrl = storedData;
          } else {
            throw new Error('PDF file was not found in the local database. Please try uploading it again.');
          }
        }

        if (actualPdfUrl.startsWith('data:application/pdf;base64,')) {
          const base64Content = actualPdfUrl.split(';base64,')[1];
          const binaryString = window.atob(base64Content.replace(/\s/g, ''));
          const len = binaryString.length;
          const bytes = new Uint8Array(len);
          for (let i = 0; i < len; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }
          const blob = new Blob([bytes], { type: 'application/pdf' });
          objectUrl = URL.createObjectURL(blob);
          if (active) {
            setRenderedPdfUrl(objectUrl);
            setPdfError(null);
          }
        } else {
          // Direct remote URL or path
          if (active) {
            setRenderedPdfUrl(actualPdfUrl);
            setPdfError(null);
          }
        }
      } catch (err: any) {
        console.error('Error generating safe blob URL for the PDF document:', err);
        if (active) {
          setPdfError(err?.message || 'Failed to parse or convert PDF into locally rendered document.');
          setRenderedPdfUrl(isUnlocked ? (unit.pdfUrl || '') : `/api/pdf-preview/${unit.id}`);
        }
      }
    };

    loadPdfData();

    return () => {
      active = false;
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [unit.pdfUrl, unit.id, isUnlocked]);

  const pages = isUnlocked ? unit.fullPages : unit.demoPages;
  const totalPages = pages.length;

  const pageInfo = pages[currentPageIndex] || pages[0];

  // Sync index when unlocked, to maintain reading context
  useEffect(() => {
    if (isUnlocked) {
      const prevPageNum = pages[currentPageIndex]?.pageNumber;
      if (prevPageNum) {
        const newIdx = unit.fullPages.findIndex(p => p.pageNumber === prevPageNum);
        if (newIdx !== -1) {
          setCurrentPageIndex(newIdx);
        }
      }
    }
  }, [isUnlocked]);

  const handlePrev = () => {
    if (currentPageIndex > 0) {
      setCurrentPageIndex(currentPageIndex - 1);
    }
  };

  const handleNext = () => {
    if (currentPageIndex < totalPages - 1) {
      setCurrentPageIndex(currentPageIndex + 1);
    }
  };

  function getOfflineHTMLContent() {
    // Generate beautiful styling and all pages
    const compiledPagesHTML = pages.map((page, pIdx) => {
      // Compile paragraphs for this page
      const parasHTML = page.paragraphs.map((p, lineIndex) => {
        const trimmed = p.trim();
        if (!trimmed) return '<div style="height: 1.5rem;"></div>';
        
        // Major heading check
        const isMajorHeading = 
          trimmed.startsWith('①') || trimmed.startsWith('②') || trimmed.startsWith('③') || 
          trimmed.startsWith('④') || trimmed.startsWith('⑤') || trimmed.startsWith('⑥') || 
          trimmed.startsWith('⑦') || trimmed.startsWith('⑧') || trimmed.startsWith('⑨') || 
          trimmed.startsWith('⑩') || trimmed.startsWith('⑪') || trimmed.startsWith('⑫') || 
          trimmed.startsWith('⑬') || trimmed.startsWith('⑭') || trimmed.startsWith('⑮') ||
          trimmed.startsWith('【LEVEL') || trimmed.startsWith('MODELS OF TEACHING') || 
          trimmed.startsWith('CONSTITUTIONAL ARTICLES') || trimmed.startsWith('FAMOUS PHILOSOPHICAL STATEMENT') ||
          trimmed.startsWith('WESTERN THINKERS') || trimmed.startsWith('PRE-INDEPENDENCE') ||
          trimmed.startsWith('POST-INDEPENDENCE');
          
        if (isMajorHeading) {
          const bg = lineIndex % 2 === 0 ? 'rgba(244, 143, 177, 0.4)' : 'rgba(255, 235, 59, 0.45)';
          return `
            <div style="margin: 20px 0; font-weight: bold; font-family: 'Kalam', 'Caveat', cursive; font-size: 1.25rem; color: #0f172a; padding-left: 10px;">
              <span style="position: relative; display: inline-block; padding: 2px 8px; background-color: ${bg}; border-radius: 8px;">
                <span style="text-decoration: underline; text-decoration-color: rgba(239, 68, 68, 0.7); text-underline-offset: 4px;">
                  ${trimmed}
                </span>
              </span>
            </div>
          `;
        }

        // Sub heading check
        const isSubHeading = 
          trimmed.startsWith('(a)') || trimmed.startsWith('(b)') || trimmed.startsWith('(c)') || 
          trimmed.startsWith('a)') || trimmed.startsWith('b)') || trimmed.startsWith('c)') ||
          trimmed.startsWith('d)') || trimmed.startsWith('• Stage') || trimmed.startsWith('THE FOUR VERTICALS');

        if (isSubHeading) {
          return `
            <div style="margin-top: 16px; margin-bottom: 8px; font-weight: bold; font-family: 'Kalam', 'Caveat', cursive; font-size: 1.05rem; color: #991b1b; padding-left: 15px;">
              <span style="border-bottom: 2px solid #f87171; padding-bottom: 2px;">
                ✍️ ${trimmed}
              </span>
            </div>
          `;
        }

        // Label check
        const hasLabel = trimmed.includes(':-') || (trimmed.startsWith('➔') && trimmed.includes(':'));
        if (hasLabel) {
          const separatorIdx = trimmed.indexOf(':-') !== -1 ? trimmed.indexOf(':-') : trimmed.indexOf(':');
          const label = trimmed.substring(0, separatorIdx + (trimmed.indexOf(':-') !== -1 ? 2 : 1));
          const rest = trimmed.substring(separatorIdx + (trimmed.indexOf(':-') !== -1 ? 2 : 1));
          const displayLabel = label.startsWith('➔') ? '📌 ' + label.replace('➔', '').trim() : label;
          return `
            <div style="margin: 10px 0; padding-left: 20px; display: flex; align-items: start; color: #1e3a8a; font-family: 'Kalam', 'Caveat', cursive;">
              <span style="color: #b91c1c; font-weight: 800; margin-right: 8px; border-bottom: 1px solid #ffe4e6; flex-shrink: 0;">
                ${displayLabel}
              </span>
              <span style="color: #1e3a8a; font-weight: 600;">
                ${rest}
              </span>
            </div>
          `;
        }

        // Arrow / bullet checklist
        if (trimmed.startsWith('➔') || trimmed.startsWith('•') || trimmed.startsWith('    •') || trimmed.startsWith('*')) {
          const displayLine = trimmed.replace(/^[➔•*\s]+/, '').trim();
          return `
            <div style="margin: 8px 0; padding-left: 25px; display: flex; align-items: start; color: #1e293b; font-family: 'Kalam', 'Caveat', cursive;">
              <span style="color: #3b82f6; margin-right: 8px; font-family: sans-serif; font-size: 0.8rem; margin-top: 4px;">●</span>
              <span style="font-style: italic; font-weight: 500;">${displayLine}</span>
            </div>
          `;
        }

        // Paragraph
        return `
          <p style="margin: 8px 0; padding-left: 20px; color: #1e293b; max-width: 96%; text-align: justify; font-family: 'Kalam', 'Caveat', cursive; font-size: 1rem; line-height: 2.2rem;">
            ${trimmed}
          </p>
        `;
      }).join('');

      // Draw compiled schemas if they exist
      const drawingsHTML = (page.drawings && page.drawings.length > 0) ? page.drawings.map((draw: any) => {
        const title = draw.title.toUpperCase();
        
        let customDrawHTML = '';
        if (title.includes('PAVLOV')) {
          customDrawHTML = `
            <div style="margin: 24px auto; max-width: 500px; padding: 20px; border-radius: 24px; border: 2px solid #fda4af; background-color: rgba(254, 243, 199, 0.2); box-shadow: 0 1px 3px rgba(0,0,0,0.05); position: relative; font-family: 'Kalam', 'Caveat', cursive;">
              <div style="text-align: center; font-size: 10px; color: #f43f5e; font-weight: bold; text-transform: uppercase; letter-spacing: 0.1em; border-bottom: 1px solid #fecdd3; padding-bottom: 4px; margin-bottom: 16px;">
                📍 PAVLOV'S CONDITIONING FLOW
              </div>
              <div style="display: flex; flex-direction: column; gap: 12px;">
                <div style="background: white; padding: 10px; border-radius: 12px; border: 1px solid #ffe4e6; display: flex; justify-content: space-between; font-size: 11px;">
                  <span style="background: #fef2f2; color: #b91c1c; padding: 2px 6px; border-radius: 4px; font-weight: bold; border: 1px solid #fee2e2;">Food (Unconditioned Stimulus)</span>
                  <span style="color: #fb7185; font-weight: bold; margin: 0 8px;">──➔</span>
                  <span style="background: #ecfdf5; color: #065f46; padding: 2px 6px; border-radius: 4px; font-weight: bold; border: 1px solid #d1fae5;">Salivation (Unconditioned Response)</span>
                </div>
                <div style="background: white; padding: 10px; border-radius: 12px; border: 1px solid #ffe4e6; display: flex; justify-content: space-between; font-size: 11px;">
                  <span style="background: #eff6ff; color: #1e40af; padding: 2px 6px; border-radius: 4px; font-weight: bold; border: 1px solid #dbeafe;">Bell + Food (Neutral + US)</span>
                  <span style="color: #fb7185; font-weight: bold; margin: 0 8px;">──➔</span>
                  <span style="background: #ecfdf5; color: #065f46; padding: 2px 6px; border-radius: 4px; font-weight: bold; border: 1px solid #d1fae5;">Salivation (Unconditioned Response)</span>
                </div>
                <div style="background: rgba(254, 243, 199, 0.5); padding: 10px; border-radius: 12px; border: 2px dashed #f87171; display: flex; justify-content: space-between; font-size: 11px;">
                  <span style="background: #faf5ff; color: #6b21a8; padding: 2px 6px; border-radius: 4px; font-weight: bold; border: 1px solid #f3e8ff;">Bell Only (Conditioned Stimulus)</span>
                  <span style="color: #fb7185; font-weight: bold; margin: 0 8px;">──➔</span>
                  <span style="background: #10b981; color: white; padding: 2px 6px; border-radius: 4px; font-weight: bold;">Salivation (Conditioned Response)</span>
                </div>
              </div>
            </div>
          `;
        } else if (title.includes('INSIGHT')) {
          customDrawHTML = `
            <div style="margin: 24px auto; max-width: 500px; padding: 20px; border-radius: 24px; border: 2px solid #fecdd3; background-color: rgba(254, 243, 199, 0.2); box-shadow: 0 1px 3px rgba(0,0,0,0.05); position: relative; font-family: 'Kalam', 'Caveat', cursive;">
              <div style="text-align: center; font-size: 10px; color: #f43f5e; font-weight: bold; text-transform: uppercase; letter-spacing: 0.1em; border-bottom: 1px solid #fecdd3; padding-bottom: 4px; margin-bottom: 16px;">
                📍 INSIGHT VS TRIAL & ERROR (COGNITIVE MODEL)
              </div>
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
                <div style="border: 1px solid #fca5a5; border-radius: 16px; padding: 12px; background: rgba(254,226,226,0.3); text-align: center;">
                  <div style="color: #b91c1c; font-weight: bold; font-size: 13px; margin-bottom: 8px; border-bottom: 1px solid #fecdd3; padding-bottom: 4px;">🐱 Trial & Error (Cat)</div>
                  <div style="display: flex; flex-direction: column; align-items: center; gap: 6px; font-size: 10px;">
                    <span style="background: white; padding: 4px 8px; border-radius: 4px; border: 1px solid #e2e8f0;">Puzzle Box Locked</span>
                    <span style="color: #f87171; font-weight: bold;">▼</span>
                    <span style="background: white; padding: 4px 8px; border-radius: 4px; border: 1px solid #e2e8f0; color: #b91c1c;">Random Blind Attempts</span>
                    <span style="color: #f87171; font-weight: bold;">▼</span>
                    <span style="background: #059669; color: white; padding: 4px 8px; border-radius: 4px; font-weight: bold;">Random Success</span>
                  </div>
                </div>
                <div style="border: 1px solid #93c5fd; border-radius: 16px; padding: 12px; background: rgba(219,234,254,0.3); text-align: center;">
                  <div style="color: #1d4ed8; font-weight: bold; font-size: 13px; margin-bottom: 8px; border-bottom: 1px solid #bfdbfe; padding-bottom: 4px;">🦧 Insight (Sultan)</div>
                  <div style="display: flex; flex-direction: column; align-items: center; gap: 6px; font-size: 10px;">
                    <span style="background: white; padding: 4px 8px; border-radius: 4px; border: 1px solid #e2e8f0;">Banana Out of Reach</span>
                    <span style="color: #60a5fa; font-weight: bold;">▼</span>
                    <span style="background: white; padding: 4px 8px; border-radius: 4px; border: 1px solid #e2e8f0; color: #1d4ed8;">Cognitive Map Gap</span>
                    <span style="color: #60a5fa; font-weight: bold;">▼</span>
                    <span style="background: linear-gradient(to right, #2563eb, #4f46e5); color: white; padding: 4px 10px; border-radius: 8px; font-weight: bold; font-family: sans-serif;">Sudden 'Aha!' Moment</span>
                  </div>
                </div>
              </div>
            </div>
          `;
        } else if (title.includes('CAM') || title.includes('ATTAINMENT')) {
          customDrawHTML = `
            <div style="margin: 24px auto; max-width: 500px; padding: 20px; border-radius: 24px; border: 2px solid #fecdd3; background-color: rgba(254, 243, 199, 0.2); text-align: center; font-family: 'Kalam', 'Caveat', cursive;">
              <div style="font-size: 10px; color: #f43f5e; font-weight: bold; text-transform: uppercase; letter-spacing: 0.1em; border-bottom: 1px solid #fecdd3; padding-bottom: 4px; margin-bottom: 16px;">
                📍 BRUNER'S CAM FLOW DIAGRAM
              </div>
              <div style="display: inline-flex; flex-direction: column; align-items: center; gap: 8px;">
                <div style="background: #f0f9ff; border: 1px solid #38bdf8; border-radius: 16px; padding: 8px 16px; color: #0c4a6e; font-weight: bold; font-size: 11px; max-width: 320px; line-height: 1.3">
                  Phase 1: Present Labelled Examples <span style="display: block; font-family: sans-serif; font-size: 9px; font-weight: normal; opacity: 0.8;">(Structured Yes / No pairs)</span>
                </div>
                <span style="color: #fb7185; font-weight: bold; font-size: 14px;">▼</span>
                <div style="background: #faf5ff; border: 1px solid #c084fc; border-radius: 16px; padding: 8px 16px; color: #3b0764; font-weight: bold; font-size: 11px; max-width: 320px; line-height: 1.3">
                  Phase 2: Test Concept Attainment <span style="display: block; font-family: sans-serif; font-size: 9px; font-weight: normal; opacity: 0.8;">(Students classify unlabeled cards)</span>
                </div>
                <span style="color: #fb7185; font-weight: bold; font-size: 14px;">▼</span>
                <div style="background: #ecfdf5; border: 1px solid #34d399; border-radius: 16px; padding: 8px 16px; color: #064e3b; font-weight: bold; font-size: 11px; max-width: 320px; line-height: 1.3; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
                  Phase 3: Cognitive Analysis <span style="display: block; font-family: sans-serif; font-size: 9px; font-weight: normal; opacity: 0.8;">(Audit active thinking strategies)</span>
                </div>
              </div>
            </div>
          `;
        } else if (title.includes('AOM') || title.includes('ORGANIZER')) {
          customDrawHTML = `
            <div style="margin: 24px auto; max-width: 500px; padding: 20px; border-radius: 24px; border: 2px solid #fecdd3; background-color: rgba(254, 243, 199, 0.2); position: relative; font-family: 'Kalam', 'Caveat', cursive;">
              <div style="text-align: center; font-size: 10px; color: #f43f5e; font-weight: bold; text-transform: uppercase; letter-spacing: 0.1em; border-bottom: 1px solid #fecdd3; padding-bottom: 4px; margin-bottom: 16px;">
                📍 AUSUBEL'S ADVANCE ORGANIZER MODEL
              </div>
              <div style="position: relative; height: 180px; display: flex; flex-direction: column; justify-content: space-between; align-items: center; padding-top: 8px;">
                <div style="display: flex; justify-content: space-between; width: 100%; gap: 12px;">
                  <div style="background: #f0f9ff; border: 1px solid #38bdf8; padding: 10px; border-radius: 16px; font-weight: bold; width: 48%; text-align: center; color: #1e3a8a; font-size: 11px; line-height: 1.3;">
                    Prior Learner Cognitive Structures
                  </div>
                  <div style="background: #fff5f5; border: 1px solid #feb2b2; padding: 10px; border-radius: 16px; font-weight: bold; width: 48%; text-align: center; color: #742a2a; font-size: 11px; line-height: 1.3;">
                    New Unfamiliar Syllabus Information
                  </div>
                </div>
                <div style="background: linear-gradient(to right, #fde047, #fef08a); border: 2px solid #eab308; padding: 12px; border-radius: 16px; font-weight: 800; width: 66%; text-align: center; color: #422006; box-shadow: 0 4px 6px rgba(0,0,0,0.05); transform: rotate(-0.5deg);">
                  ✨ ADVANCE ORGANIZER ✨
                  <span style="display: block; font-family: sans-serif; font-size: 9px; font-weight: normal; opacity: 0.8; margin-top: 4px;">Acts as a mental bridge linking old to new concepts</span>
                </div>
              </div>
            </div>
          `;
        } else if (title.includes('HECI') || title.includes('REGULATORY')) {
          customDrawHTML = `
            <div style="margin: 24px auto; max-width: 500px; padding: 20px; border-radius: 24px; border: 2px solid #fecdd3; background-color: rgba(254, 243, 199, 0.25); text-align: center; font-family: 'Kalam', 'Caveat', cursive;">
              <div style="font-size: 10px; color: #f43f5e; font-weight: bold; text-transform: uppercase; letter-spacing: 0.1em; border-bottom: 1px solid #fecdd3; padding-bottom: 4px; margin-bottom: 16px;">
                📍 HECI REGULATORY VERTICAL DISSECTION
              </div>
              <div style="background: #312e81; color: white; border-radius: 16px; padding: 8px 24px; font-weight: bold; max-width: 280px; margin: 0 auto 20px; font-size: 11px; border: 1px solid #4338ca; font-family: sans-serif;">
                🏛️ HECI UMBRELLA ORGAN SYSTEM
              </div>
              <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; font-size: 10px;">
                <div style="background: #f0f9ff; border: 1px solid #7dd3fc; padding: 10px; border-radius: 16px; color: #0c4a6e; font-weight: bold; display: flex; flex-direction: column; align-items: center; justify-content: center; box-shadow: inset 0 1px 2px rgba(0,0,0,0.05);">
                  <span style="font-size: 14px; margin-bottom: 4px;">⚖️</span>
                  <b>NHERC</b>
                  <span style="font-family: sans-serif; font-size: 8px; font-weight: normal; color: #64748b; margin-top: 2px;">Regulate (Licensing)</span>
                </div>
                <div style="background: #faf5ff; border: 1px solid #d8b4fe; padding: 10px; border-radius: 16px; color: #3b0764; font-weight: bold; display: flex; flex-direction: column; align-items: center; justify-content: center; box-shadow: inset 0 1px 2px rgba(0,0,0,0.05);">
                  <span style="font-size: 14px; margin-bottom: 4px;">⭐</span>
                  <b>NAC</b>
                  <span style="font-family: sans-serif; font-size: 8px; font-weight: normal; color: #64748b; margin-top: 2px;">Quality Assessment</span>
                </div>
                <div style="background: #ecfdf5; border: 1px solid #6ee7b7; padding: 10px; border-radius: 16px; color: #064e3b; font-weight: bold; display: flex; flex-direction: column; align-items: center; justify-content: center; box-shadow: inset 0 1px 2px rgba(0,0,0,0.05);">
                  <span style="font-size: 14px; margin-bottom: 4px;">🎯</span>
                  <b>GEC</b>
                  <span style="font-family: sans-serif; font-size: 8px; font-weight: normal; color: #64748b; margin-top: 2px;">Academic Standards</span>
                </div>
              </div>
            </div>
          `;
        } else {
          customDrawHTML = `
            <div style="margin: 24px 0 24px 40px; padding: 16px; border: 2px dashed #f87171; border-radius: 16px; background-color: rgba(254, 243, 199, 0.2); position: relative; font-family: 'Kalam', 'Caveat', cursive;">
              <span style="font-size: 11px; font-weight: bold; color: #b91c1c; display: block; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 8px; text-align: center; border-bottom: 1px solid #fecdd3; padding-bottom: 4px;">
                📌 ${draw.title}
              </span>
              <div style="font-size: 13px; color: #1e293b; white-space: pre-wrap; line-height: 1.5; background: #fffcf4; padding: 12px; border-radius: 8px; border: 1px solid rgba(248, 113, 113, 0.25);">
                ${draw.items.join('\n')}
              </div>
            </div>
          `;
        }
        return customDrawHTML;
      }).join('') : '';

      return `
        <!-- PHYSICAL NOTEBOOK PAGE -->
        <div class="page-card">
          <!-- Spiral Binder Punch Holes -->
          <div style="position: absolute; left: 16px; top: 24px; bottom: 24px; width: 12px; display: flex; flex-direction: column; justify-content: space-between; opacity: 0.5;">
            ${Array.from({ length: 18 }).map(() => '<div style="width: 10px; height: 10px; background-color: #020617; border-radius: 50%;"></div>').join('')}
          </div>

          <!-- Vertical Ruled Margin lines -->
          <div class="red-margin"></div>
          <div class="paper-lines"></div>

          <div class="content">
            <!-- Header section of this page -->
            <div style="display: flex; justify-content: space-between; border-bottom: 1px solid #fca5a5; padding-bottom: 4px; margin-bottom: 30px; font-size: 12px; color: #f43f5e; font-family: 'Inter', sans-serif;">
              <div>
                Subject: <span style="border-bottom: 1px dashed #fca5a5; width: 180px; display: inline-block; padding-left: 6px; font-weight: bold; color: #1d4ed8;">
                  ${isPedagogy1 ? 'Pedagogy & Learning' : 'Technical Syllabus'}
                </span>
              </div>
              <div class="meta-box">
                <span>Exam Key: <b>${unit.examId}</b></span>
                <span>Page No: <b>${page.pageNumber}</b></span>
              </div>
            </div>

            <!-- Page Title -->
            <div style="text-align: center; margin-bottom: 24px;">
              <div class="heading">
                ${page.title || `Unit ${unit.unitNumber} Notes — Section ${page.pageNumber}`}
              </div>
            </div>

            <!-- Paragraphs and drawings of this page -->
            <div style="margin-bottom: 40px;">
              ${parasHTML}
              ${drawingsHTML}
            </div>

            <!-- Stamped validation / footers -->
            <div style="margin-top: 50px; padding-top: 10px; border-top: 1px solid #fecdd3; display: flex; justify-content: space-between; font-size: 11px; color: #fb7185; font-family: 'Inter', sans-serif;">
              <div>
                Compiler Signature: <span style="font-weight: bold; color: #1e3a8a; font-size: 13px; font-family: 'Kalam', 'Caveat', cursive;">✍️ Subhash Kumar</span>
              </div>
              <div>
                Status: <span style="font-weight: bold; color: #059669; border: 1px solid rgba(16, 185, 129, 0.3); padding: 2px 6px; border-radius: 4px; background-color: rgba(209, 250, 229, 0.4);">✓ Verified Syllabus</span>
              </div>
            </div>
          </div>
        </div>
      `;
    }).join('');

    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>HandScript Notes - ${unit.name}</title>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&family=Kalam:wght@400;700&family=Caveat:wght@400;700&display=swap" rel="stylesheet">
        <style>
          body {
            background-color: #0b0f19;
            color: #f1f5f9;
            font-family: 'Inter', sans-serif;
            margin: 0;
            padding: 0;
          }
          .top-bar {
            background-color: #030712;
            border-bottom: 1px solid #1f2937;
            padding: 16px 24px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            position: sticky;
            top: 0;
            z-index: 100;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          }
          .title-section h3 {
            margin: 0;
            font-weight: 800;
            color: #ffffff;
            font-size: 18px;
            letter-spacing: -0.025em;
          }
          .title-section p {
            margin: 4px 0 0 0;
            color: #9ca3af;
            font-size: 12px;
          }
          .btn-group {
            display: flex;
            gap: 12px;
          }
          .btn {
            background: linear-gradient(135deg, #f97316 0%, #d97706 100%);
            color: #ffffff;
            border: none;
            padding: 10px 24px;
            border-radius: 12px;
            font-weight: 700;
            cursor: pointer;
            font-size: 13px;
            display: inline-flex;
            align-items: center;
            gap: 8px;
            box-shadow: 0 4px 14px rgba(249, 115, 22, 0.3);
            transition: all 0.2s ease;
          }
          .btn:hover {
            transform: translateY(-1px);
            box-shadow: 0 6px 20px rgba(249, 115, 22, 0.45);
          }
          .btn-secondary {
            background: #1f2937;
            color: #e5e7eb;
            border: 1px solid #374151;
            box-shadow: none;
          }
          .btn-secondary:hover {
            background: #374151;
            color: #ffffff;
            box-shadow: none;
          }
          .instructions-alert {
            background-color: #1e1b4b;
            border: 1px dashed #6366f1;
            padding: 12px 18px;
            border-radius: 12px;
            margin: 20px auto 10px;
            max-width: 800px;
            font-size: 12px;
            color: #c7d2fe;
            display: flex;
            align-items: center;
            gap: 12px;
            box-sizing: border-box;
          }
          .container {
            max-width: 800px;
            margin: 30px auto;
            padding: 0 16px;
          }
          .page-card {
            background-color: #faf7ef;
            color: #1e293b;
            border: 1px solid #fef3c7;
            border-radius: 32px;
            box-shadow: 0 15px 40px rgba(0, 0, 0, 0.4);
            padding: 40px 40px 40px 50px;
            margin-bottom: 50px;
            position: relative;
            min-height: 800px;
            font-family: 'Kalam', 'Caveat', cursive;
            box-sizing: border-box;
            break-after: page;
            page-break-after: always;
          }
          .red-margin {
            position: absolute;
            top: 0;
            bottom: 0;
            left: 58px;
            width: 1.5px;
            background-color: rgba(239, 68, 68, 0.5);
          }
          .paper-lines {
            position: absolute;
            inset: 0;
            pointer-events: none;
            background-image: linear-gradient(#475569 1px, transparent 1px);
            background-size: 100% 2.375rem;
            background-position: 0 20px;
            opacity: 0.12;
            border-radius: 32px;
          }
          .content {
            position: relative;
            z-index: 10;
            margin-left: 30px;
          }
          .heading {
            font-weight: 800;
            font-size: 21px;
            color: #1e3a8a;
            border-bottom: 2.5px double #ef4444;
            display: inline-block;
            margin-bottom: 10px;
            padding-bottom: 2px;
          }
          .meta-box {
            border: 1px solid rgba(244, 63, 94, 0.3);
            border-radius: 6px;
            padding: 3px 10px;
            font-size: 10px;
            color: #ef4444;
            background-color: #ffffff;
            font-family: 'Inter', sans-serif;
            display: inline-flex;
            gap: 10px;
          }
          @media print {
            body {
              background-color: #ffffff !important;
              color: #000000 !important;
            }
            .top-bar, .instructions-alert {
              display: none !important;
            }
            .container {
              margin: 0 !important;
              max-width: 100% !important;
              padding: 0 !important;
            }
            .page-card {
              border: none !important;
              box-shadow: none !important;
              padding: 20px 20px 20px 40px !important;
              margin: 0 !important;
              background-color: #ffffff !important;
              min-height: 100vh !important;
            }
            .red-margin {
              left: 48px !important;
            }
            .content {
              margin-left: 20px !important;
            }
          }
        </style>
      </head>
      <body>
        <!-- Floating Navigation Header -->
        <div class="top-bar">
          <div class="title-section">
            <h3>📝 Downloaded Notebook: ${unit.name}</h3>
            <p>Original high-fidelity copybook scanned notes • Compiled for standard web printing</p>
          </div>
          <div class="btn-group">
            <button class="btn" onclick="window.print()">
              🖨️ Print & Save PDF
            </button>
            <button class="btn btn-secondary" onclick="window.close()">
              ✕ Close Paper
            </button>
          </div>
        </div>

        <div class="instructions-alert">
          <span style="font-size: 20px;">💡</span>
          <div>
            <strong>PDF Save Instructions:</strong> A high-quality printing template of these handwritten notes is fully loaded below. 
            Click the orange <strong>"Print & Save PDF"</strong> button above (or press <strong>Ctrl + P</strong>) and choose <strong>"Save as PDF"</strong> as your destination to save all pages beautifully on your device!
          </div>
        </div>

        <div class="container">
          ${compiledPagesHTML}
        </div>
      </body>
      </html>
    `;
  };

  const handlePrint = async () => {
    try {
      if (unit.pdfUrl) {
        // Download the exact unmodified PDF exactly as provided by the user
        const fileName = unit.pdfName || `${unit.examId}_Unit_${unit.unitNumber}_Original_Handwritten_Notes.pdf`;
        
        let actualPdfUrl = unit.pdfUrl;
        if (actualPdfUrl.startsWith('indexeddb://')) {
          const stored = await getPdf(unit.id);
          if (stored) {
            actualPdfUrl = stored;
          } else {
            alert('Unable to retrieve PDF file from database. Please re-upload it.');
            return;
          }
        }

        if (actualPdfUrl.startsWith('data:application/pdf;base64,')) {
          const base64Content = actualPdfUrl.split(';base64,')[1];
          const binaryString = window.atob(base64Content);
          const len = binaryString.length;
          const bytes = new Uint8Array(len);
          for (let i = 0; i < len; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }
          const blob = new Blob([bytes], { type: 'application/pdf' });
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = fileName.endsWith('.pdf') ? fileName : `${fileName}.pdf`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
        } else {
          try {
            // Fetch as a blob to force-download the file reliably across all platforms & iframes
            const response = await fetch(actualPdfUrl);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = fileName.endsWith('.pdf') ? fileName : `${fileName}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
          } catch (fetchErr) {
            console.error("Fetch-blob download failed, falling back to direct link:", fetchErr);
            // Fallback direct download link
            const link = document.createElement('a');
            link.href = actualPdfUrl;
            link.target = '_blank';
            link.download = fileName.endsWith('.pdf') ? fileName : `${fileName}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
          }
        }
      } else {
        // Fallback: Use browser print settings
        alert(
          `✨ Saving View PDF Fallback:\n\n` +
          `No original physical PDF was uploaded for this unit yet. Opening the high-fidelity printer frame...\n` +
          `Simply choose 'Save as PDF' from your printer destination list to download these beautifully compiled handwritten copybook views instantly!`
        );
        window.print();
      }
    } catch (error) {
      console.error('PDF file download failed, calling browser print fallback:', error);
      window.print();
    }
  };

  // Helper to parse line content and apply handwritten highlights, ink alterations, and annotations
  const renderHandwrittenLine = (line: string, lineIndex: number) => {
    const trimmed = line.trim();
    if (!trimmed) {
      return <div key={lineIndex} className="h-6" />;
    }

    // 1. Major headings with simulated highlighter overlap
    const isMajorHeading = 
      trimmed.startsWith('①') || trimmed.startsWith('②') || trimmed.startsWith('③') || 
      trimmed.startsWith('④') || trimmed.startsWith('⑤') || trimmed.startsWith('⑥') || 
      trimmed.startsWith('⑦') || trimmed.startsWith('⑧') || trimmed.startsWith('⑨') || 
      trimmed.startsWith('⑩') || trimmed.startsWith('⑪') || trimmed.startsWith('⑫') || 
      trimmed.startsWith('⑬') || trimmed.startsWith('⑭') || trimmed.startsWith('⑮') ||
      trimmed.startsWith('【LEVEL') || trimmed.startsWith('MODELS OF TEACHING') || 
      trimmed.startsWith('CONSTITUTIONAL ARTICLES') || trimmed.startsWith('FAMOUS PHILOSOPHICAL STATEMENT') ||
      trimmed.startsWith('WESTERN THINKERS') || trimmed.startsWith('PRE-INDEPENDENCE') ||
      trimmed.startsWith('POST-INDEPENDENCE');

    if (isMajorHeading) {
      // Pick dynamic highlighted color for variety
      const highlighterBg = lineIndex % 2 === 0 ? 'bg-pink-200/60' : 'bg-yellow-200/70';
      return (
        <div key={lineIndex} className="my-5 font-bold font-handwritten text-lg sm:text-xl text-slate-900 leading-relaxed pl-2 sm:pl-4">
          <span className="relative inline-block z-10 px-3 py-1">
            <span className={`absolute inset-0 ${highlighterBg} rounded-[10px_4px_14px_6px] rotate-[-0.5deg] -z-10 mix-blend-multiply scale-x-105 scale-y-110 shadow-sm`}></span>
            <span className="underline decoration-[2px] decoration-rose-500/70 underline-offset-4 text-slate-950">
              {trimmed}
            </span>
          </span>
        </div>
      );
    }

    // 2. Sub-headings or topic sections
    const isSubHeading = 
      trimmed.startsWith('(a)') || trimmed.startsWith('(b)') || trimmed.startsWith('(c)') || 
      trimmed.startsWith('a)') || trimmed.startsWith('b)') || trimmed.startsWith('c)') ||
      trimmed.startsWith('d)') || trimmed.startsWith('• Stage') || trimmed.startsWith('THE FOUR VERTICALS');

    if (isSubHeading) {
      return (
        <div key={lineIndex} className="mt-4 mb-2 font-bold font-handwritten text-base leading-relaxed pl-3 sm:pl-6 text-rose-800">
          <span className="border-b-[2px] border-rose-400 pb-0.5 tracking-wide inline-block rotate-[-0.2deg]">
            ✍️ {trimmed}
          </span>
        </div>
      );
    }

    // 3. Definitions, parameters & technical targets (e.g. "Idea:", "Experiment:")
    const hasLabel = trimmed.includes(':-') || (trimmed.startsWith('➔') && trimmed.includes(':'));
    if (hasLabel) {
      // Find separator
      const separatorIdx = trimmed.indexOf(':-') !== -1 ? trimmed.indexOf(':-') : trimmed.indexOf(':');
      const label = trimmed.substring(0, separatorIdx + (trimmed.indexOf(':-') !== -1 ? 2 : 1));
      const rest = trimmed.substring(separatorIdx + (trimmed.indexOf(':-') !== -1 ? 2 : 1));

      return (
        <div key={lineIndex} className="my-2.5 font-handwritten text-sm sm:text-base leading-relaxed pl-5 sm:pl-8 flex items-start text-justify">
          <span className="text-red-650 text-red-650 text-red-700 font-extrabold mr-2 select-none shrink-0 border-b border-rose-100 flex items-center">
            {label.startsWith('➔') ? '📌 ' + label.replace('➔', '').trim() : label}
          </span>
          <span className="text-blue-900 font-semibold select-all font-handwritten leading-relaxed">
            {rest}
          </span>
        </div>
      );
    }

    // 4. Arrow or bullet instructions
    if (trimmed.startsWith('➔') || trimmed.startsWith('•') || trimmed.startsWith('    •') || trimmed.startsWith('*')) {
      const displayLine = trimmed.replace(/^[➔•*\s]+/, '').trim();
      return (
        <div key={lineIndex} className="my-2 pl-6 sm:pl-10 font-handwritten text-sm sm:text-base text-slate-800 leading-relaxed flex items-start text-justify">
          <span className="text-blue-500 mr-2 select-none shrink-0 font-sans mt-1 text-xs">●</span>
          <span className="italic text-slate-900/90 font-medium">{displayLine}</span>
        </div>
      );
    }

    // 5. Standard line paragraph
    return (
      <p key={lineIndex} className="my-2 pl-4 sm:pl-8 text-slate-800 font-handwritten text-sm sm:text-base leading-relaxed text-justify max-w-[96%]">
        {trimmed}
      </p>
    );
  };

  // Dedicated visual renderers for structural handwritten drawings mapping to original PDF screenshots
  const renderHandwrittenDrawings = (draw: any, drawIndex: number) => {
    const title = draw.title.toUpperCase();

    // Custom Interactive SVG-Replicas of structural drawings inside original PDF
    if (title.includes('PAVLOV')) {
      return (
        <div key={drawIndex} className="my-6 mx-auto max-w-lg p-5 rounded-3xl border-2 border-red-250 border-rose-300 bg-amber-50/20 shadow-sm relative font-handwritten">
          <div className="absolute top-2 left-6 right-6 text-center text-[10px] text-rose-500 font-bold uppercase tracking-widest border-b border-rose-200 pb-1 mb-4 select-none">
            📍 PAVLOV'S CONDITIONING FLOW
          </div>
          <div className="space-y-4 pt-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-1 sm:space-y-0 bg-white p-2.5 rounded-2xl border border-rose-100 shadow-inner">
              <span className="bg-red-50 text-red-700 px-2 py-0.5 rounded border border-red-200 font-bold text-xs">Food (Unconditioned Stimulus)</span>
              <span className="text-rose-450 text-center font-bold text-xs sm:mx-2">──➔</span>
              <span className="bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded border border-emerald-200 font-bold text-xs">Salivation (Unconditioned Response)</span>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-1 sm:space-y-0 bg-white p-2.5 rounded-2xl border border-rose-100 shadow-inner">
              <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-200 font-bold text-xs">Bell + Food (Neutral + US)</span>
              <span className="text-rose-450 text-center font-bold text-xs sm:mx-2">──➔</span>
              <span className="bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded border border-emerald-200 font-bold text-xs">Salivation (Unconditioned Response)</span>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-1 sm:space-y-0 bg-amber-50/50 p-2.5 rounded-2xl border-2 border-dashed border-rose-300 shadow-inner">
              <span className="bg-purple-50 text-purple-700 px-2 py-0.5 rounded border border-purple-200 font-bold text-xs">Bell Only (Conditioned Stimulus)</span>
              <span className="text-rose-450 text-center font-bold text-xs sm:mx-2">──➔</span>
              <span className="bg-emerald-600 text-white px-2 py-0.5 rounded font-bold text-xs">Salivation (Conditioned Response)</span>
            </div>
          </div>
        </div>
      );
    }

    if (title.includes('INSIGHT')) {
      return (
        <div key={drawIndex} className="my-6 mx-auto max-w-lg p-5 rounded-3xl border-2 border-rose-300 bg-amber-50/20 shadow-sm relative font-handwritten">
          <div className="absolute top-2 left-6 right-6 text-center text-[10px] text-rose-500 font-bold uppercase tracking-widest border-b border-rose-200 pb-1 mb-4 select-none">
            📍 INSIGHT VS TRIAL & ERROR (COGNITIVE MODEL)
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
            <div className="border border-red-300 rounded-2xl p-3 bg-red-50/30 text-center">
              <div className="text-red-700 font-extrabold text-sm mb-2 border-b border-red-200 pb-1">🐱 Trial & Error (Cat)</div>
              <div className="flex flex-col items-center space-y-1.5 text-xs">
                <span className="bg-white px-2 py-1 rounded border shadow-sm">Puzzle Box Locked</span>
                <span className="text-red-400 font-bold">⬇</span>
                <span className="bg-white px-2 py-1 rounded border shadow-sm text-red-650">Blind Blind Attempts</span>
                <span className="text-red-400 font-bold">⬇</span>
                <span className="bg-emerald-600 text-white px-2 py-1 rounded font-bold">Random Success</span>
              </div>
            </div>
            <div className="border border-blue-300 rounded-2xl p-3 bg-blue-50/30 text-center">
              <div className="text-blue-700 font-extrabold text-sm mb-2 border-b border-blue-200 pb-1">🦧 Insight (Sultan)</div>
              <div className="flex flex-col items-center space-y-1.5 text-xs">
                <span className="bg-white px-2 py-1 rounded border shadow-sm">Banana Out of Reach</span>
                <span className="text-blue-400 font-bold">⬇</span>
                <span className="bg-white px-2 py-1 rounded border shadow-sm text-blue-700">Cognitive Map Gap</span>
                <span className="text-blue-400 font-bold">⬇</span>
                <span className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-2.5 py-1 rounded-xl font-bold font-sans">Sudden 'Aha!' Moment</span>
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (title.includes('CAM') || title.includes('ATTAINMENT')) {
      return (
        <div key={drawIndex} className="my-6 mx-auto max-w-lg p-5 rounded-3xl border-2 border-rose-300 bg-amber-50/20 shadow-sm text-center font-handwritten">
          <div className="text-[10px] text-rose-500 font-bold uppercase tracking-widest border-b border-rose-200 pb-1 mb-4 select-none">
            📍 BRUNER'S CAM FLOW DIAGRAM
          </div>
          <div className="inline-flex flex-col items-center space-y-2 mt-2">
            <div className="bg-sky-50 border border-sky-400 rounded-2xl px-4 py-2 text-indigo-950 font-bold shadow-sm text-xs max-w-xs leading-snug">
              Phase 1: Present Labelled Examples <span className="block font-sans text-[10px] font-normal opacity-80">(Structured Yes / No pairs)</span>
            </div>
            <span className="text-rose-450 font-bold text-sm">▼</span>
            <div className="bg-purple-50 border border-purple-400 rounded-2xl px-4 py-2 text-indigo-950 font-bold shadow-sm text-xs max-w-xs leading-snug">
              Phase 2: Test Concept Attainment <span className="block font-sans text-[10px] font-normal opacity-80">(Students classify unlabeled cards)</span>
            </div>
            <span className="text-rose-450 font-bold text-sm">▼</span>
            <div className="bg-emerald-50 border border-emerald-400 rounded-2xl px-4 py-2 text-indigo-950 font-bold shadow-md text-xs max-w-xs leading-snug">
              Phase 3: Cognitive Analysis <span className="block font-sans text-[10px] font-normal opacity-80">(Audit active thinking strategies)</span>
            </div>
          </div>
        </div>
      );
    }

    if (title.includes('AOM') || title.includes('ORGANIZER')) {
      return (
        <div key={drawIndex} className="my-6 mx-auto max-w-lg p-5 rounded-3xl border-2 border-rose-300 bg-amber-50/20 shadow-sm relative font-handwritten">
          <div className="text-center text-[10px] text-rose-500 font-bold uppercase tracking-widest border-b border-rose-200 pb-1 mb-4 select-none">
            📍 AUSUBEL'S ADVANCE ORGANIZER MODEL
          </div>
          <div className="relative h-48 flex flex-col justify-between items-center pt-2">
            <div className="flex justify-between w-full space-x-2">
              <div className="bg-sky-50 border border-sky-400 p-2.5 rounded-2xl font-bold w-1/2 text-center text-blue-900 shadow-sm text-xs leading-tight">
                Prior Learner Cognitive Structures
              </div>
              <div className="bg-rose-50 border border-rose-300 p-2.5 rounded-2xl font-bold w-1/2 text-center text-rose-900 shadow-sm text-xs leading-tight">
                New Unfamiliar Syllabus Information
              </div>
            </div>
            {/* Hand-drawn connecting line */}
            <div className="absolute top-[38px] left-[20%] right-[20%] h-12 border-b-2 border-dashed border-red-400 rounded-b-3xl -z-10"></div>
            <div className="bg-gradient-to-r from-amber-200 to-yellow-200 border-2 border-amber-500 p-3 rounded-[15px_4px_15px_4px] font-extrabold w-8/12 text-center text-amber-950 shadow-md rotate-[-0.5deg]">
              ✨ ADVANCE ORGANIZER ✨
              <span className="block text-[10px] font-sans font-normal opacity-80 mt-1">Acts as a mental bridge linking old to new concepts</span>
            </div>
          </div>
        </div>
      );
    }

    if (title.includes('HECI') || title.includes('REGULATORY')) {
      return (
        <div key={drawIndex} className="my-6 mx-auto max-w-lg p-5 rounded-3xl border-2 border-rose-300 bg-amber-50/25 shadow-sm text-center font-handwritten">
          <div className="text-[10px] text-rose-500 font-bold uppercase tracking-widest border-b border-rose-200 pb-1 mb-4 select-none">
            📍 HECI REGULATORY VERTICAL DISSECTION
          </div>
          <div className="bg-gradient-to-r from-indigo-805 to-slate-900 bg-indigo-900 text-white rounded-2xl py-2 px-6 font-bold max-w-xs mx-auto shadow-md mb-5 text-xs text-center border border-indigo-700">
            🏛️ HECI UMBRELLA ORGAN SYSTEM
          </div>
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div className="bg-sky-50 border border-sky-300 p-2.5 rounded-2xl text-blue-950 font-bold leading-tight flex flex-col justify-center items-center shadow-inner">
              <span className="text-[14px]">⚖️</span>
              <span className="mt-1 font-bold">NHERC</span>
              <span className="text-[9px] font-sans font-normal text-slate-500 mt-0.5">Regulate (Licensing)</span>
            </div>
            <div className="bg-purple-50 border border-purple-300 p-2.5 rounded-2xl text-purple-950 font-bold leading-tight flex flex-col justify-center items-center shadow-inner">
              <span className="text-[14px]">⭐</span>
              <span className="mt-1 font-bold">NAC</span>
              <span className="text-[9px] font-sans font-normal text-slate-500 mt-0.5">Quality Assessment</span>
            </div>
            <div className="bg-emerald-50 border border-emerald-300 p-2.5 rounded-2xl text-emerald-950 font-bold leading-tight flex flex-col justify-center items-center shadow-inner">
              <span className="text-[14px]">🎯</span>
              <span className="mt-1 font-bold">GEC</span>
              <span className="text-[9px] font-sans font-normal text-slate-500 mt-0.5">Academic Standards</span>
            </div>
          </div>
        </div>
      );
    }

    // Default table / formula drawing block, but beautifully styled in handwriting font
    return (
      <div key={drawIndex} className="my-6 p-4 border-2 border-dashed border-rose-300 rounded-2xl bg-amber-50/20 ml-4 shadow-sm relative font-handwritten">
        <span className="font-handwritten text-xs font-bold text-rose-650 text-red-600 block uppercase tracking-wider mb-2 text-center border-b border-rose-200 pb-1">
          📌 {draw.title}
        </span>
        
        {draw.type === 'table' ? (
          <div className="font-handwritten text-xs sm:text-sm text-slate-800 whitespace-pre-wrap leading-relaxed bg-[#fbf9f1] p-3 rounded-xl border border-rose-200/50 shadow-inner">
            {draw.items.join('\n')}
          </div>
        ) : (
          <div className="font-handwritten text-xs sm:text-sm text-indigo-950 whitespace-pre-wrap leading-relaxed bg-[#fbf9f1] p-3 rounded-xl border border-rose-200/50 shadow-inner">
            {draw.items.join('\n')}
          </div>
        )}
      </div>
    );
  };

  return (
    <div id="notebook-reader-overlay" className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 animate-fadeIn select-none">
      <div id="notebook-reader-container" className="bg-slate-900 rounded-3xl w-full max-w-5xl shadow-2xl overflow-hidden border border-slate-800 flex flex-col h-[94vh]">
        
        {/* Top bar */}
        <div className="bg-slate-950 p-4 sm:px-6 border-b border-slate-800 flex items-center justify-between">
          <div className="flex flex-col">
            <div className="flex items-center space-x-2">
              <span className="text-[10px] uppercase font-bold bg-amber-500/10 text-amber-500 px-2.5 py-0.5 rounded-full border border-amber-500/20">
                {unit.examId.replace(/_/g, ' ')}
              </span>
              {isUnlocked ? (
                <span className="text-[10px] uppercase font-bold bg-emerald-500/10 text-emerald-450 text-emerald-400 px-2.5 py-0.5 rounded-full border border-emerald-500/20 flex items-center space-x-1">
                  <CheckCircle2 className="h-3 w-3" />
                  <span>Purchased & Full Unlocked</span>
                </span>
              ) : (
                <span className="text-[10px] uppercase font-bold bg-orange-500/10 text-orange-400 px-2.5 py-0.5 rounded-full border border-orange-500/20 flex items-center space-x-1">
                  <Eye className="h-3 w-3" />
                  <span>Free Demo Mode (Pages 12-15)</span>
                </span>
              )}
            </div>
            <h3 className="text-sm sm:text-base font-bold text-white mt-1 leading-tight tracking-tight">
              {unit.name}
            </h3>
          </div>
          
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* View Mode Toggle Switch - only shown if NO uploaded PDF exists */}
            {!unit.pdfUrl && (
              <div className="bg-slate-900 rounded-xl p-0.5 border border-slate-800 flex items-center">
                <button
                  onClick={() => setViewMode('scan')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1 transition-all ${
                    viewMode === 'scan'
                      ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                  title="View photorealistic handwritten scan of original PDF"
                >
                  <Layers className="h-3.5 w-3.5" />
                  <span className="hidden xs:inline">📷 Original Scan</span>
                </button>
                <button
                  onClick={() => setViewMode('pdf')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1 transition-all ${
                    viewMode === 'pdf'
                      ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                  title="View original uploaded PDF document directly"
                >
                  <span className="text-sm">📄</span>
                  <span>Original PDF</span>
                </button>
              </div>
            )}

            <button 
              onClick={onClose} 
              className="text-slate-400 hover:text-white bg-slate-900 hover:bg-slate-850 p-2 rounded-xl transition-all border border-slate-800 cursor-pointer"
              title="Close reader"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Core Screen */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-6 bg-slate-950 flex justify-center items-start lg:px-12 relative">
          
          {/* Notebook Bindings (Left margin coil styling for realistic 3D spiral notebook book) */}
          {viewMode === 'scan' && (
            <div className="absolute left-2 top-8 bottom-8 w-6 flex flex-col justify-between items-center z-30 pointer-events-none hidden md:flex">
              {Array.from({ length: 18 }).map((_, i) => (
                <div key={i} className="w-8 h-3.5 bg-gradient-to-r from-slate-400 via-slate-350 to-slate-250 border-r border-slate-500/50 rounded-full shadow-lg relative left-5">
                  <div className="absolute right-1 top-[20%] w-1.5 h-1.5 bg-slate-600 rounded-full opacity-60"></div>
                </div>
              ))}
            </div>
          )}

          <div className="w-full max-w-3xl relative shadow-2xl transition-all duration-300">
            
            {viewMode === 'pdf' ? (
              /* ================= 📄 ORIGINAL PDF VIEW ================= */
              <div className="bg-slate-900 w-full rounded-2xl p-1 shadow-2xl border border-slate-800 flex flex-col min-h-[650px] relative">
                {(isUnlocked || unit.pdfUrl) ? (
                  <div className="w-full flex-1 flex flex-col">
                    <div className="bg-slate-950 px-4 py-3 rounded-t-2xl border-b border-slate-800 flex items-center justify-between text-xs text-slate-400 font-mono">
                      <div className="flex items-center space-x-2">
                        {isUnlocked ? (
                          <span className="text-emerald-400 font-bold block animate-pulse">● Original PDF Document (Unlocked ✅)</span>
                        ) : (
                          <span className="text-amber-400 font-bold block animate-pulse">⚠️ Free Demo (Starting 4 Pages Preview)</span>
                        )}
                        <span className="text-slate-600">|</span>
                        <span className="truncate max-w-[200px] text-slate-300 font-bold" title={unit.pdfName}>{unit.pdfName || 'Attached_Syllabus.pdf'}</span>
                      </div>
                      <span className="bg-slate-900 px-2.5 py-1 rounded text-[10px] text-slate-400 border border-slate-800 font-bold">
                        {isUnlocked ? 'FULL ACCESS' : 'DEMO PREVIEW'}
                      </span>
                    </div>
                    {renderedPdfUrl ? (
                      <div className="w-full flex-1 flex flex-col">
                        {/* Interactive Warning banner with direct buy action when locked */}
                        {!isUnlocked ? (
                          <div className="bg-gradient-to-r from-amber-950/90 to-orange-950/90 text-amber-200 py-3 px-4 text-xs flex flex-col sm:flex-row items-center sm:justify-between border-b border-amber-900/40 gap-3">
                            <div className="flex items-center space-x-2">
                              <span>📢</span>
                              <span className="text-left leading-relaxed font-semibold font-sans">
                                <strong>आप अभी नोट्स की डेमो पीडीएफ (शुरुआती 4 पृष्ठ) देख रहे हैं।</strong> आगे के पृष्ठ और पूर्ण पीडीएफ डाउनलोड करने के लिए नोट्स खरीदें।
                              </span>
                            </div>
                            <button
                              onClick={() => onBuy(unit)}
                              className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 active:scale-[0.98] text-white font-extrabold px-4 py-2 rounded-xl transition-all text-xs flex items-center space-x-1 shadow-lg shadow-orange-500/20 cursor-pointer"
                            >
                              <span>Buy Full PDF (₹{unit.price})</span>
                              <span className="text-sm">🔓</span>
                            </button>
                          </div>
                        ) : (
                          <div className="bg-[#1e293b] text-amber-200 py-2.5 px-4 text-xs flex flex-col sm:flex-row items-center sm:justify-between border-b border-slate-800 gap-3">
                            <div className="flex items-center space-x-2">
                              <span>💡</span>
                              <span className="text-left leading-relaxed">
                                <strong>Friendly Reader Tip:</strong> If the document pane below does not render or scroll correctly on your browser/phone, click <strong>"Open PDF in New Window"</strong> to view or print natively.
                              </span>
                            </div>
                            <div className="flex items-center space-x-2 shrink-0">
                              <a 
                                href={renderedPdfUrl} 
                                target="_blank" 
                                rel="noreferrer"
                                className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-3 py-1.5 rounded-lg transition-all text-xs flex items-center space-x-1"
                              >
                                <span>Open PDF in New Window</span>
                                <span className="text-[10px]">↗</span>
                              </a>
                              <button
                                onClick={handlePrint}
                                className="bg-slate-800 hover:bg-slate-700 text-slate-100 font-semibold px-3 py-1.5 rounded-lg border border-slate-700 transition-all text-xs flex items-center space-x-1"
                              >
                                <span>Save PDF</span>
                                <span>💾</span>
                              </button>
                            </div>
                          </div>
                        )}
                        <iframe 
                          src={renderedPdfUrl} 
                          className="w-full h-[650px] rounded-b-2xl bg-slate-950 border-none"
                          title="Original Scanned PDF Doc"
                        />
                      </div>
                    ) : (
                      <div className="flex-1 flex flex-col items-center justify-center p-12 text-center text-slate-400 h-[600px] bg-slate-950 rounded-b-2xl">
                        <span className="text-5xl mb-4">📄</span>
                        <h4 className="text-lg font-bold text-white mb-2">No Original PDF Uploaded Yet</h4>
                        <p className="text-sm text-slate-400 max-w-md bg-slate-900 p-4 border border-slate-800 rounded-xl">
                          Please go to the Admin Panel, select "Inventory management" and "Attach/Update PDF" to link a high-fidelity PDF copy book note to this unit block.
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center p-8 sm:p-12 text-center bg-slate-950 rounded-2xl border border-slate-850 h-[600px]">
                    <div className="bg-amber-500/10 p-5 rounded-full border border-amber-500/20 mb-5 animate-pulse">
                      <Lock className="h-10 w-10 text-amber-500" />
                    </div>
                    <h4 className="text-xl sm:text-2xl font-bold text-white mb-3 font-display">
                      Original PDF Document Locked 🔒
                    </h4>
                    <p className="text-slate-400 text-sm max-w-md mb-8 leading-relaxed">
                      To safeguard proprietary handwritten notes, viewing/downloading the complete original PDF document requires a one-time purchase of this unit note.
                    </p>
                    <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4 w-full max-w-sm justify-center">
                      <button
                        onClick={() => onBuy(unit)}
                        className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white py-3 px-6 rounded-2xl font-bold shadow-lg shadow-orange-500/25 hover:scale-[1.02] transition-all cursor-pointer text-sm"
                      >
                        Buy Full PDF Note (₹20)
                      </button>
                      <button
                        onClick={() => setViewMode('scan')}
                        className="bg-slate-900 hover:bg-slate-850 text-slate-350 py-3 px-6 rounded-2xl font-semibold border border-slate-800 transition-all cursor-pointer text-sm"
                      >
                        Read Free Demo
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* ================= 📷 PHOTOREALISTIC COPIED SCAN VIEW ================= */
              <div className="relative bg-[#faf7ef] text-slate-800 rounded-3xl shadow-2xl overflow-hidden border border-amber-100 p-5 sm:p-10 md:pl-16 min-h-[750px] flex flex-col justify-between select-text selection:bg-rose-200/50">
                
                {/* Punch Holes for spiral bound feel */}
                <div className="absolute left-[1.25rem] top-6 bottom-6 w-3 flex flex-col justify-between items-center opacity-70 z-25 pointer-events-none hidden md:flex">
                  {Array.from({ length: 18 }).map((_, i) => (
                    <div key={i} className="w-3.5 h-3.5 bg-slate-950 rounded-full border border-amber-200 shadow-inner" />
                  ))}
                </div>

                {/* Vertical Ruled Left Red Margin lines (traditional notebook) */}
                <div className="absolute top-0 bottom-0 left-[2.85rem] w-[1.5px] bg-rose-400 opacity-60 pointer-events-none hidden md:block" />
                <div className="absolute top-0 bottom-0 left-[2.95rem] w-[1px] bg-rose-300 opacity-45 pointer-events-none hidden md:block" />

                {/* Top double lines */}
                <div className="absolute top-[4.75rem] left-0 right-0 h-[2px] bg-rose-400 opacity-55 pointer-events-none hidden md:block" />
                <div className="absolute top-[4.9rem] left-0 right-0 h-[10px] border-b border-rose-300 opacity-40 pointer-events-none hidden md:block" />

                {/* Simulated Ruled notebook paper background lines */}
                <div className="absolute inset-0 bg-notebook-lines opacity-12 pointer-events-none z-0" 
                     style={{ 
                       backgroundImage: 'linear-gradient(#475569 1px, transparent 1px)', 
                       backgroundSize: '100% 2.375rem', 
                       backgroundPosition: '0 5rem' 
                     }} 
                />

                {/* Genuine scan watermark branding */}
                <div className="absolute inset-0 flex items-center justify-center opacity-[0.025] pointer-events-none origin-center -rotate-12 z-0">
                  <span className="font-display font-black text-slate-950 border-8 border-slate-950 px-12 py-5 rounded-3xl text-6xl uppercase tracking-widest leading-none">
                    HandScript Notes PDF Original Scanned
                  </span>
                </div>

                <div className="z-10 relative">
                  
                  {/* Copybook Classwork Header Section */}
                  <div className="flex justify-between items-center text-rose-500 font-handwritten text-xs border-b border-rose-300 pb-1 mb-8 pr-2">
                    <div className="flex items-center space-x-1 pl-4 md:pl-0">
                      <span>Subject:</span>
                      <span className="border-b border-dashed border-rose-300 w-32 sm:w-48 inline-block pl-2 text-blue-850 font-bold select-none text-[13px] leading-none">
                        {isPedagogy1 ? 'Pedagogy & Learning Theories' : 'Technical Syllabus'}
                      </span>
                    </div>
                    <div className="border border-rose-400/85 rounded-lg p-1.5 flex flex-col items-start bg-white shadow-sm font-semibold text-[10px] scale-90 sm:scale-100 origin-right leading-none space-y-1">
                      <div className="flex items-center space-x-1">
                        <span className="text-rose-500 text-[9px] uppercase font-bold">Exam Key:</span>
                        <span className="font-bold text-blue-800 w-16 border-b border-rose-200 inline-block text-center select-none">{unit.examId}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <span className="text-rose-500 text-[9px] uppercase font-bold">Page No:</span>
                        <span className="font-bold text-red-650 inline-block text-center select-none pr-1 pl-1 text-[11px] font-sans bg-rose-50 rounded italic">{pageInfo.pageNumber}</span>
                      </div>
                    </div>
                  </div>

                  {/* Note Title inside paper */}
                  <div className="pb-3 text-center mb-6 pl-4 md:pl-0 font-handwritten">
                    <div className="inline-block relative">
                      <h4 className="text-xl sm:text-2xl font-bold text-blue-900 border-b-[2.5px] border-double border-red-500 pb-1 leading-snug px-3 mb-1">
                        {pageInfo.title || `Unit ${unit.unitNumber} Notes — Section ${pageInfo.pageNumber}`}
                      </h4>
                      <div className="h-[1px] bg-red-400 w-11/12 mx-auto" />
                    </div>
                  </div>

                  {/* Handwritten ink lines content */}
                  <div className="space-y-2 sm:space-y-4 pt-2 pb-6 pl-4 md:pl-0 font-handwritten min-h-[440px]">
                    {pageInfo.paragraphs.map((p, idx) => renderHandwrittenLine(p, idx))}
                  </div>

                  {/* Structured Hand-Drawn graphic schemas inside original copybooks */}
                  {pageInfo.drawings && pageInfo.drawings.length > 0 && (
                    <div className="mt-8 mb-6 pl-4 md:pl-0">
                      {pageInfo.drawings.map((draw, idx) => renderHandwrittenDrawings(draw, idx))}
                    </div>
                  )}

                </div>

                {/* Stamped Teacher / Student Hand-Signed Validation */}
                <div className="mt-8 pt-3 border-t border-rose-200 flex justify-between items-center text-xs text-rose-500 font-handwritten pl-4 md:pl-0 relative z-10 selection:bg-transparent">
                  <div className="flex flex-col items-start leading-tight">
                    <span className="text-[9px] text-rose-400 uppercase tracking-widest">Compiler Signature</span>
                    <span className="font-handwritten text-sm sm:text-base text-blue-800 font-bold rotate-[-3.5deg] ml-1 mt-1 select-none animate-fadeIn font-semibold">
                      ✍️ Subhash Kumar
                    </span>
                  </div>
                  <div className="flex flex-col items-end leading-tight">
                    <span className="text-[9px] text-rose-400 uppercase tracking-widest pl-1">Status Verification</span>
                    <span className="font-sans text-[10px] font-extrabold text-emerald-600/80 border border-emerald-400/40 rounded px-2.5 py-0.5 mt-1 rotate-[-1.5deg] bg-emerald-500/10 uppercase tracking-wider select-none flex items-center space-x-1">
                      <Check className="h-3 w-3 inline" />
                      <span>Verified Syllabus Matching</span>
                    </span>
                  </div>
                </div>

              </div>
            )}

            {/* Locked Page prompt (triggers when hitting the end of free preview) */}
            {!isUnlocked && currentPageIndex === totalPages - 1 && (
              <div className="absolute inset-0 bg-slate-950/95 rounded-3xl flex flex-col items-center justify-center p-6 text-center z-45 backdrop-blur-[4px] border border-slate-850">
                <div className="bg-amber-500/15 p-5 rounded-full border border-amber-500/30 mb-4 animate-pulse">
                  <Lock className="h-9 w-9 text-amber-500" />
                </div>
                <h4 className="text-xl sm:text-2xl font-bold text-white mb-2 font-display">
                  Syllabus PDF Deep-Dive Locked 🔒
                </h4>
                <p className="text-slate-400 text-sm max-w-md mb-6 leading-relaxed">
                  You have finished reading the free demo preview of this unit. Get instant, lifetime access to all <b>40 pages</b> of this verified handmade note for just <b>₹20</b>!
                </p>
                <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3 w-full max-w-md">
                  <button
                    onClick={() => onBuy(unit)}
                    className="flex-1 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white py-3 px-6 rounded-2xl font-bold shadow-lg shadow-orange-500/20 hover:scale-[1.02] transition-all cursor-pointer text-sm"
                  >
                    Buy Full Unit Note (₹20)
                  </button>
                  <button
                    onClick={() => setCurrentPageIndex(0)}
                    className="bg-slate-900 hover:bg-slate-850 text-slate-300 py-3 px-6 rounded-2xl font-semibold border border-slate-800 transition-all cursor-pointer text-sm"
                  >
                    Review Demo Again
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>

        {/* Bottom control navigation bar */}
        <div className="bg-slate-950 p-4 sm:px-6 border-t border-slate-800 flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:items-center sm:justify-between">
          
          {viewMode === 'scan' ? (
            <div className="flex items-center space-x-3 justify-center">
              <button
                onClick={handlePrev}
                disabled={currentPageIndex === 0}
                className={`p-2 rounded-xl transition-all border duration-150 cursor-pointer ${
                  currentPageIndex === 0
                    ? 'border-slate-900 text-slate-700 bg-slate-950 cursor-not-allowed'
                    : 'border-slate-800 text-slate-300 bg-slate-900 hover:bg-slate-800 shadow-sm'
                }`}
                title="Previous Page"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <span className="text-xs sm:text-sm font-semibold font-mono text-slate-400">
                Page <span className="text-white font-bold bg-slate-900 border border-slate-800 px-2.5 py-1 rounded-lg text-sm select-none">{pageInfo.pageNumber}</span> of {isPedagogy1 ? 40 : (isUnlocked ? unit.fullPages.length : unit.demoPages.length)}
              </span>
              <button
                onClick={handleNext}
                disabled={currentPageIndex === totalPages - 1 && isUnlocked}
                className={`p-2 rounded-xl transition-all border duration-150 cursor-pointer ${
                  currentPageIndex === totalPages - 1 && isUnlocked
                    ? 'border-slate-900 text-slate-700 bg-slate-950 cursor-not-allowed'
                    : 'border-slate-800 text-slate-300 bg-slate-900 hover:bg-slate-800 shadow-sm'
                }`}
                title="Next Page"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          ) : (
            <div className="text-center font-sans">
              {isUnlocked ? (
                <span className="text-emerald-400 text-xs sm:text-sm font-bold bg-emerald-950/40 border border-emerald-900/30 px-3 py-1.5 rounded-xl block animate-fadeIn">
                  ✓ Full PDF Unlocked • Scroll inside the box to read all pages
                </span>
              ) : (
                <span className="text-amber-400 text-xs sm:text-sm font-bold bg-amber-950/40 border border-amber-900/30 px-3 py-1.5 rounded-xl block animate-fadeIn">
                  ⚠️ Demo Mode • Showing starting 4 pages only
                </span>
              )}
            </div>
          )}

          <div className="flex items-center space-x-3 justify-center">
            {isUnlocked ? (
              <button
                onClick={handlePrint}
                className="bg-emerald-650 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs sm:text-sm px-4.5 py-2.5 rounded-xl transition-all flex items-center space-x-1.5 cursor-pointer shadow-md"
              >
                <Printer className="h-4 w-4" />
                <span>Save Original Scanned PDF</span>
              </button>
            ) : (
              <button
                onClick={() => onBuy(unit)}
                className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-xs sm:text-sm px-5 py-2.5 rounded-xl shadow-lg shadow-orange-500/15 transition-all hover:scale-[1.02] flex items-center space-x-1.5 cursor-pointer"
              >
                <Lock className="h-4 w-4" />
                <span>Unlock All 40 Pages (₹20)</span>
              </button>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}
