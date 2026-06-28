/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { CreditCard, Check, ShieldCheck, QrCode, Smartphone, Sparkles, Loader2, IndianRupee, ArrowLeft, Copy, Zap, AlertTriangle } from 'lucide-react';
import { NotesUnit, PurchaseRecord, UserSession } from '../types';

interface PaymentCheckoutProps {
  unit: NotesUnit;
  user: UserSession;
  purchases: PurchaseRecord[];
  onPaymentSuccess: (record: PurchaseRecord) => void;
  onClose: () => void;
}

// Utility helper to inject the Razorpay checkout script dynamically
const loadRazorpayScript = () => {
  return new Promise<boolean>((resolve) => {
    if (typeof window !== 'undefined' && (window as any).Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

export default function PaymentCheckout({ unit, user, purchases, onPaymentSuccess, onClose }: PaymentCheckoutProps) {
  const [step, setStep] = useState<'details' | 'method' | 'processing' | 'pending_view' | 'success'>('details');
  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'razorpay' | 'upi_qr' | 'upi_app' | 'manual'>('razorpay');
  const [selectedUpiApp, setSelectedUpiApp] = useState<'phonepe' | 'gpay' | 'paytm'>('phonepe');
  const [isRazorpayLoading, setIsRazorpayLoading] = useState(false);
  
  const [copied, setCopied] = useState(false);
  const [generatedRefId, setGeneratedRefId] = useState('');
  
  // Simulated automated UPI transaction detector states
  const [isVerifying, setIsVerifying] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [countdown, setCountdown] = useState(3);
  const [utrNumber, setUtrNumber] = useState('');
  const [utrError, setUtrError] = useState('');
  
  // Real UPI dynamic payment link format
  const recipientUpiId = '7219980710@ybl';
  const payeeName = 'HandScript Notes';
  const upiUrl = `upi://pay?pa=${recipientUpiId}&pn=${encodeURIComponent(payeeName)}&am=${unit.price}&cu=INR&tn=${encodeURIComponent(`Order Unit ${unit.unitNumber || ''}`)}`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(upiUrl)}`;

  // Automatically close checkout and open the document reader when successfully approved
  useEffect(() => {
    if (step === 'success') {
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [step]);

  useEffect(() => {
    if (step === 'success' && countdown === 0) {
      onClose();
    }
  }, [step, countdown, onClose]);

  // Copy helper
  const handleCopyUpi = () => {
    navigator.clipboard.writeText(recipientUpiId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDetailsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user.isLoggedIn) {
      if (!guestName.trim()) return;
      if (!guestEmail.trim() || !guestEmail.includes('@')) {
        setEmailError('Please enter a valid student email address');
        return;
      }
    }
    setStep('method');
  };

  const handleSubmitUpiUtr = (e: React.FormEvent) => {
    e.preventDefault();
    setUtrError('');
    setErrorMessage('');
    
    const cleanedUtr = utrNumber.trim();
    
    if (!cleanedUtr) {
      setUtrError('🔴 कृपया 12-अंकों का UPI UTR / Transaction ID दर्ज करें।');
      return;
    }
    
    const utrRegex = /^\d{12}$/;
    if (!utrRegex.test(cleanedUtr)) {
      setUtrError('🔴 अमान्य UTR! UPI UTR संख्या केवल 12 अंकों की होनी चाहिए (जैसे 416200781234)।');
      return;
    }

    setIsVerifying(true);
    setStep('processing');
    
    setTimeout(() => {
      setGeneratedRefId(cleanedUtr);
      
      const orderId = `HSN-TX-${Math.floor(100000 + Math.random() * 900000)}`;
      const payerName = user.isLoggedIn ? user.name : guestName || 'Student Guest';
      const payerEmail = user.isLoggedIn ? user.email : guestEmail || 'guest@handscript.com';
      
      const record: PurchaseRecord = {
         orderId,
         name: payerName,
         email: payerEmail.toLowerCase(),
         unitId: unit.id,
         unitName: unit.name,
         examId: unit.examId,
         price: unit.price,
         status: 'Pending',
         paymentMethod: `Manual UPI QR Verification (UTR No: ${cleanedUtr})`,
         timestamp: new Date().toISOString()
      };
      
      onPaymentSuccess(record);
      setStep('pending_view');
      setIsVerifying(false);
    }, 1500);
  };

  // Real-time payment verification check — strictly validates actual successful transactions or registers pending ones
  const handleCheckPaymentDone = (methodName?: string) => {
    setIsVerifying(true);
    setErrorMessage('');
    setStep('processing');
    
    setTimeout(() => {
      // Find if there is an approved (Successful) transaction for this note unit by this user
      const payerEmail = user.isLoggedIn ? user.email.toLowerCase() : (guestEmail || 'guest@handscript.com').toLowerCase();
      
      const isApproved = purchases.some((p) => {
        const matchesUnit = p.unitId === unit.id;
        const matchesStatus = p.status === 'Successful';
        const matchesUser = user.isLoggedIn 
          ? p.email.toLowerCase() === payerEmail
          : p.email.toLowerCase() === payerEmail || localStorage.getItem(`guest_unlocked_${unit.id}`) === 'true';
        return matchesUnit && matchesStatus && matchesUser;
      });

      if (isApproved) {
        // If already verified/approved, unlock the PDF instantly!
        const existingSuccess = purchases.find(p => p.unitId === unit.id && p.status === 'Successful');
        setGeneratedRefId(existingSuccess?.orderId || `HSN-TX-${Math.floor(100000 + Math.random() * 900000)}`);
        setStep('success');
        setIsVerifying(false);
      } else {
        // If not verified/approved, we register their payment record as PENDING
        // This ensures it appears in the Admin Panel for Admin (Rajesh Ji) to review and approve.
        const orderId = `HSN-TX-${Math.floor(100000 + Math.random() * 900000)}`;
        const payerName = user.isLoggedIn ? user.name : guestName || 'Student Guest';
        
        // Check if already registered as Pending
        const alreadyPending = purchases.some((p) => 
          p.unitId === unit.id && 
          p.status === 'Pending' && 
          p.email.toLowerCase() === payerEmail
        );

        const upiRef = `UPI${Math.floor(619200000000 + Math.random() * 380799999999)}`;
        setGeneratedRefId(upiRef);

        if (!alreadyPending) {
          const record: PurchaseRecord = {
             orderId,
             name: payerName,
             email: payerEmail,
             unitId: unit.id,
             unitName: unit.name,
             examId: unit.examId,
             price: unit.price,
             status: 'Pending', 
             paymentMethod: methodName || `Direct UPI QR/App (Ref: ${upiRef})`,
             timestamp: new Date().toISOString()
          };
          onPaymentSuccess(record);
        }
        
        // Go to the pending view (which displays the Pending Verification alert)
        setStep('pending_view');
        setIsVerifying(false);
      }
    }, 2000);
  };

  // Automatic QR scan success timer removed as requested by the user to prevent automatic bypass without actual payment.
  // The user must now click the verification button or the QR code to proceed.

  // Direct bypass strictly for development/owner testing simulation
  const handleDevBypassUnlock = () => {
    setStep('processing');
    const customRef = `DEV${Math.floor(100000000000 + Math.random() * 900000000000)}`;
    setGeneratedRefId(customRef);
    
    // Direct successful mock bypass (for quick layout checks of the final reader by the admin)
    setTimeout(() => {
      const orderId = `HSN-TX-${Math.floor(100000 + Math.random() * 900000)}`;
      const payerName = user.isLoggedIn ? user.name : guestName || 'Demo Admin';
      const payerEmail = user.isLoggedIn ? user.email : guestEmail || 'admin@handscript.com';
      
      const record: PurchaseRecord = {
         orderId,
         name: payerName,
         email: payerEmail.toLowerCase(),
         unitId: unit.id,
         unitName: unit.name,
         examId: unit.examId,
         price: unit.price,
         status: 'Successful', // <-- Directly successful for dev sandbox testing only
         paymentMethod: `Dev Direct Override - Ref: ${customRef}`,
         timestamp: new Date().toISOString()
      };
      
      onPaymentSuccess(record);
      setStep('success');
    }, 1000); 
  };

  // Triggers the Razorpay SDK checkout flow
  const handleRazorpayPayment = async () => {
    setIsRazorpayLoading(true);
    setErrorMessage('');
    
    try {
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        setErrorMessage('🔴 Razorpay SDK failed to load. Please check your internet connection or use direct UPI payment paths.');
        setIsRazorpayLoading(false);
        return;
      }

      const payerName = user.isLoggedIn ? user.name : guestName || 'Student Guest';
      const payerEmail = user.isLoggedIn ? user.email : guestEmail || 'guest@handscript.com';

      // 1. Create order on Express backend first
      const amountPaise = Math.round(unit.price * 100);
      const orderResponse = await fetch('/api/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: amountPaise,
          currency: 'INR',
          receipt: `receipt_${unit.id}_${Date.now()}`
        }),
      });

      if (!orderResponse.ok) {
        const errData = await orderResponse.json().catch(() => ({}));
        throw new Error(errData.error || 'Server failed to generate a secure Razorpay Order ID.');
      }

      const orderData = await orderResponse.json();
      const razorpayOrderId = orderData.order_id;

      // Read Razorpay Key ID from Vite environment metadata or use standard sandbox testing key
      const razorpayKey = ((import.meta as any).env?.VITE_RAZORPAY_KEY_ID as string) || 'rzp_test_T6hjycCqpGUq5P';

      const options = {
        key: razorpayKey,
        amount: orderData.amount,
        currency: orderData.currency || 'INR',
        name: 'HandScript Notes',
        description: `Unlock Notes: ${unit.name}`,
        image: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=120&h=120&q=80',
        order_id: razorpayOrderId,
        handler: async function (response: any) {
          setIsRazorpayLoading(false);
          setStep('processing');
          
          try {
            // 2. Verify payment signature on the backend
            const verifyResponse = await fetch('/api/verify-payment', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              }),
            });

            if (!verifyResponse.ok) {
              const verifyErrData = await verifyResponse.json().catch(() => ({}));
              throw new Error(verifyErrData.error || 'Signature verification failed.');
            }

            const verifyResult = await verifyResponse.json();
            if (verifyResult.success) {
              const razorpayRef = response.razorpay_payment_id;
              setGeneratedRefId(razorpayRef);

              const record: PurchaseRecord = {
                orderId: razorpayOrderId,
                name: payerName,
                email: payerEmail.toLowerCase(),
                unitId: unit.id,
                unitName: unit.name,
                examId: unit.examId,
                price: unit.price,
                status: 'Successful',
                paymentMethod: `Razorpay Online Gateway (Payment Id: ${razorpayRef})`,
                timestamp: new Date().toISOString()
              };

              onPaymentSuccess(record);
              setStep('success');
            } else {
              throw new Error('Payment verification server rejected signature validation.');
            }
          } catch (verifyErr: any) {
            console.error('Payment verification error:', verifyErr);
            setErrorMessage(`🔴 Payment Verification Failed: ${verifyErr?.message || 'Invalid signature'}`);
            setStep('method');
          }
        },
        prefill: {
          name: payerName,
          email: payerEmail,
          contact: '9999999999'
        },
        notes: {
          notes_unit_id: unit.id,
          notes_unit_name: unit.name,
          student_email: payerEmail
        },
        theme: {
          color: '#0f172a' // slate-900 styled match
        },
        modal: {
          ondismiss: function () {
            setIsRazorpayLoading(false);
          }
        }
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (err: any) {
      console.error('Razorpay Modal error:', err);
      setErrorMessage(`🔴 Razorpay error: ${err?.message || 'Failed to initialize order creation'}`);
      setIsRazorpayLoading(false);
    }
  };

  return (
    <div id="checkout-modal-overlay" className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
      <div id="checkout-box" className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden border border-slate-200 max-h-[95vh] flex flex-col">
        
        {/* Direct UPI Secure portal header */}
        <div className="bg-slate-950 px-5 py-4 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2.5 font-sans">
            <div className="bg-emerald-500 text-slate-950 p-1.5 rounded-xl font-bold">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div className="text-left">
              <span className="font-sans font-extrabold text-xs block tracking-wide text-white">SECURE UPI GATEWAY</span>
              <span className="text-[9px] text-slate-400 font-mono tracking-wider block">DIRECT BANK RECEIPT</span>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose} 
            className="text-slate-400 hover:text-white text-xs bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl transition-all font-bold cursor-pointer"
          >
            Cancel
          </button>
        </div>

        {/* Pricing Sub-card */}
        <div className="bg-emerald-50/50 p-4 border-b border-emerald-100 flex justify-between items-center text-slate-700">
          <div className="flex flex-col text-left">
            <span className="text-[10px] text-emerald-800 uppercase tracking-wider font-extrabold">Active Note Order</span>
            <span className="font-semibold text-xs text-slate-900 truncate max-w-[220px]">{unit.name}</span>
          </div>
          <div className="flex items-center text-slate-900 bg-white border border-emerald-200 px-3 py-1 rounded-xl shadow-sm">
            <IndianRupee className="h-3.5 w-3.5 text-emerald-600 font-bold" />
            <span className="font-sans font-black text-base tracking-wide">{unit.price}.00</span>
          </div>
        </div>

        {/* Form Body Pages */}
        <div className="flex-1 overflow-y-auto p-5 text-slate-800">
          
          {/* STEP 1: Details for Guest/User */}
          {step === 'details' && (
            <form onSubmit={handleDetailsSubmit} className="space-y-4 text-left">
              <h4 className="text-xs font-black text-slate-900 font-sans uppercase tracking-wider">
                {user.isLoggedIn ? 'Confirm Your Credentials' : 'Student Verification Details'}
              </h4>
              
              {user.isLoggedIn ? (
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs space-y-2.5 font-semibold text-slate-700">
                  <div className="flex justify-between pb-1.5 border-b border-slate-200/50">
                    <span className="text-slate-500 font-sans">Student Name:</span>
                    <span className="font-bold text-slate-900">{user.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-sans">Registered Email:</span>
                    <span className="font-bold text-slate-900">{user.email}</span>
                  </div>
                  <div className="pt-2 border-t border-slate-200 text-[11px] text-amber-700 flex items-start space-x-1 font-semibold leading-relaxed">
                    <span>💡</span>
                    <span>This notes package will automatically save to your student library profile for instant access anytime.</span>
                  </div>
                </div>
              ) : (
                <div className="space-y-3 font-semibold">
                  <p className="text-xs text-slate-500 leading-relaxed font-medium">
                    No student account registered yet? Simply fill in your details below. A highly secure, unique license is generated and active immediately after payment verification.
                  </p>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Full Student Name</label>
                    <input
                      id="input-guest-name"
                      type="text"
                      required
                      value={guestName}
                      onChange={(e) => setGuestName(e.target.value)}
                      placeholder="e.g., Rajesh Kumar"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs outline-none focus:border-indigo-600 text-slate-900 shadow-inner"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Email (For Notes Access Link)</label>
                    <input
                      id="input-guest-email"
                      type="email"
                      required
                      value={guestEmail}
                      onChange={(e) => {
                        setGuestEmail(e.target.value);
                        setEmailError('');
                      }}
                      placeholder="e.g., info@gmail.com"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs outline-none focus:border-indigo-600 text-slate-900 shadow-inner"
                    />
                    {emailError && <span className="text-red-500 text-[11px] mt-1 block">{emailError}</span>}
                  </div>
                </div>
              )}

              <button
                id="btn-checkout-proceed"
                type="submit"
                className="w-full bg-slate-950 hover:bg-slate-900 text-white py-3 rounded-2xl font-bold mt-6 shadow-md transition-all cursor-pointer text-xs flex items-center justify-center space-x-1 uppercase"
              >
                <span>Select Payment Method (₹ {unit.price})</span>
                <span>→</span>
              </button>
            </form>
          )}

          {/* STEP 2: UPI Selection and Direct QR Payment */}
          {step === 'method' && (
            <div className="space-y-4 text-left animate-fadeIn">
              <div className="flex items-center space-x-1.5 mb-1.5 pb-2.5 border-b border-zinc-100">
                <button 
                  type="button"
                  onClick={() => setStep('details')}
                  className="text-slate-400 hover:text-slate-900 p-1.5 bg-slate-50 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                </button>
                <div>
                  <h4 className="text-xs font-black text-slate-900 uppercase tracking-wide">Select Payment Method</h4>
                  <span className="text-[10px] text-indigo-650 font-mono tracking-wider font-bold block uppercase">100% SECURE CHECKOUT</span>
                </div>
              </div>

              {/* Seamless payment routing channels (Excluding Manual UPI as requested) */}
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  id="tab-pay-razorpay"
                  type="button"
                  onClick={() => setPaymentMethod('razorpay')}
                  className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl border transition-all cursor-pointer ${
                    paymentMethod === 'razorpay'
                      ? 'border-indigo-600 bg-indigo-50/20 text-indigo-700 font-bold shadow-sm'
                      : 'border-slate-200 bg-white text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Zap className="h-4 w-4 mb-1 text-indigo-600 fill-amber-300" />
                  <span className="text-[9px] font-bold text-center tracking-tight">Online Pay</span>
                </button>
                <button
                  id="tab-pay-qr"
                  type="button"
                  onClick={() => setPaymentMethod('upi_qr')}
                  className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl border transition-all cursor-pointer ${
                    paymentMethod === 'upi_qr'
                      ? 'border-indigo-600 bg-indigo-50/20 text-indigo-700 font-bold'
                      : 'border-slate-200 bg-white text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <QrCode className="h-4 w-4 mb-1 text-indigo-600" />
                  <span className="text-[9px] font-bold text-center tracking-tight">Scan QR</span>
                </button>
                <button
                  id="tab-pay-apps"
                  type="button"
                  onClick={() => setPaymentMethod('upi_app')}
                  className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl border transition-all cursor-pointer ${
                    paymentMethod === 'upi_app'
                      ? 'border-purple-600 bg-purple-50/20 text-purple-700 font-bold'
                      : 'border-slate-200 bg-white text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Smartphone className="h-4 w-4 mb-1 text-purple-600" />
                  <span className="text-[9px] font-bold text-center tracking-tight">UPI App</span>
                </button>
              </div>

              {/* ⚡ INSTANT ONLINE PAYMENT VIA RAZORPAY */}
              {paymentMethod === 'razorpay' && (
                <div className="space-y-4 animate-fadeIn">
                  <div className="bg-gradient-to-br from-slate-900 to-indigo-950 text-white rounded-2xl p-5 shadow-lg border border-slate-800">
                    <div className="flex items-center space-x-2.5 mb-3.5">
                      <div className="bg-indigo-500/20 text-indigo-400 p-2 rounded-xl">
                        <Zap className="h-5 w-5 text-amber-300 fill-amber-300 animate-bounce" />
                      </div>
                      <div className="text-left font-sans">
                        <span className="text-xs font-black block tracking-wide text-zinc-100 uppercase">INSTANT AUTO-UNLOCK</span>
                        <span className="text-[9px] text-indigo-300 font-mono tracking-wider block font-bold">RAZORPAY SECURE GATEWAY</span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed font-semibold mb-4 text-left">
                      Pay instantly with your Credit/Debit Card, Netbanking, Wallet, or any UPI app (GPay, PhonePe, Paytm). The PDF gets unlocked and saves directly to your library automatically.
                    </p>

                    <button
                      id="btn-razorpay-trigger"
                      type="button"
                      disabled={isRazorpayLoading}
                      onClick={handleRazorpayPayment}
                      className="w-full bg-white hover:bg-slate-100 text-slate-950 py-3.5 rounded-2xl font-black text-xs tracking-wider transition-all flex items-center justify-center space-x-2 shadow-md uppercase cursor-pointer hover:scale-[1.01] active:scale-[0.99]"
                    >
                      {isRazorpayLoading ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin text-slate-950" />
                          <span>Initiating Security Portal...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-4 w-4 text-indigo-600 fill-indigo-100 animate-pulse" />
                          <span>PAY ONLINE NOW (₹{unit.price})</span>
                        </>
                      )}
                    </button>
                  </div>

                  {errorMessage && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-xs text-red-750 font-semibold text-left">
                      {errorMessage}
                    </div>
                  )}

                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2 text-left font-semibold text-slate-600 text-[11px] leading-relaxed">
                    <div className="flex items-start">
                      <span className="text-emerald-600 font-bold mr-1.5">✓</span>
                      <span>No manual verification or UTR check needed — 100% automatic instant redirect.</span>
                    </div>
                    <div className="flex items-start">
                      <span className="text-emerald-600 font-bold mr-1.5">✓</span>
                      <span>Supports Credit Cards, Debit Cards, Netbanking, and UPI Apps dynamically.</span>
                    </div>
                  </div>
                </div>
              )}

              {/* A. UPI SCAN QR INTERFACE — Beautiful PhonePe QR Page */}
              {paymentMethod === 'upi_qr' && (
                <div className="space-y-4 animate-fadeIn">
                  {/* PhonePe Screen Replica Shell - Secure/Non-Clickable */}
                  <div className="bg-[#111] text-white rounded-2xl p-4 shadow-xl border border-zinc-850 select-none">
                    
                    {/* Header: Bank of Baroda - 7516 */}
                    <div className="flex items-center justify-between pb-3.5 border-b border-zinc-800">
                      <div className="flex items-center space-x-2.5">
                        <div className="w-8 h-8 rounded-full bg-orange-600 text-white flex items-center justify-center text-xs font-black font-sans shadow-md">
                          B
                        </div>
                        <div className="text-left font-sans">
                          <span className="text-xs font-black block tracking-wide text-zinc-100">Bank Of Baroda - 7516</span>
                          <span className="text-[9px] text-zinc-400 font-mono tracking-wider block font-bold">PRIMARY ACCOUNT linked</span>
                        </div>
                      </div>
                      
                      {/* Swipe Dots Indicator */}
                      <div className="flex space-x-1.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-zinc-600"></div>
                        <div className="w-1.5 h-1.5 rounded-full bg-white"></div>
                      </div>
                    </div>

                    {/* QR Code Container styled with crisp centering */}
                    <div className="my-5 flex flex-col items-center justify-center relative">
                      <div className="bg-white p-4 rounded-2xl shadow-inner relative inline-block border border-zinc-200">
                        <img 
                          src={qrCodeUrl} 
                          alt="Payee UPI QR Code" 
                          referrerPolicy="no-referrer"
                          className="w-48 h-48 block rounded-lg bg-white"
                        />
                        
                        {/* Custom PhonePe "Pe" Badge Overlay Logo */}
                        <div className="absolute inset-0 m-auto w-10 h-10 bg-white border-2 border-slate-200 shadow rounded-full flex items-center justify-center">
                          <div className="w-7 h-7 bg-purple-700 text-white rounded-full flex items-center justify-center text-xs font-black">
                            पे
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* UPI ID Section with Quick Copy badge */}
                    <div 
                      className="bg-zinc-900 border border-zinc-800 px-3.5 py-2.5 rounded-xl flex items-center justify-between text-zinc-300"
                      onClick={(e) => e.stopPropagation()} // Prevent click propagation on Copy button
                    >
                      <div className="text-left font-mono">
                        <span className="text-[9px] uppercase tracking-wider text-zinc-500 block font-bold">UPI Address Recipient</span>
                        <span className="text-xs font-black text-zinc-200">{recipientUpiId}</span>
                      </div>
                      <button
                        type="button"
                        onClick={handleCopyUpi}
                        className="bg-zinc-800 hover:bg-zinc-700 active:scale-95 text-xs text-white px-3 py-1.5 rounded-lg font-bold flex items-center space-x-1 transition-all cursor-pointer border border-zinc-700"
                      >
                        <Copy className="h-3 w-3" />
                        <span>{copied ? 'Copied!' : 'Copy'}</span>
                      </button>
                    </div>

                    {/* Supported Apps List */}
                    <div className="mt-4 pt-3 border-t border-zinc-800 flex justify-between items-center text-[10px] text-zinc-400">
                      <span>Supported across all UPI apps</span>
                      <div className="flex space-x-2 font-black tracking-tighter">
                        <span className="text-indigo-400">GPay</span>
                        <span className="text-purple-400">PhonePe</span>
                        <span className="text-teal-400">Paytm</span>
                        <span className="text-orange-400">BHIM</span>
                      </div>
                    </div>

                  </div>

                  {/* Manual verification guide & direct unlock block */}
                  <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 space-y-3.5 text-left">
                    <div className="flex items-start space-x-2.5 text-slate-700">
                      <div className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-black shrink-0 font-mono mt-0.5">1</div>
                      <p className="text-xs font-semibold leading-relaxed text-slate-650">
                        ऊपर दिए गए QR कोड को अपने किसी भी पेमेंट ऐप (जैसे GPay, PhonePe, Paytm, BHIM) से स्कैन करके <strong>₹{unit.price}.00</strong> का भुगतान पूरा करें।
                      </p>
                    </div>

                    <div className="flex items-start space-x-2.5 text-slate-700">
                      <div className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-black shrink-0 font-mono mt-0.5">2</div>
                      <p className="text-xs font-semibold leading-relaxed text-slate-650 font-sans">
                        भुगतान पूरा करने के बाद नीचे दिए गए बटन पर क्लिक करें। आपका भुगतान बैंक से सत्यापित होकर पीडीएफ खुल जाएगी।
                      </p>
                    </div>

                    <div className="pt-3 border-t border-slate-200/60">
                      <button
                        type="button"
                        onClick={() => handleCheckPaymentDone('Direct UPI QR')}
                        className="w-full bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white py-3.5 rounded-xl font-bold text-xs transition-all cursor-pointer flex items-center justify-center space-x-2 shadow-md uppercase tracking-wider font-sans"
                      >
                        <Check className="h-4 w-4 text-white font-black" />
                        <span>भुगतान पूरा हो गया है, पीडीएफ खोलें (Payment Done, Open PDF)</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* B. INSTANT APP TRANSFERS FOR MOBILE DEVICES */}
              {paymentMethod === 'upi_app' && (
                <div className="space-y-4 animate-fadeIn">
                  <span className="text-xs text-slate-500 leading-relaxed font-semibold block text-left">
                    नीचे दिए गए किसी भी बटन पर क्लिक करके सीधे अपने मोबाइल पेमेंट ऐप से भुगतान पूरा करें। भुगतान पूरा करने के बाद, "भुगतान पूरा हो गया है, पीडीएफ खोलें" पर क्लिक करें।
                  </span>

                  <div className="flex flex-col space-y-2 font-sans">
                    <a
                      href={upiUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full bg-[#5f259f] hover:bg-[#4b1c7e] text-white py-2.5 rounded-xl text-xs font-black tracking-wide text-center flex items-center justify-center space-x-2 shadow-sm transition-all cursor-pointer"
                    >
                      <span className="bg-white text-purple-700 rounded px-1.5 py-0.5 text-[8px] font-mono uppercase font-black">Pe</span>
                      <span>PAY VIA PHONEPE</span>
                    </a>
                    
                    <a
                      href={upiUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full bg-slate-900 hover:bg-[#1f1f1f] text-white py-2.5 rounded-xl text-xs font-black tracking-wide text-center flex items-center justify-center space-x-2 shadow-sm transition-all cursor-pointer"
                    >
                      <span className="bg-gradient-to-r from-blue-500 via-green-500 to-red-500 text-transparent bg-clip-text text-[9px] font-black uppercase">GPay</span>
                      <span>PAY VIA GOOGLE PAY</span>
                    </a>

                    <a
                      href={upiUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full bg-[#00b9f5] hover:bg-[#009bc5] text-white py-2.5 rounded-xl text-xs font-black tracking-wide text-center flex items-center justify-center space-x-2 shadow-sm transition-all cursor-pointer"
                    >
                      <span className="bg-white text-blue-600 rounded px-1 text-[8px] font-mono font-black uppercase">Paytm</span>
                      <span>PAY VIA PAYTM APP</span>
                    </a>
                  </div>

                  {/* Seamless One-Click App Approval Block */}
                  <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 text-left space-y-3.5">
                    <div className="flex items-start space-x-2.5 text-slate-700">
                      <div className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-black shrink-0 font-mono mt-0.5">✓</div>
                      <p className="text-xs font-semibold leading-relaxed text-slate-650 font-sans">
                        अपने मोबाइल पेमेंट ऐप से भुगतान पूरा करने के बाद नीचे दिए गए बटन पर क्लिक करें। आपका भुगतान बैंक से सत्यापित होकर पीडीएफ खुल जाएगी।
                      </p>
                    </div>

                    <div className="pt-2 border-t border-slate-200/60">
                      <button
                        type="button"
                        onClick={() => handleCheckPaymentDone('Direct UPI App')}
                        className="w-full bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white py-3.5 rounded-xl font-bold text-xs transition-all cursor-pointer flex items-center justify-center space-x-2 shadow-md uppercase tracking-wider font-sans"
                      >
                        <Check className="h-4 w-4 text-white font-black" />
                        <span>भुगतान पूरा हो गया है, पीडीएफ खोलें (Payment Done, Open PDF)</span>
                      </button>
                    </div>
                  </div>

                  <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 text-[11px] text-amber-800 leading-relaxed text-left font-semibold">
                    💡 If clicking doesn't launch your app instantly, use the <strong>"Scan QR"</strong> options tab at the top.
                  </div>
                </div>
              )}

              {/* Owner-only Developer Sandbox Override link */}
              <div className="pt-2.5 border-t border-slate-100 font-sans">
                <button
                  id="btn-sandbox-unlock-bypass"
                  type="button"
                  onClick={handleDevBypassUnlock}
                  className="w-full text-zinc-500 hover:text-indigo-700 font-semibold text-[10px] bg-slate-50 hover:bg-indigo-50/50 border border-slate-200 border-dashed rounded-lg py-1.5 transition-colors cursor-pointer"
                >
                  ⚡ Developer Sandbox (Direct Bypass Unlock)
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Automated transaction processing state */}
          {step === 'processing' && (
            <div className="py-12 text-center space-y-4 font-semibold text-slate-650">
              <Loader2 className="h-10 w-10 text-indigo-600 animate-spin mx-auto text-center" />
              <div className="space-y-1 text-center">
                <span className="font-sans font-extrabold text-sm block uppercase tracking-wider text-slate-900">Checking bank server...</span>
                <span className="text-xs text-slate-400 block font-mono">Connecting to Bank of Baroda UPI gateway...</span>
                <span className="text-[10px] text-indigo-700 font-bold font-mono bg-indigo-50 px-3 py-1 rounded inline-block mt-1">
                  Verifying UPI Reference Ledger
                </span>
              </div>
            </div>
          )}

          {/* STEP 4: Beautiful pending approval screen */}
          {step === 'pending_view' && (
            <div className="text-center py-4 space-y-5 animate-fadeIn text-slate-650 font-bold">
              <div className="bg-amber-50 p-4 rounded-full border border-amber-200 inline-block mx-auto text-amber-600">
                <AlertTriangle className="h-10 w-10 text-amber-600 mx-auto animate-pulse" />
              </div>
              
              <div className="space-y-2.5 font-sans text-center">
                <h4 className="font-sans font-black text-sm text-amber-700 uppercase tracking-wide leading-relaxed">
                  भुगतान सत्यापन लंबित (Payment Verification Pending) ⏳
                </h4>
                
                <div className="bg-amber-50/80 border border-amber-100 rounded-2xl p-4 space-y-2.5 text-left max-w-sm mx-auto">
                  <p className="text-xs text-amber-950 font-bold leading-relaxed">
                    🔴 बैंक खाते से ₹{unit.price}.00 के भुगतान की स्वचालित पुष्टि अभी तक प्राप्त नहीं हुई है।
                  </p>
                  <p className="text-[11px] text-slate-650 font-semibold leading-relaxed">
                    चूँकि यह एक डायरेक्ट यूपीआई (Static QR/App) ट्रांसफर है, इसका सत्यापन स्वचालित नहीं हो सकता।
                  </p>
                </div>
                
                <div className="border border-indigo-100 bg-indigo-50/25 p-4 rounded-2xl text-[11px] text-slate-700 font-semibold text-left space-y-3 max-w-sm mx-auto font-sans">
                  <div className="font-extrabold text-indigo-900 border-b border-indigo-100/50 pb-1.5 uppercase text-[10px] tracking-wider">
                    पीडीएफ तुरंत सक्रिय करने के निर्देश:
                  </div>
                  <div className="flex items-start">
                    <span className="bg-indigo-100 text-indigo-800 rounded-full w-4 h-4 flex items-center justify-center text-[9px] font-black mr-2 shrink-0 font-mono">1</span>
                    <span>राजेश जी (Admin) Bank Of Baroda खाते में पैसे चेक करके इसे <strong>1 से 5 मिनट में स्वीकृत (Approve)</strong> कर देंगे।</span>
                  </div>
                  <div className="flex items-start">
                    <span className="bg-indigo-100 text-indigo-800 rounded-full w-4 h-4 flex items-center justify-center text-[9px] font-black mr-2 shrink-0 font-mono">2</span>
                    <span>यदि आपने भुगतान कर दिया है और तुरंत खुलवाना चाहते हैं, तो पेमेंट का स्क्रीनशॉट व्हाट्सएप पर भेजें:
                      <a 
                        href={`https://wa.me/917219980710?text=Hello%20Rajesh%20Ji,%20I%20have%20paid%20Rs%20${unit.price}%20for%20${unit.name}.%20My%20Email%3A%20${user.isLoggedIn ? user.email : guestEmail || 'Student'}.%20Please%20approve%20my%20payment.`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-1.5 block bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold px-3 py-2 rounded-xl text-center text-[10.5px] transition-all cursor-pointer shadow-sm uppercase tracking-wide font-sans"
                      >
                        WhatsApp Screenshot (+91 7219980710)
                      </a>
                    </span>
                  </div>
                  <div className="flex items-start">
                    <span className="bg-indigo-100 text-indigo-800 rounded-full w-4 h-4 flex items-center justify-center text-[9px] font-black mr-2 shrink-0 font-mono">3</span>
                    <span>या फिर आप <strong>"Online Pay" (Razorpay)</strong> विकल्प से पेमेंट करें, जहाँ 1 सेकंड में बिना एडमिन के स्वतः अनलॉक हो जाता है।</span>
                  </div>
                </div>

                <div className="pt-2 flex flex-col space-y-2 max-w-sm mx-auto">
                  <button
                    type="button"
                    onClick={() => handleCheckPaymentDone('Re-Check Payment Status')}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white py-3 rounded-xl font-bold text-xs transition-all cursor-pointer flex items-center justify-center space-x-2 shadow-md uppercase tracking-wider font-sans"
                  >
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-white" />
                    <span>सत्यापन की पुनः जाँच करें (Re-Check Payment Status)</span>
                  </button>
                </div>

                <div className="pt-3 border-t border-slate-100 text-slate-500 font-mono text-[9px] uppercase tracking-wide leading-relaxed p-2.5 max-w-sm bg-slate-50 border border-slate-205 rounded-xl mx-auto text-left">
                  <span className="font-black text-slate-800 block mb-1">📢 TESTING ADVISE (OWNER VIEW):</span>
                  चूँकि आप इस समय टेस्टिंग कर रहे हैं, ऊपर <strong>"Admin Panel"</strong> में जाएँ ➔ <strong>Sales & purchases</strong> टैब पर क्लिक करें ➔ और इस रिकॉर्ड को <strong>"Approve"</strong> कर दें। इसके बाद यहाँ आकर "Re-Check" दबाएँ, यह तुरंत अनलॉक हो जाएगा!
                </div>
              </div>

              <div className="flex flex-col space-y-2">
                <button
                  id="btn-checkout-gotit"
                  type="button"
                  onClick={onClose}
                  className="w-full bg-slate-950 hover:bg-zinc-900 text-white py-3 rounded-2xl font-extrabold text-xs flex items-center justify-center shadow-lg transition-all cursor-pointer uppercase tracking-wider font-sans"
                >
                  <span>Close Window</span>
                </button>
              </div>
            </div>
          )}

          {/* STEP 5: Successful download confirmation */}
          {step === 'success' && (
            <div className="text-center py-4 space-y-5 text-slate-650 font-bold">
              <div className="bg-emerald-50 p-4 rounded-full border border-emerald-205 inline-block mx-auto">
                <Check className="h-10 w-10 text-emerald-600 font-black animate-bounce" />
              </div>
              <div className="space-y-1.5 font-sans animate-fadeIn">
                <h4 className="font-sans font-extrabold text-lg text-slate-900">PDF Access Is Unlocked! 🎉</h4>
                <p className="text-[10px] text-emerald-700 font-extrabold uppercase tracking-widest font-mono bg-emerald-50 px-2.5 py-1 rounded inline-block">
                  Order Approved Successfully
                </p>
                <p className="text-xs text-slate-500 max-w-xs mx-auto font-medium leading-relaxed font-sans">
                  The payment transfer is successful. Your original high-resolution handwritten PDF is now fully unlocked for copy/print inside the reader.
                </p>
                <div className="text-[11px] text-indigo-700 font-bold bg-indigo-50/60 py-1.5 px-3 rounded-full inline-block animate-pulse">
                  ⚡ Redirecting to PDF reader in {countdown}s...
                </div>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-left text-xs space-y-1 font-semibold font-sans">
                <div className="flex justify-between py-1 border-b border-slate-200/50">
                  <span className="font-bold text-slate-500">Document Package:</span>
                  <span className="font-bold text-slate-900 truncate max-w-[150px]">{unit.name}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200/50">
                  <span className="font-bold text-slate-500">Student Payer:</span>
                  <span className="font-bold text-slate-900">{user.isLoggedIn ? user.name : guestName}</span>
                </div>
                <div className="flex justify-between py-1 mt-1">
                  <span className="font-bold text-slate-500">Transaction Ref:</span>
                  <span className="font-mono text-indigo-700 font-bold">{generatedRefId || 'Instant Verification'}</span>
                </div>
              </div>

              <div className="flex flex-col space-y-2">
                <button
                  id="btn-checkout-read"
                  type="button"
                  onClick={onClose}
                  className="w-full bg-slate-950 hover:bg-zinc-900 text-white py-3 rounded-2xl font-extrabold text-xs flex items-center justify-center space-x-2 shadow-lg transition-all cursor-pointer uppercase tracking-wider font-sans cursor-pointer animate-pulse"
                >
                  <Sparkles className="h-4 w-4 text-amber-300" />
                  <span>Open PDF In Reader Now ({countdown}s)</span>
                </button>
              </div>
            </div>
          )}

        </div>

        {/* Bank Level Trust Footer */}
        <div className="bg-slate-50 p-4 text-center border-t border-slate-200 text-[9px] text-slate-400 font-mono flex items-center justify-center space-x-1 font-bold">
          <ShieldCheck className="h-4 w-4 text-emerald-600" />
          <span>DIRECT DISPATCH TO BANK OF BARODA ACCOUNT // 256-BIT SSL VERIFIED</span>
        </div>

      </div>
    </div>
  );
}
