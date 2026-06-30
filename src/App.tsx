/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  BookOpen, Search, Filter, ShieldCheck, Mail, AlertCircle, ArrowRight, CheckCircle2, 
  HelpCircle, UserCheck, GraduationCap, Clock, Award, Star, BookOpenCheck, Flame, 
  Lock, ArrowDown, ChevronDown, Check, User
} from 'lucide-react';

import { EXAMS_INFO, NOTES_LIST } from './data';
import { NotesUnit, PurchaseRecord, ContactQuery, UserSession, ExamCategoryType } from './types';
import { PDFDocument } from 'pdf-lib';

// Importing Custom Sub-components developed
import Navbar from './components/Navbar';
import DocReader from './components/DocReader';
import PaymentCheckout from './components/PaymentCheckout';
import UserDashboard from './components/UserDashboard';
import AdminPanel from './components/AdminPanel';

import studentLearningBanner from './assets/images/student_learning_banner_1780204047479.png';

export default function App() {
  // Navigation State
  const [activeTab, setActiveTab] = useState<string>('home'); // home, exams, dashboard, admin, contact, about, policy_*
  const [activeExamId, setActiveExamId] = useState<ExamCategoryType | null>(null);

  // Core App Ledger State (Persisted in localStorage)
  const [notesList, setNotesList] = useState<NotesUnit[]>(() => {
    const saved = localStorage.getItem('hsn_notes_list');
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as NotesUnit[];
        // Sync names and details from fresh NOTES_LIST to handle syllabus updates, but preserve dynamic prices/edits
        const updatedList = NOTES_LIST.map(freshUnit => {
          const savedUnit = parsed.find(item => item.id === freshUnit.id);
          return savedUnit ? { ...freshUnit, price: savedUnit.price, pdfUrl: savedUnit.pdfUrl, pdfName: savedUnit.pdfName } : freshUnit;
        });
        
        // Include any custom units created by the admin that do not exist natively in statutory NOTES_LIST
        const customUnits = parsed.filter(item => !NOTES_LIST.some(fresh => fresh.id === item.id));
        
        // Fully deduplicate elements to make absolutely certain no key collides
        const combined = [...updatedList, ...customUnits];
        const uniqueList: NotesUnit[] = [];
        const seenIds = new Set<string>();
        for (const item of combined) {
          if (!seenIds.has(item.id)) {
            seenIds.add(item.id);
            uniqueList.push(item);
          }
        }
        return uniqueList;
      } catch (e) {
        return NOTES_LIST;
      }
    }
    return NOTES_LIST;
  });

  const [purchases, setPurchases] = useState<PurchaseRecord[]>(() => {
    const saved = localStorage.getItem('hsn_purchases');
    // Pre-seed some default logs to make metrics feel realistic on first load
    const baseList: PurchaseRecord[] = [
      {
        orderId: 'HSN-TX-742911',
        name: 'Sachin Kumar',
        email: 'sachin.bci@gmail.com',
        unitId: 'rsmssb-bci-unit-3',
        unitName: 'Unit 3: Programming Fundamentals',
        examId: 'RSMSSB_BCI',
        price: 20,
        status: 'Successful',
        paymentMethod: 'UPI - PhonePe',
        timestamp: new Date(Date.now() - 3600000 * 5).toISOString()
      },
      {
        orderId: 'HSN-TX-892110',
        name: 'Pooja Verma',
        email: 'pooja.net@outlook.com',
        unitId: 'ugc-net-cs-unit-1',
        unitName: 'Unit 1: Mathematical Optimization',
        examId: 'UGC_NET_CS',
        price: 20,
        status: 'Successful',
        paymentMethod: 'UPI QR Code',
        timestamp: new Date(Date.now() - 3600000 * 18).toISOString()
      }
    ];
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return baseList;
      }
    }
    return baseList;
  });

  const [queries, setQueries] = useState<ContactQuery[]>(() => {
    const saved = localStorage.getItem('hsn_queries');
    const baseQueries: ContactQuery[] = [
      {
        id: 'q1',
        name: 'Amit Sharma',
        email: 'amit.sharma99@gmail.com',
        subject: 'Query regarding RSMSSB Syllabus match',
        message: 'Are these notes updated as per the latest 2026 Rajasthan Board changes? Looking specifically for pedegogy and C++ pointer formulas.',
        timestamp: new Date(Date.now() - 3600000 * 24).toISOString(),
        replied: false
      },
      {
        id: 'q2',
        name: 'Divya Joshi',
        email: 'divya_cs_mains@gmail.com',
        subject: 'PDF Printing option',
        message: 'Can I print these notes after purchasing? I prefer studying from copy-books.',
        timestamp: new Date(Date.now() - 3600000 * 36).toISOString(),
        replied: true
      }
    ];
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return baseQueries;
      }
    }
    return baseQueries;
  });

  const [user, setUser] = useState<UserSession>(() => {
    const saved = localStorage.getItem('hsn_user_session');
    const defaultSession: UserSession = {
      name: '',
      email: '',
      isLoggedIn: false,
      purchasedUnitIds: [] // list of purchased notes IDs
    };
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return defaultSession;
      }
    }
    return defaultSession;
  });

  // UI Interactive States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUnit, setSelectedUnit] = useState<NotesUnit | null>(null);
  const [activeReaderUnit, setActiveReaderUnit] = useState<NotesUnit | null>(null);
  const [activeCheckoutUnit, setActiveCheckoutUnit] = useState<NotesUnit | null>(null);

  // Authentication popups
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [authName, setAuthName] = useState('');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authError, setAuthError] = useState('');

  // Contact section fields
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactSubject, setContactSubject] = useState('');
  const [contactMessage, setContactMessage] = useState('');
  const [contactSuccess, setContactSuccess] = useState(false);

  // App notification ban
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<'success' | 'info'>('success');

  // Sync state to LocalStorage
  useEffect(() => {
    localStorage.setItem('hsn_notes_list', JSON.stringify(notesList));
  }, [notesList]);

  // Load live notes list from Express server database
  useEffect(() => {
    fetch('/api/notes')
      .then((res) => {
        if (!res.ok) throw new Error('Live database fetch failed');
        return res.json();
      })
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setNotesList(data);
        }
      })
      .catch((err) => {
        console.warn('Backend not yet reachable or in build phase, using local persistent cache instead:', err);
      });
  }, []);

  // Load live purchases from server database and synchronize locally
  useEffect(() => {
    const fetchPurchases = () => {
      fetch('/api/purchases')
        .then((res) => {
          if (!res.ok) throw new Error('Live purchases fetch failed');
          return res.json();
        })
        .then((data) => {
          if (Array.isArray(data)) {
            setPurchases(data);

            // Sync user's unlocked units from loaded purchases if logged in
            if (user.isLoggedIn) {
              const userEmail = user.email.toLowerCase();
              const unlockedIds = data
                .filter((p: any) => p.email.toLowerCase() === userEmail && p.status === 'Successful')
                .map((p: any) => p.unitId);
              setUser((curr) => ({
                ...curr,
                purchasedUnitIds: Array.from(new Set([...curr.purchasedUnitIds, ...unlockedIds]))
              }));
            } else {
              // Sync guest unlocked items in localStorage only if they match the guest's local purchases
              const localSaved = localStorage.getItem('hsn_purchases');
              let localPurchases: any[] = [];
              if (localSaved) {
                try {
                  localPurchases = JSON.parse(localSaved);
                } catch (e) {
                  console.error('Failed to parse purchases from localStorage:', e);
                }
              }
              const localOrderIds = new Set(localPurchases.map((lp: any) => lp.orderId));
              data.forEach((p: any) => {
                if (p.status === 'Successful' && localOrderIds.has(p.orderId)) {
                  localStorage.setItem(`guest_unlocked_${p.unitId}`, 'true');
                }
              });
            }
          }
        })
        .catch((err) => {
          console.warn('Could not fetch purchases from server:', err);
        });
    };

    fetchPurchases();
    // Poll every 8s to fetch real-time updates of manual verification approvals
    const intervalId = setInterval(fetchPurchases, 8000);
    return () => clearInterval(intervalId);
  }, [user.isLoggedIn, user.email]);

  // Load live inquiries/queries from Express server and set up live polling
  useEffect(() => {
    const fetchQueries = () => {
      fetch('/api/queries')
        .then((res) => {
          if (!res.ok) throw new Error('Live queries fetch failed');
          return res.json();
        })
        .then((data) => {
          if (Array.isArray(data)) {
            setQueries(data);
          }
        })
        .catch((err) => {
          console.warn('Could not fetch queries from server:', err);
        });
    };

    // Initial fetch
    fetchQueries();

    // Set up polling interval every 8 seconds to fetch real live queries
    const intervalId = setInterval(fetchQueries, 8000);

    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    localStorage.setItem('hsn_purchases', JSON.stringify(purchases));
  }, [purchases]);

  useEffect(() => {
    localStorage.setItem('hsn_queries', JSON.stringify(queries));
  }, [queries]);

  useEffect(() => {
    localStorage.setItem('hsn_user_session', JSON.stringify(user));
  }, [user]);

  // Dynamic Technical SEO & Google Search snippet metadata updater
  useEffect(() => {
    let title = "HandScript Notes - Premium Handwritten Notes for CS Exams";
    let description = "Unlock premium, high-quality handwritten notes compiled by Rajesh Ji for competitive exams including RSMSSB BCI, RSMSSB SCI, UP LT Grade, and UGC NET CS.";
    let canonicalUrl = "https://handscriptnotes.com/";

    switch (activeTab) {
      case 'home':
        title = "HandScript Notes | Best Handwritten Notes for Computer Science Exams";
        description = "Get Rajesh Ji's premium handwritten computer science notes for RSMSSB BCI, RSMSSB SCI, UP LT Grade, and UGC NET CS. High-quality exam preparation material.";
        canonicalUrl = window.location.origin + "/#home";
        break;
      case 'exams':
        title = "Syllabus-Wise Exam Notes - RSMSSB, UP LT, UGC NET CS | HandScript Notes";
        description = "Explore exam-specific handwritten notes with full syllabus coverage. Buy unit-wise high-fidelity copy books for RSMSSB BCI, RSMSSB SCI, and UGC NET CS.";
        canonicalUrl = window.location.origin + "/#exams";
        break;
      case 'dashboard':
        title = "My Learning Library - Unlocked Notes Dashboard | HandScript Notes";
        description = "Access all your purchased handwritten notes, track your prep progress, and download high-quality PDFs for quick revisions.";
        canonicalUrl = window.location.origin + "/#dashboard";
        break;
      case 'contact':
        title = "Contact Rajesh Ji - Customer Support Helpdesk | HandScript Notes";
        description = "Got queries about exam syllabus, PDF downloads, or payments? Raise an inquiry directly with Rajesh Ji for 1-to-1 assistance.";
        canonicalUrl = window.location.origin + "/#contact";
        break;
      case 'about':
        title = "About Us & Rajesh Ji's Vision | HandScript Notes";
        description = "Learn more about HandScript Notes, our rigorous compilation standard, and our mission to provide the best offline revision tools for CS aspirants.";
        canonicalUrl = window.location.origin + "/#about";
        break;
      case 'policy_privacy':
        title = "Privacy Policy | HandScript Notes";
        description = "Read our Privacy Policy to understand how HandScript Notes protects your account synchronization details, transaction records, and user data.";
        canonicalUrl = window.location.origin + "/#privacy";
        break;
      case 'policy_refund':
        title = "Cancellation & Refund Policy | HandScript Notes";
        description = "Our Cancellation & Refund Policy outlines details regarding UTR bank transfer approvals and transaction verification support.";
        canonicalUrl = window.location.origin + "/#refund";
        break;
      case 'policy_terms':
        title = "Terms & Conditions - User License Guidelines | HandScript Notes";
        description = "Review the terms, conditions, and single-license rights for purchasing and utilizing Rajesh Ji's hand-compiled revisions notes.";
        canonicalUrl = window.location.origin + "/#terms";
        break;
      case 'admin':
        title = "Secure Admin Console Gate - HandScript Notes";
        description = "Restricted administration portal for syllabus compilation, inventory tracking, feedback replies, and manual payment approvals.";
        canonicalUrl = window.location.origin + "/#admin";
        break;
    }

    // 1. Update Document HTML Title
    document.title = title;

    // 2. Update Document HTML Meta Description
    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
      metaDesc = document.createElement('meta');
      metaDesc.setAttribute('name', 'description');
      document.head.appendChild(metaDesc);
    }
    metaDesc.setAttribute('content', description);

    // 3. Update Canonical URL
    let canonicalLink = document.querySelector('link[rel="canonical"]');
    if (!canonicalLink) {
      canonicalLink = document.createElement('link');
      canonicalLink.setAttribute('rel', 'canonical');
      document.head.appendChild(canonicalLink);
    }
    canonicalLink.setAttribute('href', canonicalUrl);

    // 4. Update Open Graph (Facebook/LinkedIn) Meta Tags
    const ogTitle = document.querySelector('meta[property="og:title"]') || document.createElement('meta');
    ogTitle.setAttribute('property', 'og:title');
    ogTitle.setAttribute('content', title);
    if (!ogTitle.parentNode) document.head.appendChild(ogTitle);

    const ogDesc = document.querySelector('meta[property="og:description"]') || document.createElement('meta');
    ogDesc.setAttribute('property', 'og:description');
    ogDesc.setAttribute('content', description);
    if (!ogDesc.parentNode) document.head.appendChild(ogDesc);

    const ogUrl = document.querySelector('meta[property="og:url"]') || document.createElement('meta');
    ogUrl.setAttribute('property', 'og:url');
    ogUrl.setAttribute('content', window.location.origin);
    if (!ogUrl.parentNode) document.head.appendChild(ogUrl);

    // 5. Dynamic JSON-LD Structured Data for perfect Google snippets
    let schemaScript = document.getElementById('seo-dynamic-webpage-schema');
    if (!schemaScript) {
      schemaScript = document.createElement('script');
      schemaScript.setAttribute('id', 'seo-dynamic-webpage-schema');
      schemaScript.setAttribute('type', 'application/ld+json');
      document.head.appendChild(schemaScript);
    }
    schemaScript.textContent = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "WebPage",
      "name": title,
      "description": description,
      "url": canonicalUrl,
      "isPartOf": {
        "@type": "WebSite",
        "name": "HandScript Notes",
        "url": window.location.origin
      }
    });
  }, [activeTab]);

  // Self-healing migration to move raw base64 PDFs from localStorage into modern high-quota IndexedDB storage
  useEffect(() => {
    let active = true;
    const migrateBase64ToIndexedDB = async () => {
      let changed = false;
      try {
        const updatedList = await Promise.all(
          notesList.map(async (unit) => {
            if (unit.pdfUrl && unit.pdfUrl.startsWith('data:application/pdf;base64,')) {
              try {
                const { savePdf } = await import('./utils/pdfStorage');
                await savePdf(unit.id, unit.pdfUrl);
                changed = true;
                return { ...unit, pdfUrl: `indexeddb://${unit.id}` };
              } catch (err) {
                console.error('Migration failed for unit:', unit.id, err);
              }
            }
            return unit;
          })
        );

        if (changed && active) {
          setNotesList(updatedList);
          showToast('Local database healed and optimized for high-capacity storage.', 'info');
        }
      } catch (err) {
        console.error('Self-healing migration encountered an error:', err);
      }
    };

    migrateBase64ToIndexedDB();
    return () => {
      active = false;
    };
  }, []);

  const showToast = (message: string, type: 'success' | 'info' = 'success') => {
    setToastMessage(message);
    setToastType(type);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Auth Operations
  const handleAuthSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!authEmail || !authEmail.includes('@') || !authPassword) {
      setAuthError('Please enter a valid student email address and password');
      return;
    }

    if (authMode === 'signup') {
      if (!authName) {
        setAuthError('Please specify your name');
        return;
      }
      
      // Simulate registering new account
      const newUserSession: UserSession = {
        name: authName,
        email: authEmail.toLowerCase(),
        isLoggedIn: true,
        purchasedUnitIds: [] // empty library on register
      };

      setUser(newUserSession);
      showToast(`Welcome! Account successfully registered for ${authName}.`, 'success');
      setShowAuthModal(false);
      setAuthError('');
    } else {
      // Simulate Login
      // Check if this student already had past purchase receipts recorded under this exact email
      const linkedPurchasedUnitIds = purchases
        .filter(p => p.email.toLowerCase() === authEmail.toLowerCase() && p.status === 'Successful')
        .map(p => p.unitId);

      const existingUserSession: UserSession = {
        name: authName || authEmail.split('@')[0],
        email: authEmail.toLowerCase(),
        isLoggedIn: true,
        purchasedUnitIds: linkedPurchasedUnitIds
      };

      setUser(existingUserSession);
      showToast(`Successfully logged in! Restored ${linkedPurchasedUnitIds.length} purchased units to session.`, 'success');
      setShowAuthModal(false);
      setAuthError('');
    }
    
    // clear fields
    setAuthName('');
    setAuthEmail('');
    setAuthPassword('');
  };

  const handleLogout = () => {
    setUser({ name: '', email: '', isLoggedIn: false, purchasedUnitIds: [] });
    setActiveTab('home');
    showToast('Log out approved cleanly.', 'info');
  };

  // Main purchase success record logging
  const handlePaymentCompleted = (record: PurchaseRecord) => {
    // Sync purchase with server DB
    fetch('/api/purchases', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ purchase: record })
    })
    .then((res) => {
      if (!res.ok) throw new Error('Purchase sync failed');
      return res.json();
    })
    .then((data) => {
      if (data.success && Array.isArray(data.purchases)) {
        setPurchases(data.purchases);
      } else {
        setPurchases((prev) => [record, ...prev]);
      }
    })
    .catch((err) => {
      console.warn('Backend not reachable, logging purchase record locally:', err);
      setPurchases((prev) => [record, ...prev]);
    });

    // If logged in and the purchase is already Successful (e.g. sandbox bypass), sync to library
    if (record.status === 'Successful') {
      if (user.isLoggedIn) {
        setUser((prev) => ({
          ...prev,
          purchasedUnitIds: Array.from(new Set([...prev.purchasedUnitIds, record.unitId]))
        }));
      } else {
        localStorage.setItem(`guest_unlocked_${record.unitId}`, 'true');
      }
      showToast(`Purchased successfully! ${record.unitName} unlocked.`, 'success');
      
      const noteObj = notesList.find(n => n.id === record.unitId);
      if (noteObj) {
        setActiveReaderUnit(noteObj);
      }
    } else {
      showToast(`UTR details recorded securely. Awaiting admin verification approval.`, 'info');
    }
  };

  // Feedback Submission handler
  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactName || !contactEmail || !contactMessage) return;

    const newQuery: ContactQuery = {
      id: `query-${Date.now()}`,
      name: contactName,
      email: contactEmail,
      subject: contactSubject || 'General Inquiry',
      message: contactMessage,
      timestamp: new Date().toISOString(),
      replied: false
    };

    // Optimistically add to state
    setQueries(prev => [newQuery, ...prev]);
    setContactSuccess(true);
    setContactName('');
    setContactEmail('');
    setContactSubject('');
    setContactMessage('');

    fetch('/api/queries', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: newQuery })
    })
    .then(res => res.json())
    .then(data => {
      if (data.success && data.queries) {
        setQueries(data.queries);
      }
    })
    .catch(err => {
      console.error('Failed to sync query with server:', err);
    });
    
    showToast('Submit complete! The HandScript specialist inbox received your query.', 'success');
    setTimeout(() => setContactSuccess(false), 5000);
  };

  // check if a unit is unlocked for current student context
  const isUnitUnlocked = (unitId: string): boolean => {
    // 1. If any purchase for this unit by this user has status 'Pending', block access.
    const userEmail = user.isLoggedIn ? user.email.toLowerCase() : '';
    const isPending = purchases.some((p) => 
      p.unitId === unitId && 
      p.status === 'Pending' && 
      (user.isLoggedIn ? p.email.toLowerCase() === userEmail : true)
    );
    if (isPending) {
      return false;
    }

    // 2. Fallback check for session library or localStorage keys
    if (user.isLoggedIn) {
      return user.purchasedUnitIds.includes(unitId);
    }
    return localStorage.getItem(`guest_unlocked_${unitId}`) === 'true';
  };

  // Admin dynamic updates
  const handleUpdatePrice = (unitId: string, newPrice: number) => {
    setNotesList((prevList) => 
      prevList.map((unit) => (unit.id === unitId ? { ...unit, price: newPrice } : unit))
    );

    fetch('/api/notes/update-price', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ unitId, price: newPrice })
    })
    .then(res => res.json())
    .then(data => {
      if (data.success && data.notes) {
        setNotesList(data.notes);
      }
    })
    .catch(err => console.error('Failed to sync price update to server:', err));

    showToast('Inventory unit price updated successfully.', 'success');
  };

  const slicePdfClientSide = async (base64Data: string): Promise<string | null> => {
    try {
      const base64Content = base64Data.split(';base64,').pop();
      if (!base64Content) return null;
      
      const binaryString = window.atob(base64Content.replace(/\s/g, ''));
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      
      const pdfDoc = await PDFDocument.load(bytes);
      const subPdfDoc = await PDFDocument.create();
      const totalPages = pdfDoc.getPageCount();
      const pagesToCopy = Math.min(4, totalPages);
      
      const pageIndices = Array.from({ length: pagesToCopy }, (_, i) => i);
      const copiedPages = await subPdfDoc.copyPages(pdfDoc, pageIndices);
      for (const page of copiedPages) {
        subPdfDoc.addPage(page);
      }
      
      const pdfBytesOut = await subPdfDoc.save();
      let binary = '';
      const bytesOutLen = pdfBytesOut.byteLength;
      for (let i = 0; i < bytesOutLen; i++) {
        binary += String.fromCharCode(pdfBytesOut[i]);
      }
      const previewBase64 = window.btoa(binary);
      return `data:application/pdf;base64,${previewBase64}`;
    } catch (err) {
      console.error('Error slicing PDF client-side:', err);
      return null;
    }
  };

  const handleUpdateNotePdf = async (unitId: string, pdfUrl: string, pdfName: string, pdfDataOrNotes?: string | NotesUnit[]) => {
    if (Array.isArray(pdfDataOrNotes)) {
      setNotesList(pdfDataOrNotes);
      showToast('Original scanned PDF successfully attached and saved!', 'success');
      return;
    }

    // Optimistic local state update
    setNotesList((prevList) =>
      prevList.map((unit) => (unit.id === unitId ? { ...unit, pdfUrl, pdfName } : unit))
    );

    const pdfData = typeof pdfDataOrNotes === 'string' ? pdfDataOrNotes : undefined;

    if (pdfData) {
      showToast('Preparing secure 4-page PDF preview...', 'info');
      let pdfPreviewData: string | null = null;
      try {
        pdfPreviewData = await slicePdfClientSide(pdfData);
      } catch (err) {
        console.error('Failed to slice PDF on client:', err);
      }

      showToast('Uploading full PDF + preview to live server...', 'info');
      fetch('/api/notes/update-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ unitId, pdfName, pdfData, pdfPreviewData })
      })
      .then(res => res.json())
      .then(data => {
        if (data.success && data.notes) {
          setNotesList(data.notes);
          showToast(`PDF uploaded successfully! Saved live as: ${data.pdfName}`, 'success');
        } else {
          showToast('Failed to save PDF on server disk.', 'info');
        }
      })
      .catch(err => {
        console.error('Failed to upload PDF to server:', err);
        showToast('Error uploading PDF to server. Saved locally only.', 'info');
      });
    } else {
      showToast('Original scanned PDF successfully attached!', 'success');
    }
  };

  const handleAddNewUnit = async (unitOrFormData: NotesUnit | FormData) => {
    if (unitOrFormData instanceof FormData) {
      showToast('Registering new handwritten unit and uploading PDF...', 'info');
      try {
        const res = await fetch('/api/notes/add-unit', {
          method: 'POST',
          body: unitOrFormData
        });
        if (!res.ok) {
          const errText = await res.text();
          throw new Error(errText || `Server error ${res.status}`);
        }
        const data = await res.json();
        if (data.success && data.notes) {
          setNotesList(data.notes);
          showToast('New handwritten PDF package registered live!', 'success');
          return true; // signal success to reset form
        } else {
          throw new Error(data.error || 'Registration returned unsuccessful status');
        }
      } catch (err: any) {
        console.error('Failed to add unit:', err);
        showToast(`Failed to register unit: ${err.message || err}`, 'info');
        throw err;
      }
    } else {
      setNotesList((prev) => {
        if (prev.some(u => u.id === unitOrFormData.id)) {
          return prev;
        }
        return [...prev, unitOrFormData];
      });

      fetch('/api/notes/add-unit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ unit: unitOrFormData })
      })
      .then(res => res.json())
      .then(data => {
        if (data.success && data.notes) {
          setNotesList(data.notes);
        }
      })
      .catch(err => console.error('Failed to sync new unit to server:', err));

      showToast('New handwritten PDF package registered.', 'success');
    }
  };

  const handleRemoveUnit = (unitId: string) => {
    setNotesList((prev) => prev.filter(u => u.id !== unitId));

    fetch('/api/notes/remove-unit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ unitId })
    })
    .then(res => res.json())
    .then(data => {
      if (data.success && data.notes) {
        setNotesList(data.notes);
      }
    })
    .catch(err => console.error('Failed to remove unit from server:', err));

    showToast('Inventory item deleted.', 'info');
  };

  const handleAnswerQuery = (queryId: string) => {
    // Optimistically update locally
    setQueries((prev) => 
      prev.map((q) => (q.id === queryId ? { ...q, replied: true } : q))
    );

    fetch('/api/queries/answer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ queryId })
    })
    .then(res => res.json())
    .then(data => {
      if (data.success && data.queries) {
        setQueries(data.queries);
      }
    })
    .catch(err => {
      console.error('Failed to sync answered status with server:', err);
    });

    showToast('Simulated response dispatched to student email inbox.', 'success');
  };

  const handleApprovePurchase = (orderId: string) => {
    fetch('/api/purchases/approve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId })
    })
    .then((res) => {
      if (!res.ok) throw new Error('Failed to approve purchase on server');
      return res.json();
    })
    .then((data) => {
      if (data.success && Array.isArray(data.purchases)) {
        setPurchases(data.purchases);
        
        // Also update local user/guest states
        const approvedPurchase = data.purchases.find((p: any) => p.orderId === orderId);
        if (approvedPurchase) {
          if (user.isLoggedIn && approvedPurchase.email.toLowerCase() === user.email.toLowerCase()) {
            setUser((curr) => ({
              ...curr,
              purchasedUnitIds: Array.from(new Set([...curr.purchasedUnitIds, approvedPurchase.unitId]))
            }));
          } else {
            localStorage.setItem(`guest_unlocked_${approvedPurchase.unitId}`, 'true');
          }
        }
      }
    })
    .catch((err) => {
      console.warn('Backend not reachable, approving purchase record locally:', err);
      setPurchases((prev) =>
        prev.map((p) => {
          if (p.orderId === orderId) {
            const updated = { ...p, status: 'Successful' as const };
            
            if (user.isLoggedIn && p.email.toLowerCase() === user.email.toLowerCase()) {
              setUser((curr) => ({
                ...curr,
                purchasedUnitIds: Array.from(new Set([...curr.purchasedUnitIds, p.unitId]))
              }));
            } else {
              localStorage.setItem(`guest_unlocked_${p.unitId}`, 'true');
            }
            
            return updated;
          }
          return p;
        })
      );
    });
    showToast(`Order ${orderId} has been successfully verified & notes unlocked.`, 'success');
  };

  const handleDeclinePurchase = (orderId: string) => {
    const purchaseObj = purchases.find((p) => p.orderId === orderId);
    if (purchaseObj) {
      localStorage.removeItem(`guest_unlocked_${purchaseObj.unitId}`);
    }

    fetch('/api/purchases/decline', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId })
    })
    .then((res) => {
      if (!res.ok) throw new Error('Failed to decline purchase on server');
      return res.json();
    })
    .then((data) => {
      if (data.success && Array.isArray(data.purchases)) {
        setPurchases(data.purchases);
      }
    })
    .catch((err) => {
      console.warn('Backend not reachable, declining purchase record locally:', err);
      setPurchases((prev) => prev.filter((p) => p.orderId !== orderId));
    });
    showToast(`Order ${orderId} has been declined & discarded.`, 'info');
  };

  return (
    <div id="handscript-app" className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans selection:bg-brand-orange selection:text-white">
      
      {/* Dynamic Toast Alert banner */}
      {toastMessage && (
        <div id="system-toast" className={`fixed bottom-6 right-6 z-50 px-5 py-3.5 rounded-2xl shadow-2xl border flex items-center space-x-2.5 animate-fadeIn ${
          toastType === 'success' 
            ? 'bg-emerald-55 bg-emerald-50 border-emerald-200 text-emerald-800' 
            : 'bg-white border-slate-250 text-slate-700 shadow-xl'
        }`}>
          <CheckCircle2 className={`h-5 w-5 ${toastType === 'success' ? 'text-emerald-500' : 'text-blue-500'}`} />
          <span className="text-xs font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Primary header navbar */}
      <Navbar 
        activeTab={activeTab} 
        setActiveTab={(tab) => {
          setActiveTab(tab); 
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }} 
        user={user} 
        onLogout={handleLogout}
        onOpenLogin={() => {
          setAuthMode('login');
          setShowAuthModal(true);
        }}
      />

      {/* Main Content Sections Routing */}
      <main className="flex-grow">
        
        {/* VIEW A: HOMEPAGE CONTAINER */}
        {activeTab === 'home' && (
          <div id="home-view" className="space-y-16 pb-20">
            
            {/* HERO SECTION MODULE - RETAINED SPLIT LAYOUT IN LIGHT MODE WITH GENERATED STUDY IMAGE */}
            <section className="relative overflow-hidden bg-gradient-to-br from-amber-50/60 via-slate-50 to-slate-100 pt-16 pb-16 px-4 sm:px-6 lg:px-8 border-b border-slate-200">
              {/* Floating handwriting background graphics */}
              <div className="absolute right-12 top-6 opacity-10 font-handwritten text-sm pointer-events-none select-none max-w-xs hidden xl:block text-slate-700 pr-4 pt-12 text-right">
                T(n) = 8T(n/2) + O(n^2)<br/>
                Using Master Theorem...<br/>
                O(n^3) Complexity Match!<br/>
                - Formula Sheet Unit 4
              </div>
              <div className="absolute left-6 bottom-6 opacity-10 font-handwritten text-sm pointer-events-none select-none max-w-xs hidden xl:block text-slate-700 pl-4 pb-12 text-left">
                [A* Heuristics]<br/>
                f(n) = g(n) + h(n)<br/>
                Admissible if h(n) &lt;= h*(n)<br/>
                - UGC NET CS AI notes
              </div>

              <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
                
                {/* Left Column: Information content */}
                <div className="lg:col-span-7 space-y-6 text-left">
                  
                  {/* Visual badge highlight */}
                  <div className="inline-flex items-center space-x-2 bg-amber-500/10 px-4 py-2 rounded-full border border-amber-500/20 shadow-sm">
                    <Star className="h-4.5 w-4.5 text-amber-600 fill-amber-500 animate-spin-slow" />
                    <span className="text-xs font-bold text-amber-800 tracking-wide font-sans">
                      100% Student Verified Handwritten Notes
                    </span>
                  </div>

                  <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black font-display text-slate-900 tracking-tight leading-tight uppercase">
                    Handwritten Notes<br/>
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-orange to-amber-600">
                      That Help You Crack Exams
                    </span>
                  </h1>

                  <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-2xl">
                    Syllabus-mapped, error-free premium handwritten coaching notes compiled dynamically for top Computer Science and competitive teaching exams. Simplify complex theorems using direct visual guides.
                  </p>

                  {/* Hero CTAs */}
                  <div className="pt-3 flex flex-col sm:flex-row items-center space-y-3.5 sm:space-y-0 sm:space-x-4 max-w-md">
                    <button
                      id="hero-btn-browse"
                      onClick={() => {
                        setActiveTab('exams');
                        window.scrollTo({ top: 350, behavior: 'smooth' });
                      }}
                      className="w-full sm:w-auto bg-brand-orange hover:bg-brand-orange-hover text-white px-8 py-3.5 rounded-2xl font-bold font-display shadow-lg shadow-brand-orange/20 hover:-translate-y-0.5 active:translate-y-0 text-sm transition-all duration-200 cursor-pointer"
                    >
                      Browse Notes List
                    </button>
                    <button
                      id="hero-btn-demo"
                      onClick={() => {
                        // open sample demo notes from first seeded inventory
                        setActiveTab('exams');
                        const genericDemo = notesList.find(n => n.examId === 'UGC_NET_CS');
                        if (genericDemo) {
                          setActiveReaderUnit(genericDemo);
                        }
                      }}
                      className="w-full sm:w-auto bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 px-8 py-3.5 rounded-2xl font-semibold text-sm transition-all duration-200 cursor-pointer shadow-sm"
                    >
                      View Sample Note 📝
                    </button>
                  </div>

                  {/* Standard credentials stats footer in Light Mode */}
                  <div className="pt-4 grid grid-cols-3 gap-4 max-w-xl text-slate-600 font-mono text-xs border-t border-slate-200">
                    <div className="border-r border-slate-200 pr-2">
                      <span className="block font-display font-black text-slate-900 text-xl">4 Exams</span>
                      <span>Syllabus Covered</span>
                    </div>
                    <div className="border-r border-slate-200 px-2 animate-pulse">
                      <span className="block font-display font-black text-brand-orange text-xl">₹20 Each</span>
                      <span>Unit Pricing</span>
                    </div>
                    <div className="pl-2">
                      <span className="block font-display font-black text-slate-900 text-xl">100% Free</span>
                      <span>Interactive Demos</span>
                    </div>
                  </div>

                </div>

                {/* Right Column: High quality visual study image generated */}
                <div className="lg:col-span-5 relative">
                  <div className="absolute inset-0 bg-gradient-to-tr from-amber-200/40 via-amber-100/10 to-transparent blur-2xl rounded-3xl -z-10" />
                  <div className="bg-white p-3 rounded-3xl border border-slate-200/80 shadow-2xl overflow-hidden group hover:scale-[1.01] transition-all duration-300">
                    <img 
                      src={studentLearningBanner} 
                      alt="Student Study Notebook and Desk Vector Illustration" 
                      className="w-full h-auto aspect-[16/9] lg:aspect-[4/3] object-cover rounded-2xl"
                      referrerPolicy="no-referrer"
                    />
                    <div className="pt-3 px-2 flex justify-between items-center text-[10px] font-mono text-slate-500">
                      <span>✒️ Hand-drawn layout templates</span>
                      <span className="text-amber-600 font-semibold bg-amber-50 px-2 py-0.5 rounded border border-amber-200">RULED BOOKLET</span>
                    </div>
                  </div>
                </div>

              </div>
            </section>

            {/* CURRICULUM SELECTION SECTION (THE 4 EXAMS REQUIRED) */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-left space-y-6">
              <div className="border-b border-slate-200 pb-3 flex flex-col sm:flex-row justify-between sm:items-baseline">
                <div>
                  <h2 className="text-2xl font-black font-display text-slate-900 tracking-tight leading-tight uppercase">
                    Curriculum Category Hub
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">Select an exam category to review detailed unit-wise handwritten summaries.</p>
                </div>
                <span className="text-xs text-slate-500 font-mono hidden sm:inline">{notesList.length} Total Units Listed</span>
              </div>

              {/* Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {EXAMS_INFO.map((exam) => (
                  <div 
                    key={exam.id} 
                    id={`exam-category-${exam.id}`}
                    onClick={() => {
                      setActiveExamId(exam.id);
                      setActiveTab('exams');
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="bg-white rounded-3xl border border-slate-200 p-5 flex flex-col justify-between hover:border-brand-orange hover:shadow-xl hover:shadow-brand-orange/5 transition-all duration-300 group cursor-pointer lg:-translate-y-0.5 hover:-translate-y-2.5 h-[280px]"
                  >
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] uppercase font-bold font-mono tracking-wider text-amber-700 border border-amber-300/30 bg-amber-50 px-2.5 py-0.5 rounded-full">
                          {exam.badge}
                        </span>
                        <BookOpenCheck className="h-5 w-5 text-slate-400 group-hover:text-brand-orange transition-colors" />
                      </div>

                      <div className="space-y-1">
                        <h3 className="font-display font-black text-slate-800 text-xl tracking-tight leading-tight group-hover:text-brand-orange transition-colors uppercase">
                          {exam.title}
                        </h3>
                        <p className="text-xs font-semibold text-slate-500 leading-snug truncate">
                          {exam.subtitle}
                        </p>
                      </div>

                      <p className="text-xs text-slate-650 leading-relaxed line-clamp-3">
                        {exam.description}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-slate-650 group-hover:text-slate-905">
                      <span>{exam.totalUnits} Units Notes</span>
                      <div className="flex items-center space-x-1 font-bold text-brand-orange group-hover:translate-x-1.5 transition-transform duration-200">
                        <span>Open Syllabus</span>
                        <ArrowRight className="h-4 w-4" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* TRUST POINTS "WHY CHOOSE HANDSCRIPT NOTES" Accordion */}
            <section className="bg-slate-100/60 border-y border-slate-200 py-16 text-left">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                
                <div className="space-y-6">
                  <h2 className="text-3xl font-black font-display text-slate-900 tracking-tight uppercase leading-tight">
                    Why Competitive Scholars Prefer HandScript Notes?
                  </h2>
                  <p className="text-slate-600 text-sm leading-relaxed">
                    Default digital presentations lack cognitive warmth. Handwritten sheets activate spatial brain triggers that improve technical information retention.
                  </p>

                  {/* Trust Point Grid */}
                  <div className="space-y-4 text-xs">
                    <div className="flex items-start space-x-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                      <div className="bg-orange-500/10 p-2.5 rounded-xl text-brand-orange border border-orange-500/20">
                        <Check className="h-4.5 w-4.5" />
                      </div>
                      <div className="text-left space-y-1">
                        <h4 className="font-bold text-slate-800">Precision Ruled Sheets layout</h4>
                        <p className="text-slate-500">Clean, margin-lined notebook templates optimized for quick exam visual-mapping.</p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                      <div className="bg-amber-500/10 p-2.5 rounded-xl text-amber-600 border border-amber-500/20">
                        <Award className="h-4.5 w-4.5" />
                      </div>
                      <div className="text-left space-y-1">
                        <h4 className="font-bold text-slate-800">Unit-wise affordability (₹20 Each!)</h4>
                        <p className="text-slate-500">Forget paying huge upfront fees for massive volumes. Only purchase the specific logical subunit you are revising.</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Handscript Visual Showcase Notebook Simulation */}
                <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-xl relative max-w-sm mx-auto w-full">
                  <div className="absolute top-1 right-8 h-10 w-2.5 bg-indigo-500 rounded-b opacity-80" />
                  
                  {/* Miniature ruled sheet mockup to display Kalam cursive font */}
                  <div className="ruled-paper rounded-2xl p-6 shadow bg-white text-slate-800 text-left min-h-[300px] border-l-2 border-slate-300">
                    <div className="border-b border-red-200 pb-1 mb-4 flex justify-between items-center text-[10px]">
                      <span className="font-mono text-slate-400">Unit 1: Programming</span>
                      <span className="font-mono text-slate-400">Page 01</span>
                    </div>
                    <div className="font-handwritten text-xs leading-[2rem] space-y-4">
                      <p className="text-blue-800 font-bold">✍️ Pointers Concept Summary:</p>
                      <p>• Pointer is a variable storing the actual address of another variable.</p>
                      <p>✨ Q. What is <code className="bg-slate-100 px-1 font-sans rounded text-slate-800">int *ptr</code>?</p>
                      <p className="text-slate-600">Ans: Declares variable ptr pointing to integer value. Must watch out for null segmentation faults!</p>
                    </div>
                  </div>
                </div>

              </div>
            </section>

            {/* FREQUENTLY ASKED QUESTIONS SECTION */}
            <section className="max-w-4xl mx-auto px-4 sm:px-6 text-left space-y-8">
              <div className="text-center">
                <h2 className="text-2xl font-black font-display text-slate-900 uppercase">Scholars Frequently Ask</h2>
                <p className="text-xs text-slate-500 mt-1">Simple guidelines explaining PDF secure deliveries, guest checking, and transaction details.</p>
              </div>

              {/* Accordion questions */}
              <div className="space-y-4">
                <div className="p-5 bg-white border border-slate-200 rounded-2xl space-y-2 text-xs shadow-sm">
                  <span className="font-bold text-slate-800 block text-sm">Q. Can I download these notes on my mobile phone?</span>
                  <p className="text-slate-600 leading-relaxed">Yes! Right after UPI / Debit card approval, one-click access links download the authentic handwritten PDF sheet to your device internal memory directly.</p>
                </div>
                <div className="p-5 bg-white border border-slate-200 rounded-2xl space-y-2 text-xs shadow-sm">
                  <span className="font-bold text-slate-800 block text-sm">Q. I purchased as a Guest. How do I re-download my notes?</span>
                  <p className="text-slate-600 leading-relaxed font-sans">We track transactions securely. If you need to re-download, simply Sign In/Sign Up using the same email address you entered during Guest Checkout. Our ledger links all past success receipts to your profile automatically!</p>
                </div>
                <div className="p-5 bg-white border border-slate-200 rounded-2xl space-y-2 text-xs shadow-sm">
                  <span className="font-bold text-slate-850 block text-sm text-slate-800">Q. Is Razorpay secure? Should I enter real card details?</span>
                  <p className="text-slate-600 leading-relaxed">This application operates in <b>Sandbox/Simulation mode</b>. Payments are mock payments made using mock UPI and mock details, keeping transaction testing 100% free yet fully illustrative.</p>
                </div>
              </div>
            </section>

            {/* DIRECT STUDENT QUERY / CONTACT BOX MODULE */}
            <section id="help-box" className="max-w-3xl mx-auto px-4 sm:px-6">
              <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 text-left space-y-6 shadow-xl relative overflow-hidden">
                <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
                  <Mail className="h-5 w-5 text-brand-orange" />
                  <div>
                    <h3 className="font-display font-extrabold text-lg text-slate-900">Have a Question or Feedback?</h3>
                    <p className="text-xs text-slate-500">Send us a secure inquiry from right here. Our admin replies to everyone.</p>
                  </div>
                </div>

                {contactSuccess ? (
                  <div className="bg-emerald-50 p-5 rounded-2xl border border-emerald-200 text-center text-xs text-emerald-800">
                    <CheckCircle2 className="h-8 w-8 text-emerald-600 mx-auto mb-2 animate-bounce" />
                    <span className="font-bold block text-sm text-slate-900">Query Submitted Successfully!</span>
                    Our admin team received your message and will update you via email within 2 hours. Go to the Admin console to review and simulate replies.
                  </div>
                ) : (
                  <form onSubmit={handleContactSubmit} className="space-y-4 text-xs font-semibold text-slate-700">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-slate-600 mb-1">Student Full Name</label>
                        <input
                          id="contact-name"
                          type="text"
                          required
                          value={contactName}
                          onChange={(e) => setContactName(e.target.value)}
                          placeholder="Rajesh Sharma"
                          className="w-full bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-xl text-slate-900 outline-none focus:border-brand-orange"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-600 mb-1">Email ID</label>
                        <input
                          id="contact-email"
                          type="email"
                          required
                          value={contactEmail}
                          onChange={(e) => setContactEmail(e.target.value)}
                          placeholder="rajesh@gmail.com"
                          className="w-full bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-xl text-slate-900 outline-none focus:border-brand-orange"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-slate-600 mb-1">Subject</label>
                      <input
                        id="contact-subject"
                        type="text"
                        value={contactSubject}
                        onChange={(e) => setContactSubject(e.target.value)}
                        placeholder="Subject regarding syllabus or payment issues..."
                        className="w-full bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-xl text-slate-900 outline-none focus:border-brand-orange"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-600 mb-1">Detailed Message</label>
                      <textarea
                        id="contact-message"
                        required
                        rows={4}
                        value={contactMessage}
                        onChange={(e) => setContactMessage(e.target.value)}
                        placeholder="Enter your query or study guidance request here..."
                        className="w-full bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-xl text-slate-900 outline-none focus:border-brand-orange resize-none"
                      />
                    </div>

                    <button
                      id="btn-submit-query"
                      type="submit"
                      className="w-full bg-brand-orange hover:bg-brand-orange-hover text-white py-3.5 rounded-2xl font-bold transition-all shadow-md shadow-brand-orange/15 font-display text-sm cursor-pointer"
                    >
                      Submit Message Securely
                    </button>
                  </form>
                )}
              </div>
            </section>

          </div>
        )}

        {/* VIEW B: EXAMS DETAILS & UNITS SEARCH PAGE */}
        {activeTab === 'exams' && (
          <div id="exams-view" className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-8 animate-fadeIn text-left">
            
            {/* Exam category switch headers */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-4">
              <h2 className="text-xl font-bold text-slate-900 font-display uppercase">Syllabus-Wise notes Database</h2>
              
              <div className="flex flex-wrap gap-2 pt-1">
                <button
                  onClick={() => setActiveExamId(null)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                    activeExamId === null 
                      ? 'bg-brand-orange text-white border-brand-orange' 
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:text-slate-900 hover:border-slate-300'
                  }`}
                >
                  All Exams ({notesList.length} Units)
                </button>
                {EXAMS_INFO.map((exam) => (
                  <button
                    key={exam.id}
                    onClick={() => setActiveExamId(exam.id)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                      activeExamId === exam.id 
                        ? 'bg-brand-orange text-white border-brand-orange' 
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:text-slate-900 hover:border-slate-300'
                    }`}
                  >
                    {exam.title}
                  </button>
                ))}
              </div>
            </div>

            {/* Active exam subtitle indicators */}
            {activeExamId && (
              <div className="bg-slate-100/90 border border-slate-200 p-6 rounded-3xl space-y-2">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-2xl font-black font-display text-slate-900 uppercase">
                      {EXAMS_INFO.find(e => e.id === activeExamId)?.title} notes
                    </h3>
                    <p className="text-xs text-slate-500 font-semibold">
                      {EXAMS_INFO.find(e => e.id === activeExamId)?.subtitle}
                    </p>
                  </div>
                  <span className="bg-white font-mono text-[10px] text-amber-700 font-extrabold px-3 py-1 rounded-full border border-slate-200 shadow-sm">
                    {notesList.filter((unit) => unit.examId === activeExamId).length} UNITS LISTED
                  </span>
                </div>
                <p className="text-slate-600 text-xs leading-relaxed max-w-4xl pt-1">
                  {EXAMS_INFO.find(e => e.id === activeExamId)?.description}
                </p>
              </div>
            )}

            {/* Keyword Search & Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-grow">
                <Search className="h-5 w-5 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  id="search-notes-input"
                  type="text"
                  placeholder="Keyword search (e.g. Logic gate, normal form, recursion pointer)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-2xl pl-11 pr-4 py-3.5 text-sm outline-none text-slate-800 focus:border-brand-orange shadow-sm"
                />
              </div>
              <button
                onClick={() => setSearchQuery('')}
                className="bg-white hover:bg-slate-50 border border-slate-200 px-5 rounded-2xl text-xs font-semibold text-slate-700 transition-colors cursor-pointer shadow-sm"
              >
                Clear Search
              </button>
            </div>

            {/* Grid listing the units */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {notesList
                .filter((unit) => {
                  const examMatch = activeExamId === null || unit.examId === activeExamId;
                  const searchItem = unit.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                                     unit.shortDescription.toLowerCase().includes(searchQuery.toLowerCase());
                  return examMatch && searchItem;
                })
                .map((unit) => {
                  const unlocked = isUnitUnlocked(unit.id);
                  return (
                    <div 
                      key={unit.id} 
                      className="bg-white rounded-3xl border border-slate-200 p-5 flex flex-col justify-between hover:border-slate-300 transition-all duration-300 group shadow-md"
                      id={`unit-card-${unit.id}`}
                    >
                      <div className="space-y-4">
                        <div className="flex justify-between items-start">
                          <span className="text-[9px] bg-slate-50 text-amber-700 font-mono font-bold tracking-wider px-2 py-0.5 rounded border border-slate-200">
                            {unit.examId}
                          </span>
                          <span className="font-display font-black text-amber-600 text-base">₹{unit.price}</span>
                        </div>

                        <div className="space-y-1.5">
                          <h4 className="font-display font-extrabold text-slate-900 text-[17px] tracking-tight group-hover:text-brand-orange transition-colors uppercase">
                            {unit.name}
                          </h4>
                          <p className="text-slate-600 text-xs leading-relaxed line-clamp-3">
                            {unit.shortDescription}
                          </p>
                        </div>
                      </div>

                      <div className="pt-4 mt-4 border-t border-slate-100 space-y-2 text-xs">
                        {unlocked ? (
                          <button
                            id={`btn-open-read-${unit.id}`}
                            onClick={() => setActiveReaderUnit(unit)}
                            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-4 rounded-xl flex items-center justify-center space-x-1.5 cursor-pointer shadow-md"
                          >
                            <BookOpen className="h-4 w-4" />
                            <span>Read Unlocked Pages</span>
                          </button>
                        ) : (
                          <div className="grid grid-cols-2 gap-2 font-bold select-none">
                            <button
                              id={`btn-view-demo-${unit.id}`}
                              onClick={() => {
                                // launches doc reader in free demo mode!
                                setActiveReaderUnit(unit);
                              }}
                              className="bg-slate-50 border border-slate-200 text-slate-700 hover:text-slate-900 hover:bg-slate-100 py-2.5 rounded-xl flex items-center justify-center space-x-1 cursor-pointer transition-colors shadow-sm"
                            >
                              <BookOpen className="h-4 w-4" />
                              <span>Free Demo</span>
                            </button>
                            <button
                              id={`btn-buy-now-${unit.id}`}
                              onClick={() => {
                                setActiveCheckoutUnit(unit);
                              }}
                              className="bg-brand-orange hover:bg-brand-orange-hover text-white py-2.5 rounded-xl flex items-center justify-center space-x-1 cursor-pointer shadow-lg shadow-brand-orange/15 transition-transform group-hover:scale-[1.02]"
                            >
                              <Lock className="h-4 w-4" />
                              <span>Buy Unit</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>

          </div>
        )}

        {/* VIEW C: LEARNER DASHBOARD PORTAL */}
        {activeTab === 'dashboard' && (
          <UserDashboard 
            user={user} 
            allNotes={notesList}
            purchases={purchases}
            onOpenNote={(unit) => setActiveReaderUnit(unit)}
            onExploreNotes={() => {
              setActiveTab('exams');
              setActiveExamId(null);
            }}
          />
        )}

        {/* VIEW D: CONTACT VIEW FEEDBACKS */}
        {activeTab === 'contact' && (
          <div className="py-12">
            <h2 className="text-2xl font-black font-display text-slate-900 uppercase text-center mb-2">Student Help & Support desk</h2>
            <p className="text-xs text-slate-500 text-center mb-8 max-w-sm mx-auto">Get in direct touch with our state textbook specialists to map curriculum priorities.</p>
            
            <div className="max-w-3xl mx-auto px-4 sm:px-6">
              <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 text-left space-y-6 shadow-xl relative overflow-hidden">
                <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
                  <Mail className="h-5 w-5 text-brand-orange" />
                  <div>
                    <h3 className="font-display font-extrabold text-lg text-slate-900">Have a Question or Feedback?</h3>
                    <p className="text-xs text-slate-550 text-slate-500">Send us a secure inquiry from right here. Our admin replies to everyone.</p>
                  </div>
                </div>

                {contactSuccess ? (
                  <div className="bg-emerald-50 p-5 rounded-2xl border border-emerald-200 text-center text-xs text-emerald-800">
                    <CheckCircle2 className="h-8 w-8 text-emerald-600 mx-auto mb-2 animate-bounce" />
                    <span className="font-bold block text-sm text-slate-900">Query Submitted Successfully!</span>
                    Our admin team received your message and will update you via email within 2 hours. Go to the Admin console to review and simulate replies.
                  </div>
                ) : (
                  <form onSubmit={handleContactSubmit} className="space-y-4 text-xs font-semibold text-slate-300/90">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-slate-400 mb-1">Student Full Name</label>
                        <input
                          id="contact-name-pg"
                          type="text"
                          required
                          value={contactName}
                          onChange={(e) => setContactName(e.target.value)}
                          placeholder="Rajesh Sharma"
                          className="w-full bg-slate-950 border border-slate-850 px-4 py-2.5 rounded-xl text-white outline-none focus:border-brand-orange"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-400 mb-1">Email ID</label>
                        <input
                          id="contact-email-pg"
                          type="email"
                          required
                          value={contactEmail}
                          onChange={(e) => setContactEmail(e.target.value)}
                          placeholder="rajesh@gmail.com"
                          className="w-full bg-slate-950 border border-slate-850 px-4 py-2.5 rounded-xl text-white outline-none focus:border-brand-orange"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-slate-400 mb-1">Subject</label>
                      <input
                        id="contact-subject-pg"
                        type="text"
                        value={contactSubject}
                        onChange={(e) => setContactSubject(e.target.value)}
                        placeholder="Subject regarding syllabus or payment issues..."
                        className="w-full bg-slate-950 border border-slate-850 px-4 py-2.5 rounded-xl text-white outline-none focus:border-brand-orange"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-400 mb-1">Detailed Message</label>
                      <textarea
                        id="contact-message-pg"
                        required
                        rows={4}
                        value={contactMessage}
                        onChange={(e) => setContactMessage(e.target.value)}
                        placeholder="Enter your query or study guidance request here..."
                        className="w-full bg-slate-950 border border-slate-850 px-4 py-2.5 rounded-xl text-white outline-none focus:border-brand-orange resize-none"
                      />
                    </div>

                    <button
                      id="btn-submit-query-pg"
                      type="submit"
                      className="w-full bg-brand-orange hover:bg-brand-orange-hover text-white py-3.5 rounded-2xl font-bold transition-all shadow-md shadow-brand-orange/15 font-display text-sm cursor-pointer"
                    >
                      Submit Message Securely
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        )}

        {/* VIEW E: ABOUT US */}
        {activeTab === 'about' && (
          <div id="about-us-view" className="max-w-4xl mx-auto py-12 px-4 sm:px-6 text-left space-y-8 animate-fadeIn text-slate-300">
            <div className="text-center">
              <h2 className="text-3xl font-black font-display text-white uppercase mb-2">About HandScript Notes</h2>
              <p className="text-xs text-orange-500 font-bold tracking-widest font-mono uppercase">Write Success by Hand</p>
            </div>

            <div className="space-y-4 font-sans text-sm leading-relaxed border border-slate-800 bg-slate-900/40 p-8 rounded-3xl">
              <p>
                <b>HandScript Notes</b> was established by computer science lecturer specialists and pedagogy advisors with a clear core objective: to bring clarity, high efficiency, and human touch back into digital notes-selling operations.
              </p>
              <p>
                Preparing for competitive state PSCs like UP LT Grade, RSMSSB Basic/Senior Instructors, or researchers taking UGC NET Computer Science requires high retention of formulas, step-by-step algorithms, and clear definitions. Traditional textbooks can exceed 500 pages of confusing jargon that consumes crucial revising hours.
              </p>
              <p>
                Our <b>"Unit-wise Selling Model"</b> lets students target exactly where they struggle, paying just ₹20 per subunit instead of investing in costly courses. We provide direct logical layouts on ruled notebook templates to evoke visual pattern tracing in the exam hall.
              </p>
            </div>

            {/* core leadership highlight */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl">
                <span className="font-bold text-white block text-sm">Syllabus-Checked Precision</span>
                <p className="text-xs text-slate-400 mt-1">Every unit is cross-checked against actual prior years exam sheets to ensure perfect question matching.</p>
              </div>
              <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl">
                <span className="font-bold text-white block text-sm">100% Secure Sandbox Transactions</span>
                <p className="text-xs text-slate-400 mt-1">Payments and download streams conform strictly to modern OAuth and SSL cryptographic norms.</p>
              </div>
            </div>
          </div>
        )}

        {/* FOOTER GENERAL POLICY SUBPAGES ROUTING */}
        {activeTab === 'policy_privacy' && (
          <div className="max-w-3xl mx-auto py-12 px-4 text-left space-y-4 text-slate-300">
            <h2 className="text-2xl font-bold font-display text-white">Privacy Policy</h2>
            <p className="text-xs text-slate-500">Last updated: May 2026</p>
            <div className="space-y-4 text-xs leading-relaxed bg-slate-900 p-6 rounded-2xl border border-slate-800">
              <p>HandScript Notes prioritizes user privacy. When you purchase as a Guest or register an Account, we collect minimal information to process secure deliveries: Name, Email ID, and temporary session keys.</p>
              <p>We do not store or transmit actual credit card details or UPI passcodes. All payments are processed inside the secure Razorpay sandbox, protecting your monetary profiles completely.</p>
            </div>
          </div>
        )}

        {activeTab === 'policy_refund' && (
          <div className="max-w-3xl mx-auto py-12 px-4 text-left space-y-4 text-slate-300">
            <h2 className="text-2xl font-bold font-display text-white">Refund & Cancellation Policy</h2>
            <p className="text-xs text-slate-500">Last updated: May 2026</p>
            <div className="space-y-4 text-xs leading-relaxed bg-slate-900 p-6 rounded-2xl border border-slate-800">
              <p>Due to the instantaneous and digital nature of the handwritten notes unit-wise PDF delivery system, we generally operate a <b>no-refund policy after successful downloads</b> occur.</p>
              <p>However, if your account has been charged twice due to a temporary gateway deadlock while checking out, simply submit an inquiry in our query box. Our specialist dashboard responds instantly to reverse double charges.</p>
            </div>
          </div>
        )}

        {activeTab === 'policy_terms' && (
          <div className="max-w-3xl mx-auto py-12 px-4 text-left space-y-4 text-slate-300">
            <h2 className="text-2xl font-bold font-display text-white">Terms & Conditions</h2>
            <p className="text-xs text-slate-500">Last updated: May 2026</p>
            <div className="space-y-4 text-xs leading-relaxed bg-slate-900 p-6 rounded-2xl border border-slate-800">
              <p>Scholars purchasing unit-wise notes from HandScript Notes (HSN) are granted a personal, single-license view right. Under these guidelines, public copying, mass sharing, or re-selling of unlocked notes on messaging boards is strictly forbidden and subject to administrative IT rules.</p>
              <p>Users are responsible for ensuring correct email addresses are inputted at checkout blocks to guarantee clean PDF receipt links dispatching.</p>
            </div>
          </div>
        )}

        {/* VIEW F: HIGH CRAFT SECURE ADMIN PANEL ROUTE */}
        {activeTab === 'admin' && (
          <AdminPanel 
            purchases={purchases}
            queries={queries}
            notesList={notesList}
            onUpdateNotePrice={handleUpdatePrice}
            onUpdateNotePdf={handleUpdateNotePdf}
            onAddNewUnit={handleAddNewUnit}
            onRemoveUnit={handleRemoveUnit}
            onAnswerQuery={handleAnswerQuery}
            onApprovePurchase={handleApprovePurchase}
            onDeclinePurchase={handleDeclinePurchase}
          />
        )}

      </main>

      {/* CORE MODAL OVERS: 1. AUTHENTICATION MODULE */}
      {showAuthModal && (
        <div id="auth-modal-overlay" className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div id="auth-box" className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl p-6 text-left space-y-5">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <span className="font-display font-extrabold text-base text-white">
                {authMode === 'login' ? 'Student Sign In' : 'Create Learner Account'}
              </span>
              <button 
                onClick={() => {
                  setShowAuthModal(false);
                  setAuthError('');
                }} 
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAuthSubmit} className="space-y-4 text-xs font-semibold text-slate-300">
              {authMode === 'signup' && (
                <div>
                  <label className="block text-slate-400 mb-1">State Full Name</label>
                  <input
                    id="auth-signup-name"
                    type="text"
                    required
                    value={authName}
                    onChange={(e) => setAuthName(e.target.value)}
                    placeholder="e.g., Sachin Kumar"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white outline-none focus:border-brand-orange font-sans"
                  />
                </div>
              )}

              <div>
                <label className="block text-slate-400 mb-1">Registered Student Email ID</label>
                <input
                  id="auth-login-email"
                  type="email"
                  required
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                  placeholder="e.g., student@gmail.com"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white outline-none focus:border-brand-orange font-sans"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Password</label>
                <input
                  id="auth-login-password"
                  type="password"
                  required
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white outline-none focus:border-brand-orange"
                />
              </div>

              {authError && <span className="text-red-400 text-[11px] font-sans block">{authError}</span>}

              <button
                id="btn-auth-action-submit"
                type="submit"
                className="w-full bg-brand-orange hover:bg-brand-orange-hover text-white py-3 rounded-xl font-bold tracking-wide mt-2 text-sm cursor-pointer"
              >
                {authMode === 'login' ? 'Secure Sign In' : 'Register Account'}
              </button>
            </form>

            <div className="text-center pt-2 border-t border-slate-800 text-[11px] text-slate-450">
              {authMode === 'login' ? (
                <span className="text-slate-400">
                  New scholar?{' '}
                  <button onClick={() => setAuthMode('signup')} className="text-brand-orange font-bold hover:underline cursor-pointer">
                    Sign Up Free
                  </button>
                </span>
              ) : (
                <span className="text-slate-400">
                  Already registered?{' '}
                  <button onClick={() => setAuthMode('login')} className="text-brand-orange font-bold hover:underline cursor-pointer">
                    Sign In
                  </button>
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* CORE MODAL OVERS: 2. NOTEBOOK READER SIMULATION OVER */}
      {activeReaderUnit && (
        <DocReader
          unit={activeReaderUnit}
          isUnlocked={isUnitUnlocked(activeReaderUnit.id)}
          purchases={purchases}
          user={user}
          onBuy={(unit) => {
            setActiveReaderUnit(null);
            setActiveCheckoutUnit(unit);
          }}
          onClose={() => setActiveReaderUnit(null)}
        />
      )}

      {/* CORE MODAL OVERS: 3. RAZORPAY PAYMENT GATEWAY SECURE MODAL */}
      {activeCheckoutUnit && (
        <PaymentCheckout
          unit={activeCheckoutUnit}
          user={user}
          purchases={purchases}
          onPaymentSuccess={handlePaymentCompleted}
          onClose={() => setActiveCheckoutUnit(null)}
        />
      )}

      {/* DECENT PLAIN SYSTEM FOOTER REQUIRED */}
      <footer className="bg-brand-blue border-t border-slate-900 text-slate-400 text-xs py-12 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-8 text-left">
          
          <div className="space-y-3.5 col-span-1 md:col-span-2">
            <div className="flex items-center space-x-2.5">
              <BookOpen className="h-5 w-5 text-brand-orange" />
              <span className="font-display font-extrabold text-white text-base tracking-wide uppercase">
                HandScript Notes
              </span>
            </div>
            <p className="text-[11px] leading-relaxed text-slate-500 max-w-sm">
              Syllabus-centric handwritten revision suites mapping step-by-step algorithms, solved exam question guides, and theoretical formulas. Write success by hand!
            </p>
          </div>

          <div className="space-y-3.5">
            <span className="font-bold text-white uppercase tracking-wider block text-[11px]">Syllabus Units</span>
            <ul className="space-y-2 text-[11px] font-semibold">
              <li>
                <button onClick={() => { setActiveTab('exams'); setActiveExamId('UGC_NET_CS'); }} className="hover:text-amber-400 cursor-pointer text-left">
                  UGC NET CS notes
                </button>
              </li>
              <li>
                <button onClick={() => { setActiveTab('exams'); setActiveExamId('RSMSSB_BCI'); }} className="hover:text-amber-400 cursor-pointer text-left">
                  RSMSSB Basic Instructor
                </button>
              </li>
              <li>
                <button onClick={() => { setActiveTab('exams'); setActiveExamId('RSMSSB_SCI'); }} className="hover:text-amber-400 cursor-pointer text-left">
                  RSMSSB Senior Instructor
                </button>
              </li>
              <li>
                <button onClick={() => { setActiveTab('exams'); setActiveExamId('UP_LT_GRADE'); }} className="hover:text-amber-400 cursor-pointer text-left">
                  UP PSC LT Grade CS
                </button>
              </li>
            </ul>
          </div>

          <div className="space-y-3.5">
            <span className="font-bold text-white uppercase tracking-wider block text-[11px]">Help & Guidelines</span>
            <ul className="space-y-2 text-[11px] font-semibold">
              <li>
                <button onClick={() => setActiveTab('about')} className="hover:text-amber-400 cursor-pointer text-left">
                  About HandScript Notes
                </button>
              </li>
              <li>
                <button onClick={() => setActiveTab('contact')} className="hover:text-amber-400 cursor-pointer text-left">
                  Contact Specialist
                </button>
              </li>
              <li>
                <button onClick={() => setActiveTab('policy_privacy')} className="hover:text-amber-400 cursor-pointer text-left">
                  Privacy Policy
                </button>
              </li>
              <li>
                <button onClick={() => setActiveTab('policy_refund')} className="hover:text-amber-400 cursor-pointer text-left">
                  Refund & Cancellation Policy
                </button>
              </li>
              <li>
                <button onClick={() => setActiveTab('policy_terms')} className="hover:text-amber-400 cursor-pointer text-left">
                  Terms & Conditions
                </button>
              </li>
            </ul>
          </div>

        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-slate-900 mt-10 pt-4 flex flex-col sm:flex-row justify-between items-center text-[10px] text-slate-600 font-mono">
          <span>HandScript Notes HSN Network © 2026. All rights reserved.</span>
          <span className="mt-2 sm:mt-0 bg-slate-900 border border-slate-850 px-3 py-1 rounded">
            Optimized for Indian Competitors
          </span>
        </div>
      </footer>

    </div>
  );
}
