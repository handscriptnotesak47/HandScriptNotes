/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { CreditCard, Check, ShieldCheck, QrCode, Smartphone, Sparkles, Loader2, IndianRupee, ArrowLeft, Download, ExternalLink } from 'lucide-react';
import { NotesUnit, PurchaseRecord, UserSession } from '../types';

interface PaymentCheckoutProps {
  unit: NotesUnit;
  user: UserSession;
  onPaymentSuccess: (record: PurchaseRecord) => void;
  onClose: () => void;
}

export default function PaymentCheckout({ unit, user, onPaymentSuccess, onClose }: PaymentCheckoutProps) {
  const [step, setStep] = useState<'details' | 'method' | 'processing' | 'success'>('details');
  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'upi_qr' | 'upi_app' | 'card'>('upi_qr');
  const [selectedUpiApp, setSelectedUpiApp] = useState<'gpay' | 'phonepe' | 'paytm'>('gpay');
  const [upiId, setUpiId] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  
  // Timer for QR code simulation
  const [qrMinutes, setQrMinutes] = useState(2);
  const [qrSeconds, setQrSeconds] = useState(59);

  useEffect(() => {
    if (step === 'method' && paymentMethod === 'upi_qr') {
      const timer = setInterval(() => {
        if (qrSeconds > 0) {
          setQrSeconds(qrSeconds - 1);
        } else if (qrMinutes > 0) {
          setQrMinutes(qrMinutes - 1);
          setQrSeconds(59);
        }
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [step, paymentMethod, qrSeconds, qrMinutes]);

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

  // Payment process simulation
  const handlePaymentSimulate = () => {
    setStep('processing');
    setTimeout(() => {
      const orderId = `HSN-TX-${Math.floor(100000 + Math.random() * 900000)}`;
      const payerName = user.isLoggedIn ? user.name : guestName;
      const payerEmail = user.isLoggedIn ? user.email : guestEmail;
      
      const record: PurchaseRecord = {
         orderId,
         name: payerName,
         email: payerEmail,
         unitId: unit.id,
         unitName: unit.name,
         examId: unit.examId,
         price: unit.price,
         status: 'Successful',
         paymentMethod: paymentMethod === 'upi_qr' ? 'UPI QR Code' : paymentMethod === 'upi_app' ? `UPI - ${selectedUpiApp.toUpperCase()}` : 'Debit/Credit Card',
         timestamp: new Date().toISOString()
      };
      
      onPaymentSuccess(record);
      setStep('success');
    }, 2500); // realistic spinner auth timing
  };

  return (
    <div id="checkout-modal-overlay" className="fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
      <div id="checkout-box" className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden border border-slate-205 max-h-[90vh] flex flex-col border-slate-200">
        
        {/* Razorpay stylized header */}
        <div className="bg-slate-50 p-5 border-b border-slate-200 flex items-center justify-between text-slate-800">
          <div className="flex items-center space-x-2">
            <span className="font-display font-black text-lg text-slate-900">Razorpay</span>
            <span className="bg-emerald-50 text-emerald-800 text-[10px] uppercase font-mono px-2 py-0.5 rounded font-bold border border-emerald-200">
              Sandbox Live
            </span>
          </div>
          <button 
            type="button"
            onClick={onClose} 
            className="text-slate-500 hover:text-slate-900 text-xs bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-xl transition-colors cursor-pointer font-bold"
          >
            Cancel
          </button>
        </div>

        {/* Pricing Sub-card */}
        <div className="bg-slate-50/50 p-4 border-b border-slate-100 flex justify-between items-center text-slate-700">
          <div className="flex flex-col text-left">
            <span className="text-xs text-slate-400">Purchasing Note</span>
            <span className="font-semibold text-sm text-slate-800 truncate max-w-[220px]">{unit.name}</span>
          </div>
          <div className="flex items-center text-amber-600">
            <IndianRupee className="h-4 w-4" />
            <span className="font-display font-black text-xl tracking-wide">{unit.price}.00</span>
          </div>
        </div>

        {/* Form Body Pages */}
        <div className="flex-1 overflow-y-auto p-6 text-slate-800">
          
          {/* STEP 1: Details for Guest/User */}
          {step === 'details' && (
            <form onSubmit={handleDetailsSubmit} className="space-y-4 text-left">
              <h4 className="text-base font-bold text-slate-950 font-display mb-3">
                {user.isLoggedIn ? 'Verify Checkout Info' : 'Guest Student Checkout 📚'}
              </h4>
              
              {user.isLoggedIn ? (
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-sm space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Student Account:</span>
                    <span className="font-bold text-slate-900">{user.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Linked Email:</span>
                    <span className="font-bold text-slate-900">{user.email}</span>
                  </div>
                  <div className="pt-2 border-t border-slate-200 text-xs text-amber-700 font-semibold">
                    💡 This unit will be permanently linked to this account for lifetime access.
                  </div>
                </div>
              ) : (
                <div className="space-y-3 font-semibold">
                  <p className="text-xs text-slate-500 leading-relaxed">
                    No account? No problem! Enter your details beneath to checkout. An instant secure download link will generate right after payment.
                  </p>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Full Student Name</label>
                    <input
                      id="input-guest-name"
                      type="text"
                      required
                      value={guestName}
                      onChange={(e) => setGuestName(e.target.value)}
                      placeholder="e.g., Rajesh Sharma"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-brand-orange text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Email (PDF Delivery Address)</label>
                    <input
                      id="input-guest-email"
                      type="email"
                      required
                      value={guestEmail}
                      onChange={(e) => {
                        setGuestEmail(e.target.value);
                        setEmailError('');
                      }}
                      placeholder="e.g., rajesh@gmail.com"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-brand-orange text-slate-900"
                    />
                    {emailError && <span className="text-red-500 text-xs mt-1 block">{emailError}</span>}
                  </div>
                </div>
              )}

              <button
                id="btn-checkout-proceed"
                type="submit"
                className="w-full bg-brand-orange hover:bg-brand-orange-hover text-white py-3 rounded-2xl font-bold mt-6 shadow-lg shadow-brand-orange/15 transition-all cursor-pointer"
              >
                Proceed to Payment (₹{unit.price})
              </button>
            </form>
          )}

          {/* STEP 2: Choose Payment Method and Pay */}
          {step === 'method' && (
            <div className="space-y-5 text-left">
              <div className="flex items-center space-x-2 mb-2">
                <button 
                  type="button"
                  onClick={() => setStep('details')}
                  className="text-slate-400 hover:text-slate-900 p-1 rounded-lg transition-colors cursor-pointer"
                >
                  <ArrowLeft className="h-4 w-4" />
                </button>
                <h4 className="text-base font-bold text-slate-900 font-display">Select Payment Channel</h4>
              </div>

              {/* Payment Method Selector Grid */}
              <div className="grid grid-cols-3 gap-2">
                <button
                  id="tab-pay-qr"
                  type="button"
                  onClick={() => setPaymentMethod('upi_qr')}
                  className={`flex flex-col items-center justify-center p-3 rounded-2xl border transition-all duration-200 cursor-pointer ${
                    paymentMethod === 'upi_qr'
                      ? 'border-brand-orange bg-brand-orange/5 text-brand-orange font-bold'
                      : 'border-slate-200 bg-white text-slate-500 hover:text-slate-900'
                  }`}
                >
                  <QrCode className="h-5 w-5 mb-1.5 text-brand-orange" />
                  <span className="text-xs">UPI QR</span>
                </button>
                <button
                  id="tab-pay-apps"
                  type="button"
                  onClick={() => setPaymentMethod('upi_app')}
                  className={`flex flex-col items-center justify-center p-3 rounded-2xl border transition-all duration-200 cursor-pointer ${
                    paymentMethod === 'upi_app'
                      ? 'border-teal-500 bg-teal-50/20 text-teal-700 font-bold'
                      : 'border-slate-200 bg-white text-slate-500 hover:text-slate-900'
                  }`}
                >
                  <Smartphone className="h-5 w-5 mb-1.5 text-teal-600" />
                  <span className="text-xs">UPI Apps</span>
                </button>
                <button
                  id="tab-pay-card"
                  type="button"
                  onClick={() => setPaymentMethod('card')}
                  className={`flex flex-col items-center justify-center p-3 rounded-2xl border transition-all duration-205 cursor-pointer ${
                    paymentMethod === 'card'
                      ? 'border-blue-500 bg-blue-50/25 text-blue-700 font-bold'
                      : 'border-slate-200 bg-white text-slate-500 hover:text-slate-900'
                  }`}
                >
                  <CreditCard className="h-5 w-5 mb-1.5 text-blue-600" />
                  <span className="text-xs">Card</span>
                </button>
              </div>

              {/* Method sub-screens */}
              {paymentMethod === 'upi_qr' && (
                <div className="space-y-4 border border-slate-200 bg-slate-50/50 rounded-2xl p-4 text-center">
                  <div className="bg-white p-3.5 rounded-xl inline-block shadow mx-auto border border-slate-100">
                    {/* Generates standard custom QR Layout */}
                    <div className="w-32 h-32 flex flex-col justify-center items-center border-dashed border-2 border-slate-300">
                      <QrCode className="h-20 w-20 text-slate-800" />
                      <span className="text-[9px] text-slate-650 font-mono font-bold mt-1">₹20.00 Notes</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-center">
                    <span className="text-xs text-slate-500 font-medium">Scan QR to make direct payment simulate</span>
                    <span className="text-xs text-amber-705 text-amber-700 font-extrabold font-mono mt-1">
                      Time remaining: {qrMinutes}:{qrSeconds < 10 ? `0${qrSeconds}` : qrSeconds}
                    </span>
                  </div>
                  <div className="pt-2 border-t border-slate-100">
                    <button
                      id="btn-simulate-success-qr"
                      type="button"
                      onClick={handlePaymentSimulate}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1.5 cursor-pointer shadow-sm"
                    >
                      <Check className="h-4 w-4" />
                      <span>Simulate QR Payment Success</span>
                    </button>
                  </div>
                </div>
              )}

              {paymentMethod === 'upi_app' && (
                <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200 font-semibold text-slate-705">
                  <div className="flex space-x-2">
                    <button
                      type="button"
                      onClick={() => setSelectedUpiApp('gpay')}
                      className={`flex-1 text-center py-2 rounded-lg text-xs font-bold transition-all ${
                        selectedUpiApp === 'gpay' ? 'bg-white text-slate-900 border border-slate-200 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      Google Pay
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedUpiApp('phonepe')}
                      className={`flex-1 text-center py-2 rounded-lg text-xs font-bold transition-all ${
                        selectedUpiApp === 'phonepe' ? 'bg-white text-slate-900 border border-slate-200 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      PhonePe
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedUpiApp('paytm')}
                      className={`flex-1 text-center py-2 rounded-lg text-xs font-bold transition-all ${
                        selectedUpiApp === 'paytm' ? 'bg-white text-slate-900 border border-slate-200 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      Paytm
                    </button>
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-550 font-bold uppercase mb-1">Enter UPI ID</label>
                    <input
                      id="input-upi-id"
                      type="text"
                      value={upiId}
                      onChange={(e) => setUpiId(e.target.value)}
                      placeholder="username@okaxis"
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none focus:border-brand-orange text-slate-900"
                    />
                  </div>
                  <button
                    id="btn-pay-upi"
                    type="button"
                    onClick={handlePaymentSimulate}
                    className="w-full bg-brand-orange hover:bg-brand-orange-hover text-white py-3 rounded-xl font-bold text-xs mt-3 cursor-pointer"
                  >
                    Pay via UPI App (₹{unit.price})
                  </button>
                </div>
              )}

              {paymentMethod === 'card' && (
                <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs font-semibold">
                  <div>
                    <label className="block text-[10px] text-slate-500 font-bold mb-1">Card Number</label>
                    <input
                      id="input-card-number"
                      type="text"
                      value={cardNumber}
                      maxLength={16}
                      onChange={(e) => setCardNumber(e.target.value.replace(/\D/g,''))}
                      placeholder="4321 0987 6543 2109"
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none focus:border-brand-orange text-slate-900"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] text-slate-505 font-bold mb-1 col-span-1">Expiry Date</label>
                      <input
                        id="input-card-expiry"
                        type="text"
                        value={cardExpiry}
                        maxLength={5}
                        onChange={(e) => setCardExpiry(e.target.value)}
                        placeholder="MM/YY"
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none focus:border-brand-orange text-slate-900"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-505 font-bold mb-1">CVV</label>
                      <input
                        id="input-card-cvv"
                        type="password"
                        value={cardCvv}
                        maxLength={3}
                        onChange={(e) => setCardCvv(e.target.value.replace(/\D/g,''))}
                        placeholder="•••"
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none focus:border-brand-orange text-slate-900"
                      />
                    </div>
                  </div>
                  <button
                    id="btn-pay-card"
                    type="button"
                    onClick={handlePaymentSimulate}
                    className="w-full bg-brand-orange hover:bg-brand-orange-hover text-white py-3 rounded-xl font-bold font-display mt-3 text-xs cursor-pointer"
                  >
                    Secure Pay Check (₹{unit.price})
                  </button>
                </div>
              )}
            </div>
          )}

          {/* STEP 3: Razorpay Loading State */}
          {step === 'processing' && (
            <div className="py-12 text-center space-y-4 font-semibold text-slate-650">
              <Loader2 className="h-10 w-10 text-brand-orange animate-spin mx-auto" />
              <div className="space-y-1">
                <span className="font-display font-bold text-slate-900 text-sm block">Authorizing Transaction...</span>
                <span className="text-xs text-slate-500 font-medium block">Interfacing secure system node_express:3000...</span>
                <span className="text-xs text-amber-700 font-bold font-mono">Do not refresh this panel</span>
              </div>
            </div>
          )}

          {/* STEP 4: Successful download prompt */}
          {step === 'success' && (
            <div className="text-center py-6 space-y-5">
              <div className="bg-emerald-50 p-4 rounded-full border border-emerald-200 inline-block mx-auto">
                <Check className="h-10 w-10 text-emerald-600 animate-pulse" />
              </div>
              <div className="space-y-1.5">
                <h4 className="font-display font-extrabold text-xl text-slate-900">Payment Successful! 🌟</h4>
                <p className="text-xs text-emerald-700 font-bold uppercase tracking-wider font-mono">
                  Transaction Reference ID: HSN-TX-{Math.floor(100000 + Math.random() * 900000)}
                </p>
                <p className="text-xs text-slate-500 max-w-xs mx-auto">
                  A receipt has been dispatched. Access is permanently unlocked to your library folder.
                </p>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-205 text-left text-xs mb-4 border-slate-200 font-semibold">
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-510">Order Title:</span>
                  <span className="font-bold text-slate-900 truncate max-w-[150px]">{unit.name}</span>
                </div>
                <div className="flex justify-between py-1 mt-1">
                  <span className="text-slate-510">Payer Name:</span>
                  <span className="font-bold text-slate-900">{user.isLoggedIn ? user.name : guestName}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-510">Payer Address:</span>
                  <span className="font-bold text-slate-900 truncate max-w-[150px]">{user.isLoggedIn ? user.email : guestEmail}</span>
                </div>
              </div>

              <div className="flex flex-col space-y-2">
                <button
                  id="btn-checkout-read"
                  type="button"
                  onClick={onClose}
                  className="w-full bg-brand-orange hover:bg-brand-orange-hover text-white py-3 rounded-2xl font-bold flex items-center justify-center space-x-2 shadow-lg shadow-brand-orange/20 cursor-pointer"
                >
                  <Sparkles className="h-4 w-4" />
                  <span>Open Unlocked HandScript Notes</span>
                </button>
              </div>
            </div>
          )}

        </div>

        {/* Razorpay compliance footer */}
        <div className="bg-slate-50 p-4 text-center border-t border-slate-200 text-[10px] text-slate-500 font-mono flex items-center justify-center space-x-1.5 font-bold">
          <ShieldCheck className="h-4.5 w-4.5 text-slate-500" />
          <span>PCI-DSS SSL Compliant Encryption Endpoint</span>
        </div>

      </div>
    </div>
  );
}
