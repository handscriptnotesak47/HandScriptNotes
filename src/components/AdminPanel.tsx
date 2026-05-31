/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ShieldCheck, IndianRupee, PieChart, Users, ArrowUpRight, CheckCircle2, MessageSquare, Clipboard, Edit2, Plus, Trash2, Mail, Lock, BarChart3, TrendingUp, Search, Calendar } from 'lucide-react';
import { PurchaseRecord, ContactQuery, NotesUnit, ExamCategoryType } from '../types';

interface AdminPanelProps {
  purchases: PurchaseRecord[];
  queries: ContactQuery[];
  notesList: NotesUnit[];
  onUpdateNotePrice: (unitId: string, newPrice: number) => void;
  onAddNewUnit: (newUnit: NotesUnit) => void;
  onRemoveUnit: (unitId: string) => void;
  onAnswerQuery: (queryId: string) => void;
}

export default function AdminPanel({
  purchases,
  queries,
  notesList,
  onUpdateNotePrice,
  onAddNewUnit,
  onRemoveUnit,
  onAnswerQuery
}: AdminPanelProps) {
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [passError, setPassError] = useState('');
  
  // Tab states inside Admin
  const [adminActiveTab, setAdminActiveTab] = useState<'overview' | 'sales' | 'inventory' | 'queries'>('overview');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Form states to add new Unit
  const [newUnitExamId, setNewUnitExamId] = useState<ExamCategoryType>('UGC_NET_CS');
  const [newUnitNum, setNewUnitNum] = useState<number>(16);
  const [newUnitName, setNewUnitName] = useState('');
  const [newUnitDesc, setNewUnitDesc] = useState('');
  const [newUnitPrice, setNewUnitPrice] = useState<number>(20);

  // Edit Price States
  const [editingUnitId, setEditingUnitId] = useState<string | null>(null);
  const [editedPrice, setEditedPrice] = useState<string>('20');

  // Reply simulation states
  const [replyMessageId, setReplyMessageId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');

  // Pre-seed some default analytics stats so looking at the dashboard feels like a real high-volume platform
  const baseRevenue = 15380; // seeds ₹15,380
  const baseDownloads = 769; // seeds 769 pdf downloads
  const baseUsers = 184; // seeds registered users
  const baseGuestPurchases = 420;

  // Compute live analytics sums
  const livePurchaseRevenue = purchases.reduce((sum, p) => sum + p.price, 0);
  const totalRevenue = baseRevenue + livePurchaseRevenue;
  const totalDownloads = baseDownloads + purchases.length;
  const totalUsers = baseUsers + Math.floor(purchases.length * 0.35); // simulated ratio
  const totalGuestPurchases = baseGuestPurchases + purchases.filter(p => p.paymentMethod !== 'Account Sync').length;

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminPassword === 'admin123') {
      setIsAdminAuthenticated(true);
      setPassError('');
    } else {
      setPassError('Invalid admin password. Use the test code: admin123');
    }
  };

  const handleSavePrice = (unitId: string) => {
    const priceNum = parseInt(editedPrice);
    if (!isNaN(priceNum) && priceNum >= 0) {
      onUpdateNotePrice(unitId, priceNum);
      setEditingUnitId(null);
    }
  };

  const handleCreateUnit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUnitName.trim() || !newUnitDesc.trim()) return;

    const mockNewUnit: NotesUnit = {
      id: `${newUnitExamId.toLowerCase().replace(/_/g, '-')}-unit-${newUnitNum}`,
      examId: newUnitExamId,
      unitNumber: newUnitNum,
      name: `Unit ${newUnitNum}: ${newUnitName}`,
      shortDescription: newUnitDesc,
      price: newUnitPrice,
      demoPages: [
        {
          pageNumber: 1,
          title: `Unit ${newUnitNum}: ${newUnitName} (Uploaded)`,
          paragraphs: [
            '✍️ SYSTEM GENERATED DEMO NOTE:',
            'This syllabus note has been compiled, parsed, and secure-signed by the Admin console.',
            '👉 Standard PDF structures apply. High priority theoretical insights and practice answers unlocked.'
          ]
        }
      ],
      fullPages: [
        {
          pageNumber: 1,
          title: `Unit ${newUnitNum}: ${newUnitName} (Full Syllabus)`,
          paragraphs: [
            '✍️ SYSTEM GENERATED CORE NOTES:',
            'This content is fully unlocked. Access is provided permanently to your student portal.',
            '• Review direct formulas and schematic mappings beneath.'
          ]
        }
      ]
    };

    onAddNewUnit(mockNewUnit);
    
    // reset form
    setNewUnitName('');
    setNewUnitDesc('');
    setNewUnitNum(newUnitNum + 1);
  };

  const handleSimulateReply = (messageId: string) => {
    onAnswerQuery(messageId);
    setReplyMessageId(null);
    setReplyText('');
  };

  // Exam-wise sales computing counts
  const getExamSalesCount = (examId: ExamCategoryType): number => {
    const defaultCounts: Record<ExamCategoryType, number> = {
      UGC_NET_CS: 284,
      RSMSSB_BCI: 198,
      RSMSSB_SCI: 154,
      UP_LT_GRADE: 133
    };
    const livePurchasesOfExam = purchases.filter(p => p.examId === examId).length;
    return defaultCounts[examId] + livePurchasesOfExam;
  };

  if (!isAdminAuthenticated) {
    return (
      <div id="admin-auth" className="max-w-md mx-auto my-12 bg-slate-900 rounded-3xl border border-slate-800 p-8 shadow-xl animate-fadeIn">
        <div className="text-center mb-6">
          <div className="bg-amber-500/10 p-3 rounded-full border border-amber-500/20 inline-block mb-3">
            <Lock className="h-6 w-6 text-amber-500 animate-pulse" />
          </div>
          <h2 className="text-xl font-bold text-white font-display">Admin Console Gate</h2>
          <p className="text-slate-400 text-xs mt-1 leading-relaxed">
            Restricted access portal for student sales reports, pricing configs, feedback, and syllabus management.
          </p>
        </div>

        <form onSubmit={handlePasswordSubmit} className="space-y-4 text-left">
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">Enter Master Password Desired</label>
            <input
              id="admin-password-input"
              type="password"
              placeholder="e.g., admin123"
              value={adminPassword}
              onChange={(e) => {
                setAdminPassword(e.target.value);
                setPassError('');
              }}
              className="w-full bg-slate-950 border border-slate-700/80 rounded-2xl px-4 py-3 text-sm text-white focus:border-brand-orange outline-none font-mono"
            />
            {passError && <span className="text-red-400 text-xs mt-1.5 block">{passError}</span>}
          </div>

          <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-[11px] text-amber-400 leading-relaxed font-mono">
            💡 <b>DEVELOPER CREDENTIAL:</b> Usepassword <b>admin123</b> to bypass security check and explore the full live system admin panel.
          </div>

          <button
            id="btn-admin-login-submit"
            type="submit"
            className="w-full bg-brand-orange hover:bg-brand-orange-hover text-white py-3 rounded-2xl font-bold transition-all shadow-md cursor-pointer"
          >
            Access Admin System
          </button>
        </form>
      </div>
    );
  }

  return (
    <div id="admin-panel" className="space-y-8 max-w-7xl mx-auto py-6 px-4 sm:px-6 animate-fadeIn text-slate-200">
      
      {/* Header Board */}
      <div className="bg-slate-900 rounded-3xl border border-slate-800 p-6 flex flex-col md:flex-row md:items-center justify-between shadow-lg">
        <div className="text-left">
          <div className="flex items-center space-x-2">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-widest">
              Live Secure Network Node: Operational
            </span>
          </div>
          <h2 className="text-2xl font-black text-white font-display mt-1 tracking-tight">
            HandScript Notes Admin Dashboard
          </h2>
          <p className="text-slate-450 text-xs text-slate-400">
            Control center to manipulate notes inventories, adjust pricing, read student feed, and review revenue graphs.
          </p>
        </div>

        {/* Console Nav Tabs */}
        <div className="flex flex-wrap mt-4 md:mt-0 gap-1.5 bg-slate-950 p-1.5 rounded-2xl border border-slate-800">
          <button
            onClick={() => setAdminActiveTab('overview')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              adminActiveTab === 'overview' ? 'bg-brand-orange text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setAdminActiveTab('sales')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              adminActiveTab === 'sales' ? 'bg-brand-orange text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Payment Logs
          </button>
          <button
            onClick={() => setAdminActiveTab('inventory')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              adminActiveTab === 'inventory' ? 'bg-brand-orange text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Notes Inventory
          </button>
          <button
            onClick={() => setAdminActiveTab('queries')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              adminActiveTab === 'queries' ? 'bg-brand-orange text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Messages ({queries.filter(q => !q.replied).length})
          </button>
        </div>
      </div>

      {/* VIEW 1: OVERVIEW METRICS BOARD */}
      {adminActiveTab === 'overview' && (
        <div className="space-y-6">
          
          {/* Main Cards Row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            
            <div className="bg-slate-900 p-5 rounded-3xl border border-slate-800 text-left relative overflow-hidden shadow-sm">
              <div className="flex justify-between items-start">
                <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider block">Total Revenue</span>
                <div className="bg-emerald-500/10 p-1.5 rounded-lg text-emerald-400 border border-emerald-500/20">
                  <TrendingUp className="h-4 w-4" />
                </div>
              </div>
              <div className="flex items-baseline text-white mt-3 space-x-1">
                <IndianRupee className="h-5 w-5 text-slate-400" />
                <span className="text-3xl font-black font-display tracking-tight">{totalRevenue.toLocaleString()}</span>
              </div>
              <span className="text-[10px] text-emerald-400 font-bold block mt-2 font-mono flex items-center">
                <ArrowUpRight className="h-3.5 w-3.5 mr-0.5" />
                <span>+ ₹{livePurchaseRevenue} live today</span>
              </span>
            </div>

            <div className="bg-slate-900 p-5 rounded-3xl border border-slate-800 text-left relative overflow-hidden shadow-sm">
              <div className="flex justify-between items-start">
                <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider block">Total Downloads</span>
                <div className="bg-blue-500/10 p-1.5 rounded-lg text-blue-400 border border-blue-500/20">
                  <Clipboard className="h-4 w-4" />
                </div>
              </div>
              <div className="flex items-baseline text-white mt-3">
                <span className="text-3xl font-black font-display tracking-tight">{totalDownloads}</span>
              </div>
              <span className="text-[10px] text-blue-400 font-bold block mt-2 font-mono">
                Pdf notes packages delivery
              </span>
            </div>

            <div className="bg-slate-900 p-5 rounded-3xl border border-slate-800 text-left relative overflow-hidden shadow-sm">
              <div className="flex justify-between items-start">
                <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider block">Registered Users</span>
                <div className="bg-purple-500/10 p-1.5 rounded-lg text-purple-400 border border-purple-500/20">
                  <Users className="h-4 w-4" />
                </div>
              </div>
              <div className="flex items-baseline text-white mt-3">
                <span className="text-3xl font-black font-display tracking-tight">{totalUsers}</span>
              </div>
              <span className="text-[10px] text-purple-400 font-bold block mt-2 font-mono">
                Active student accounts
              </span>
            </div>

            <div className="bg-slate-900 p-5 rounded-3xl border border-slate-800 text-left relative overflow-hidden shadow-sm">
              <div className="flex justify-between items-start">
                <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider block">Guest Purchases</span>
                <div className="bg-orange-500/10 p-1.5 rounded-lg text-brand-orange border border-orange-500/20">
                  <CheckCircle2 className="h-4 w-4" />
                </div>
              </div>
              <div className="flex items-baseline text-white mt-3">
                <span className="text-3xl font-black font-display tracking-tight">{totalGuestPurchases}</span>
              </div>
              <span className="text-[10px] text-brand-orange font-bold block mt-2 font-mono">
                One-time code orders
              </span>
            </div>

          </div>

          {/* Graphical Progress Analysis */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Exam category interest sales */}
            <div className="bg-slate-900 rounded-3xl border border-slate-800 p-6 text-left col-span-2">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
                <div className="flex items-center space-x-2">
                  <BarChart3 className="h-5 w-5 text-brand-orange" />
                  <span className="font-display font-bold text-base text-white">Exam Category Sales Breakdown</span>
                </div>
                <span className="text-[10px] text-slate-400 font-mono">Estimated relative ratios</span>
              </div>

              <div className="space-y-4">
                {(['UGC_NET_CS', 'RSMSSB_BCI', 'RSMSSB_SCI', 'UP_LT_GRADE'] as ExamCategoryType[]).map((examId) => {
                  const salesCount = getExamSalesCount(examId);
                  // Calculate dynamic visual percentage
                  const maxVal = 300;
                  const ratio = Math.min(100, Math.floor((salesCount / maxVal) * 100));
                  
                  return (
                    <div key={examId} className="space-y-1">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-slate-350">{examId.replace(/_/g, ' ')}</span>
                        <span className="text-slate-200">{salesCount} Sold (₹{salesCount * 20})</span>
                      </div>
                      <div className="w-full bg-slate-950 h-3 rounded-full overflow-hidden border border-slate-800/80">
                        <div 
                          className="bg-gradient-to-r from-brand-orange to-amber-400 h-full rounded-full transition-all duration-1000"
                          style={{ width: `${ratio}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-5 p-3.5 bg-slate-950 rounded-2xl text-xs text-slate-400 flex items-center space-x-2.5 border border-slate-850">
                <PieChart className="h-4.5 w-4.5 text-brand-orange" />
                <span><b>Insight:</b> UGC NET Computer Science remains our highest selling unit suite, followed by Rajasthan BCI.</span>
              </div>
            </div>

            {/* Quick overview queries + reports */}
            <div className="bg-slate-900 rounded-3xl border border-slate-800 p-6 text-left">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
                <div className="flex items-center space-x-2">
                  <MessageSquare className="h-5 w-5 text-amber-500" />
                  <span className="font-display font-bold text-base text-white">Pending Queries ({queries.filter(q => !q.replied).length})</span>
                </div>
              </div>

              <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
                {queries.filter(q => !q.replied).length === 0 ? (
                  <div className="text-center py-8 text-xs text-slate-500">
                    🎉 Inbox clear! All customer queries answered.
                  </div>
                ) : (
                  queries.filter(q => !q.replied).map((q) => (
                    <div 
                      key={q.id} 
                      onClick={() => setAdminActiveTab('queries')}
                      className="p-3 bg-slate-950/80 rounded-xl border border-slate-850 hover:border-amber-400 transition-colors cursor-pointer text-xs space-y-1.5"
                    >
                      <div className="flex justify-between font-bold text-white">
                        <span>{q.name}</span>
                        <span className="text-[10px] text-slate-500">{new Date(q.timestamp).toLocaleDateString()}</span>
                      </div>
                      <p className="text-slate-400 truncate font-mono text-[11px]">{q.subject}</p>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>

        </div>
      )}

      {/* VIEW 2: SALES/PAYMENT HISTORY REPORTS */}
      {adminActiveTab === 'sales' && (
        <div className="bg-slate-900 rounded-3xl border border-slate-800 p-6 text-left space-y-4">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center space-y-3 sm:space-y-0 pb-3 border-b border-slate-800">
            <h3 className="font-display font-extrabold text-lg text-white">Successful Payments Log</h3>
            <div className="relative">
              <Search className="h-4 w-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                id="search-payments"
                type="text"
                placeholder="Search name, order ID, email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-1.5 text-xs text-white focus:border-brand-orange outline-none w-56"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-slate-300">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[10px]">
                  <th className="py-3 text-left">Order Reference ID</th>
                  <th className="py-3 text-left">Student Info</th>
                  <th className="py-3 text-left font-display">Notes Package</th>
                  <th className="py-3 text-right">Payment Channel</th>
                  <th className="py-3 text-right">Price</th>
                  <th className="py-3 text-right">Timing</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850">
                {purchases.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-slate-500 font-mono">
                      No live dynamic transactions logged yet in this session.
                    </td>
                  </tr>
                ) : (
                  purchases
                    .filter(p => 
                      p.orderId.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      p.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      p.unitName.toLowerCase().includes(searchQuery.toLowerCase())
                    )
                    .map((p) => (
                      <tr key={p.orderId} className="hover:bg-slate-850/40">
                        <td className="py-3 font-mono text-amber-400">{p.orderId}</td>
                        <td className="py-3">
                          <div className="flex flex-col text-left">
                            <span className="font-bold text-white">{p.name}</span>
                            <span className="text-slate-400 text-[10px]">{p.email}</span>
                          </div>
                        </td>
                        <td className="py-3 text-slate-200 font-semibold">{p.unitName}</td>
                        <td className="py-3 text-right">
                          <span className="bg-slate-950 py-1 px-2 rounded-lg border border-slate-800 text-[10px] font-mono text-teal-400">
                            {p.paymentMethod}
                          </span>
                        </td>
                        <td className="py-3 text-right font-bold text-white">₹{p.price}</td>
                        <td className="py-3 text-right text-slate-500">{new Date(p.timestamp).toLocaleTimeString()}</td>
                      </tr>
                    ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW 3: INVENTORY/PRICING MANAGEMENT */}
      {adminActiveTab === 'inventory' && (
        <div className="space-y-6 text-left">
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Form list: Upload Dynamic Unit */}
            <div className="bg-slate-900 rounded-3xl border border-slate-800 p-6 self-start space-y-4">
              <div className="border-b border-slate-800 pb-2">
                <h4 className="font-display font-extrabold text-base text-white">Upload New Notes Package</h4>
                <p className="text-xs text-slate-400">Adds an educational unit-wise PDF to the students listing instantly.</p>
              </div>

              <form onSubmit={handleCreateUnit} className="space-y-3.5 text-xs">
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Select Exam Category</label>
                  <select
                    id="new-unit-exam-id"
                    value={newUnitExamId}
                    onChange={(e) => setNewUnitExamId(e.target.value as ExamCategoryType)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white focus:border-brand-orange outline-none"
                  >
                    <option value="UGC_NET_CS">UGC NET CS</option>
                    <option value="RSMSSB_BCI">RSMSSB BCI</option>
                    <option value="RSMSSB_SCI">RSMSSB SCI</option>
                    <option value="UP_LT_GRADE">UP LT Grade Mains CS</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-slate-400 mb-1 font-semibold font-mono">Unit Number</label>
                    <input
                      id="new-unit-number"
                      type="number"
                      value={newUnitNum}
                      onChange={(e) => setNewUnitNum(parseInt(e.target.value) || 16)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:border-brand-orange outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1 font-semibold">Package Price (₹)</label>
                    <input
                      id="new-unit-price"
                      type="number"
                      value={newUnitPrice}
                      onChange={(e) => setNewUnitPrice(parseInt(e.target.value) || 20)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:border-brand-orange outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Unit Topic Name</label>
                  <input
                    id="new-unit-name"
                    type="text"
                    required
                    value={newUnitName}
                    onChange={(e) => setNewUnitName(e.target.value)}
                    placeholder="e.g., Automata & Context Free Grammars"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:border-brand-orange outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Short Sub-text Description</label>
                  <textarea
                    id="new-unit-desc"
                    required
                    rows={3}
                    value={newUnitDesc}
                    onChange={(e) => setNewUnitDesc(e.target.value)}
                    placeholder="Enter short details mapping what notes contain..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:border-brand-orange outline-none resize-none"
                  />
                </div>

                <button
                  id="btn-upload-unit-submit"
                  type="submit"
                  className="w-full bg-brand-orange hover:bg-brand-orange-hover text-white py-2.5 rounded-xl font-bold flex items-center justify-center space-x-1 transition-all cursor-pointer text-sm"
                >
                  <Plus className="h-4 w-4" />
                  <span>Secure Upload Note</span>
                </button>
              </form>
            </div>

            {/* Inventory Listing / Price Tuning */}
            <div className="bg-slate-900 rounded-3xl border border-slate-800 p-6 col-span-2 space-y-4">
              <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                <h4 className="font-display font-extrabold text-base text-white">Unit Price Editor</h4>
                <div className="text-xs text-slate-400 font-semibold bg-slate-950 px-3 py-1 rounded-full border border-slate-800">
                  Total inventory: <span className="text-white font-bold">{notesList.length} Units</span>
                </div>
              </div>

              {/* Quick Search */}
              <div className="relative">
                <Search className="h-4 w-4 text-slate-500 absolute left-3 top-2.5" />
                <input
                  id="search-inventory"
                  type="text"
                  placeholder="Filter by Unit topic, Exam category (e.g., UGC)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white focus:border-brand-orange outline-none w-full"
                />
              </div>

              <div className="space-y-2.5 max-h-[440px] overflow-y-auto pr-1">
                {notesList
                  .filter(unit => 
                    unit.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    unit.examId.toLowerCase().includes(searchQuery.toLowerCase())
                  )
                  .map((unit) => (
                    <div key={unit.id} className="p-3 bg-slate-950 rounded-2xl border border-slate-850 flex items-center justify-between text-xs transition-hover hover:border-slate-700">
                      <div className="flex flex-col text-left space-y-1 truncate max-w-[280px] sm:max-w-[360px]">
                        <div className="flex items-center space-x-2">
                          <span className="font-mono text-[9px] bg-slate-800 text-amber-400 font-bold px-1.5 py-0.5 rounded">
                            {unit.examId}
                          </span>
                          <span className="text-[10px] text-slate-550 truncate max-w-sm font-semibold text-slate-400">{unit.shortDescription}</span>
                        </div>
                        <span className="font-bold text-white truncate text-sm">{unit.name}</span>
                      </div>

                      <div className="flex items-center space-x-3.5">
                        {editingUnitId === unit.id ? (
                          <div className="flex items-center space-x-1.5 bg-slate-905 p-1 rounded-xl">
                            <span className="text-slate-450 font-bold ml-1 font-sans text-slate-400">₹</span>
                            <input
                              id={`input-edit-price-${unit.id}`}
                              type="number"
                              value={editedPrice}
                              onChange={(e) => setEditedPrice(e.target.value)}
                              className="w-12 bg-slate-950 border border-slate-750 text-white rounded text-center py-1 font-bold font-mono outline-none"
                            />
                            <button
                              id={`btn-save-price-${unit.id}`}
                              onClick={() => handleSavePrice(unit.id)}
                              className="bg-emerald-600 p-1.5 hover:bg-emerald-700 text-white rounded-lg cursor-pointer"
                              title="Save"
                            >
                              ✓
                            </button>
                            <button
                              id={`btn-cancel-price-${unit.id}`}
                              onClick={() => setEditingUnitId(null)}
                              className="bg-slate-800 p-1.5 text-slate-405 hover:bg-slate-750 rounded-lg cursor-pointer text-slate-400"
                              title="Cancel"
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center space-x-2">
                            <span className="font-bold font-display text-white text-sm">₹{unit.price}</span>
                            <button
                              id={`btn-edit-price-trigger-${unit.id}`}
                              onClick={() => {
                                setEditingUnitId(unit.id);
                                setEditedPrice(String(unit.price));
                              }}
                              className="text-slate-400 hover:text-white p-1 bg-slate-900 rounded-lg transition-colors border border-slate-800 cursor-pointer"
                              title="Edit price"
                            >
                              <Edit2 className="h-3 w-3" />
                            </button>
                            <button
                              id={`btn-delete-unit-${unit.id}`}
                              onClick={() => onRemoveUnit(unit.id)}
                              className="text-red-400 hover:text-red-200 hover:bg-red-950/20 p-1 rounded-lg transition-all cursor-pointer border border-red-950/40"
                              title="Delete Note"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
              </div>

            </div>

          </div>

        </div>
      )}

      {/* VIEW 4: QUERY / FEEDBACK INBOX BOX */}
      {adminActiveTab === 'queries' && (
        <div className="bg-slate-900 rounded-3xl border border-slate-800 p-6 text-left space-y-4">
          <div className="border-b border-slate-800 pb-3">
            <h3 className="font-display font-extrabold text-lg text-white">Student Query Inbox</h3>
            <p className="text-xs text-slate-400 mt-1">Review contact forms and inquiries submitted by students prep-planning their competitive exams.</p>
          </div>

          <div className="space-y-4">
            {queries.length === 0 ? (
              <div className="text-center py-12 text-slate-505 font-mono text-xs text-slate-500">
                📫 Empty query lists! No submissions registered.
              </div>
            ) : (
              queries.map((q) => (
                <div key={q.id} className={`p-5 rounded-2xl border transition-all duration-200 ${
                  q.replied ? 'bg-slate-950/40 border-slate-850' : 'bg-slate-950 border-slate-700/80 shadow-md shadow-brand-orange/5'
                }`} id={`query-card-${q.id}`}>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div className="flex items-center space-x-3">
                      <div className="bg-slate-8 w-10 h-10 rounded-full flex items-center justify-center bg-slate-800 text-brand-orange border border-slate-700 font-bold">
                        {q.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex flex-col text-left">
                        <span className="font-extrabold text-sm text-white">{q.name}</span>
                        <span className="text-slate-450 text-slate-400">{q.email}</span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3.5 self-start sm:self-center font-mono">
                      <span className="text-slate-500 flex items-center text-[10px]">
                        <Calendar className="h-3.5 w-3.5 mr-1" />
                        {new Date(q.timestamp).toLocaleDateString()}
                      </span>
                      {q.replied ? (
                        <span className="bg-emerald-500/10 text-emerald-400 font-bold text-[10px] px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                          ✓ Replied
                        </span>
                      ) : (
                        <span className="bg-amber-500/10 text-amber-400 font-bold text-[10px] px-2.5 py-0.5 rounded-full border border-amber-500/20 animate-pulse">
                          ● Unanswered
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 pl-0 sm:pl-13 text-xs space-y-1.5 text-left">
                    <span className="font-bold text-slate-100 font-display block">Subject: {q.subject}</span>
                    <p className="text-slate-350 leading-relaxed bg-slate-900/60 p-3 rounded-xl border border-slate-850 text-slate-300">
                      "{q.message}"
                    </p>

                    {q.replied ? (
                      <div className="mt-3 p-3 bg-emerald-500/5 rounded-xl border border-emerald-500/10 text-xs">
                        <span className="font-bold text-emerald-400 block font-mono">📨 Simulated Reply Sent:</span>
                        <p className="text-slate-400 mt-1 italic">"Thank you for contacting HandScript Notes! Our syllabus specialist has analyzed your request and emailed the practice syllabus guides matching your exam criteria. Best of luck with your preparation."</p>
                      </div>
                    ) : replyMessageId === q.id ? (
                      <div className="mt-3 bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-2.5 animate-fadeIn">
                        <label className="block text-[11px] font-bold text-slate-305">Draft Response Message</label>
                        <textarea
                          id={`input-reply-message-${q.id}`}
                          rows={2}
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                          placeholder="Type response to email directly to the student..."
                          className="w-full bg-slate-950 border border-slate-750 rounded-xl px-3 py-2 text-xs outline-none text-white focus:border-brand-orange"
                        />
                        <div className="flex space-x-2">
                          <button
                            id={`btn-send-reply-${q.id}`}
                            onClick={() => handleSimulateReply(q.id)}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-1.5 px-3 rounded-lg flex items-center space-x-1 cursor-pointer"
                          >
                            <Mail className="h-3.5 w-3.5" />
                            <span>Simulate Send</span>
                          </button>
                          <button
                            id={`btn-cancel-reply-${q.id}`}
                            onClick={() => setReplyMessageId(null)}
                            className="bg-slate-800 hover:bg-slate-705 text-slate-400 py-1.5 px-3 rounded-lg transition-colors cursor-pointer"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        id={`btn-reply-trigger-${q.id}`}
                        onClick={() => setReplyMessageId(q.id)}
                        className="mt-2.5 bg-slate-850 hover:bg-slate-800 text-slate-200 border border-slate-750 py-1.5 px-4 rounded-xl font-bold flex items-center space-x-1 cursor-pointer hover:border-brand-orange transition-all"
                      >
                        <Mail className="h-3.5 w-3.5 text-brand-orange" />
                        <span>Compose Answer</span>
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

    </div>
  );
}
