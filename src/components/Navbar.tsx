/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { BookOpen, PenTool, User, ShieldCheck, LogOut, Menu, X, HelpCircle, GraduationCap } from 'lucide-react';
import { UserSession } from '../types';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  user: UserSession;
  onLogout: () => void;
  onOpenLogin: () => void;
}

export default function Navbar({ activeTab, setActiveTab, user, onLogout, onOpenLogin }: NavbarProps) {
  const [isOpen, setIsOpen] = useState(false);

  const navItems = [
    { id: 'home', label: 'Home' },
    { id: 'exams', label: 'Browse Exams' },
    { id: 'contact', label: 'Help & Queries' },
    { id: 'about', label: 'About Us' }
  ];

  const handleNavClick = (tabId: string) => {
    setActiveTab(tabId);
    setIsOpen(false);
  };

  return (
    <nav id="app-nav" className="bg-white/95 backdrop-blur-md border-b border-slate-200 text-slate-800 sticky top-0 z-50 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Logo & Initials HSN */}
          <div className="flex items-center cursor-pointer" onClick={() => handleNavClick('home')}>
            <div className="relative mr-3 bg-gradient-to-br from-brand-orange to-amber-50 p-2.5 rounded-xl shadow-lg shadow-orange-500/10">
              <BookOpen className="h-6 w-6 text-white" />
              <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5 border border-amber-400">
                <PenTool className="h-3 w-3 text-amber-500" />
              </div>
            </div>
            
            <div className="flex flex-col">
              <div className="flex items-center">
                <span className="font-display font-extrabold text-2xl tracking-normal text-slate-900">
                  HandScript
                </span>
                <span className="font-display font-extrabold text-2xl tracking-normal text-brand-orange ml-1">
                  Notes
                </span>
                <span className="ml-2 font-mono text-[10px] bg-slate-100 text-amber-600 px-1.5 py-0.5 rounded border border-slate-200 font-bold hidden sm:inline">
                  HSN
                </span>
              </div>
              <span className="font-handwritten text-xs text-slate-500 font-bold/80 tracking-wide text-left opacity-90">
                Write Success by Hand
              </span>
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => (
              <button
                key={item.id}
                id={`nav-item-${item.id}`}
                onClick={() => handleNavClick(item.id)}
                className={`px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 ${
                  activeTab === item.id
                    ? 'bg-brand-orange text-white shadow-md shadow-brand-orange/20 font-bold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                {item.label}
              </button>
            ))}

            {/* Dashboard / Library */}
            {user.isLoggedIn && (
              <button
                id="nav-item-dashboard"
                onClick={() => handleNavClick('dashboard')}
                className={`px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 ${
                  activeTab === 'dashboard'
                    ? 'bg-brand-orange text-white shadow-md'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                My Dashboard
              </button>
            )}

            {/* Admin Dashboard */}
            <button
              id="nav-item-admin"
              onClick={() => handleNavClick('admin')}
              className={`px-4 py-2 rounded-lg font-medium text-sm border-dashed border ${
                activeTab === 'admin'
                  ? 'bg-amber-50 border-amber-300 text-amber-700 font-bold'
                  : 'border-slate-200 text-slate-500 hover:text-amber-700 hover:bg-amber-50/50 hover:border-amber-250'
              } transition-all duration-200 flex items-center space-x-1`}
            >
              <ShieldCheck className="h-4 w-4" />
              <span>Admin Console</span>
            </button>
          </div>

          {/* Auth Button Desktop */}
          <div className="hidden md:flex items-center space-x-3 border-l border-slate-200 pl-4">
            {user.isLoggedIn ? (
              <div className="flex items-center space-x-3">
                <div className="flex flex-col text-right">
                  <span className="text-sm font-semibold text-slate-800">{user.name}</span>
                  <span className="text-xs text-slate-500 truncate max-w-[120px]">{user.email}</span>
                </div>
                <div className="bg-slate-100 p-2 rounded-full border border-slate-200 hover:border-brand-orange transition-all duration-200">
                  <User className="h-4 w-4 text-brand-orange" />
                </div>
                <button
                  id="btn-nav-logout"
                  onClick={onLogout}
                  title="Logout"
                  className="p-2 text-slate-500 hover:text-red-500 rounded-lg transition-colors cursor-pointer"
                >
                  <LogOut className="h-5 w-5" />
                </button>
              </div>
            ) : (
              <button
                id="btn-nav-login"
                onClick={onOpenLogin}
                className="bg-brand-orange hover:bg-brand-orange-hover text-white px-5 py-2 rounded-xl text-sm font-semibold shadow-lg shadow-brand-orange/15 transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
              >
                Sign In
              </button>
            )}
          </div>

          {/* Mobile hamburger menu */}
          <div className="md:hidden flex items-center space-x-2">
            <button
              onClick={() => handleNavClick('admin')}
              className="p-2 text-slate-500 hover:text-amber-600 transition-colors"
              title="Admin Panel"
            >
              <ShieldCheck className="h-5 w-5" />
            </button>
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 focus:outline-none cursor-pointer"
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {isOpen && (
        <div className="md:hidden bg-white border-b border-slate-200 shadow-lg animate-fadeIn overflow-hidden">
          <div className="px-2 pt-2 pb-4 space-y-1 sm:px-3">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`block w-full text-left px-4 py-2.5 rounded-lg text-base font-semibold ${
                  activeTab === item.id
                    ? 'bg-brand-orange text-white font-bold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                {item.label}
              </button>
            ))}

            {user.isLoggedIn && (
              <button
                onClick={() => handleNavClick('dashboard')}
                className={`block w-full text-left px-4 py-2.5 rounded-lg text-base font-semibold ${
                  activeTab === 'dashboard'
                    ? 'bg-brand-orange text-white font-bold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                My Dashboard
              </button>
            )}

            {/* Profile info on mobile */}
            <div className="border-t border-slate-200 pt-3 mt-3 px-4">
              {user.isLoggedIn ? (
                <div className="flex items-center justify-between">
                  <div className="flex flex-col text-left">
                    <span className="text-sm font-bold text-slate-800">{user.name}</span>
                    <span className="text-xs text-slate-500">{user.email}</span>
                  </div>
                  <button
                    onClick={() => {
                      onLogout();
                      setIsOpen(false);
                    }}
                    className="flex items-center space-x-1.5 text-sm text-red-600 py-1.5 px-3 rounded-lg bg-red-50 border border-red-200 font-semibold"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Logout</span>
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => {
                    onOpenLogin();
                    setIsOpen(false);
                  }}
                  className="w-full bg-brand-orange hover:bg-brand-orange-hover text-white text-center py-2.5 rounded-xl text-base font-bold shadow-md shadow-brand-orange/10"
                >
                  Sign In
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
