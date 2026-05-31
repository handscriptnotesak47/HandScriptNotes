/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BookOpen, Award, Clock, Download, ArrowRight, Library, FileText, CheckCircle, Flame, Sparkles } from 'lucide-react';
import { UserSession, NotesUnit, PurchaseRecord } from '../types';

interface UserDashboardProps {
  user: UserSession;
  allNotes: NotesUnit[];
  purchases: PurchaseRecord[];
  onOpenNote: (unit: NotesUnit) => void;
  onExploreNotes: () => void;
}

export default function UserDashboard({ user, allNotes, purchases, onOpenNote, onExploreNotes }: UserDashboardProps) {
  
  // Filter notes that matches the purchased list
  const purchasedNotes = allNotes.filter(n => user.purchasedUnitIds.includes(n.id));
  
  // Also filter static pre-seeded purchases corresponding to the logged in user
  const userPurchases = purchases.filter(p => p.email === user.email);

  return (
    <div id="user-portal" className="max-w-7xl mx-auto py-6 px-4 sm:px-6 animate-fadeIn text-slate-800">
      
      {/* Student welcome banner card Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8 text-left">
        
        {/* Welcome card */}
        <div className="bg-gradient-to-br from-slate-50 to-slate-100 p-6 rounded-3xl border border-slate-200 lg:col-span-2 flex flex-col justify-between shadow-sm relative overflow-hidden">
          {/* Accent circles floating */}
          <div className="absolute -right-16 -top-16 w-36 h-36 rounded-full bg-brand-orange/5 border border-brand-orange/10 pointer-events-none" />
          
          <div className="space-y-2 z-10">
            <div className="flex items-center space-x-2">
              <span className="bg-orange-50 text-brand-orange text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border border-orange-200 flex items-center space-x-1">
                <Flame className="h-3 w-3 animate-pulse" />
                <span>Preparation Mode Active</span>
              </span>
            </div>
            <h2 className="text-2xl font-extrabold text-slate-900 font-display">
              Welcome Back, {user.name}! 🎓
            </h2>
            <p className="text-slate-600 text-xs leading-relaxed max-w-xl">
              Track your downloaded notes, read handwritten units on our interactive spiral copybook, and refine your exam strategy dynamically.
            </p>
          </div>

          <div className="flex flex-wrap gap-4 mt-6 z-10">
            <div className="bg-white py-2 px-4 rounded-xl border border-slate-200 flex items-center space-x-2 shadow-sm">
              <Library className="h-4 w-4 text-brand-orange" />
              <span className="text-xs text-slate-700">
                Unlocked Notes: <b className="text-slate-900 font-black">{purchasedNotes.length} Units</b>
              </span>
            </div>
            <div className="bg-white py-2 px-4 rounded-xl border border-slate-200 flex items-center space-x-2 shadow-sm">
              <Flame className="h-4 w-4 text-amber-500" />
              <span className="text-xs text-slate-700">
                Revision Streak: <b className="text-slate-900 font-black">5 Days</b>
              </span>
            </div>
          </div>
        </div>

        {/* Analytics Card */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 flex flex-col justify-between shadow-sm relative overflow-hidden">
          <div className="space-y-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 block border-b border-slate-100 pb-2">
              Revision Insights
            </span>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500">Syllabus Covered</span>
                <span className="font-mono font-bold text-slate-900 font-black">
                  {Math.round((purchasedNotes.length / (allNotes.length || 1)) * 100)}%
                </span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden border border-slate-200">
                <div 
                  className="bg-brand-orange h-full rounded-full transition-all duration-300"
                  style={{ width: `${Math.max(4, Math.round((purchasedNotes.length / (allNotes.length || 1)) * 100))}%` }}
                />
              </div>
            </div>
          </div>

          <div className="mt-4 p-3 bg-slate-50 rounded-xl text-[11px] text-slate-500 leading-relaxed border border-slate-100">
            💡 <b>EXAM TIP:</b> Regular visual review of handwritten equations shown on real ruled mock sheets can boost retention by as much as 3x during final MCQs!
          </div>
        </div>

      </div>

      {/* Segment 2: My Library List */}
      <div className="space-y-4 text-left">
        <div className="flex items-center justify-between pb-2 border-b border-slate-200">
          <div className="flex items-center space-x-2 font-display">
            <Library className="h-5 w-5 text-brand-orange" />
            <h3 className="font-display font-extrabold text-lg text-slate-900">My Unlocked Study Folder</h3>
          </div>
          <span className="text-xs text-slate-550 font-semibold font-mono">
            {purchasedNotes.length} of {allNotes.length} Units Purchased
          </span>
        </div>

        {purchasedNotes.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-3xl p-10 text-center space-y-4 shadow-sm">
            <div className="bg-orange-50 p-4 rounded-full border border-orange-200 inline-block">
              <BookOpen className="h-8 w-8 text-brand-orange" />
            </div>
            <div className="space-y-1.5">
              <h4 className="font-display font-bold text-lg text-slate-900">Your Study Folder is Empty 📚</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                You haven't unlocked any unit-wise handwritten notes yet. Browse the categories to access ₹20 premium exam templates.
              </p>
            </div>
            <button
              onClick={onExploreNotes}
              className="bg-brand-orange hover:bg-brand-orange-hover text-white font-bold py-2.5 px-6 rounded-2xl text-xs flex items-center space-x-1.5 mx-auto transition-all cursor-pointer shadow-md shadow-brand-orange/15"
            >
              <span>Browse Notes Now</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {purchasedNotes.map((unit) => (
              <div 
                key={unit.id} 
                className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-slate-300 transition-all flex flex-col justify-between space-y-4 group relative shadow-md"
              >
                <div className="space-y-2">
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] bg-slate-50 text-amber-700 uppercase font-bold font-mono px-2 py-0.5 rounded border border-slate-200">
                      {unit.examId.replace(/_/g, ' ')}
                    </span>
                    <span className="text-xs text-slate-500 font-bold font-mono">₹20 Paid</span>
                  </div>
                  <h4 className="font-display font-bold text-slate-900 group-hover:text-brand-orange transition-colors leading-tight">
                    {unit.name}
                  </h4>
                  <p className="text-xs text-slate-500 leading-relaxed truncate">
                    {unit.shortDescription}
                  </p>
                </div>

                <div className="flex space-x-2 pt-2 border-t border-slate-100">
                  <button
                    onClick={() => onOpenNote(unit)}
                    className="flex-1 bg-brand-orange hover:bg-brand-orange-hover text-white py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1.5 cursor-pointer shadow-md"
                  >
                    <BookOpen className="h-4.5 w-4.5" />
                    <span>Open Interactive Note</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Segment 3: Transaction List / Downloads history */}
      {userPurchases.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 text-left mt-8 space-y-4 shadow-md">
          <div className="border-b border-slate-100 pb-2 flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <FileText className="h-5 w-5 text-teal-600" />
              <span className="font-display font-bold text-base text-slate-900">Student Payment History</span>
            </div>
            <span className="text-[10px] text-slate-400 font-mono tracking-wide uppercase">Secure Ledger</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-slate-655">
              <thead>
                <tr className="border-b border-slate-100 text-slate-500 uppercase tracking-widest text-[9px] font-mono">
                  <th className="pb-2.5 text-left">Order Ref ID</th>
                  <th className="pb-2.5 text-left">Unit Title purchased</th>
                  <th className="pb-2.5 text-right">Channel</th>
                  <th className="pb-2.5 text-right font-display">Amount Paid</th>
                  <th className="pb-2.5 text-right">Timing logged</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {userPurchases.map((rec) => (
                  <tr key={rec.orderId} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 font-mono text-amber-600 font-bold">{rec.orderId}</td>
                    <td className="py-3">
                      <div className="flex flex-col text-left">
                        <span className="font-bold text-slate-900">{rec.unitName}</span>
                        <span className="text-[10px] text-slate-500 font-mono uppercase">{rec.examId}</span>
                      </div>
                    </td>
                    <td className="py-3 text-right">
                      <span className="bg-slate-50 border border-slate-200 text-slate-600 text-[10px] px-2 py-0.5 rounded font-mono shadow-sm">
                        {rec.paymentMethod}
                      </span>
                    </td>
                    <td className="py-3 text-right font-extrabold text-slate-900">₹{rec.price}.00</td>
                    <td className="py-3 text-right text-slate-500">{new Date(rec.timestamp).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
}
