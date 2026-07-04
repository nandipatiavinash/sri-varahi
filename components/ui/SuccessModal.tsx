'use client';

import { useState, useEffect } from 'react';
import { Check } from 'lucide-react';

export function SuccessModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    function handleShow(e: Event) {
      const customEvent = e as CustomEvent<{ message: string }>;
      setMessage(customEvent.detail?.message || 'Success');
      setIsOpen(true);
    }

    window.addEventListener('show-success-modal', handleShow);
    return () => window.removeEventListener('show-success-modal', handleShow);
  }, []);

  function handleClose() {
    setIsOpen(false);
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-ink-950/40 backdrop-blur-sm p-4 transition-all duration-300 animate-fadeIn">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl border border-ink-100 flex flex-col items-center text-center transform transition-transform duration-300 scale-100 animate-scaleUp">
        
        {/* Animated Tick Circle */}
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-50 text-green-600 mb-4 ring-8 ring-green-500/10 animate-bounceOnce">
          <Check size={36} strokeWidth={3} className="animate-drawCheck" />
        </div>

        <h3 className="text-lg font-bold text-ink-900 mb-2">Done!</h3>
        <p className="text-sm text-ink-500 mb-6">{message}</p>

        <button
          type="button"
          onClick={handleClose}
          className="w-full btn bg-green-600 hover:bg-green-700 text-white py-2.5 rounded-xl font-semibold shadow-md transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  );
}

// Client-side helper function to trigger the success modal
export function triggerSuccessModal(message: string) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('show-success-modal', {
        detail: { message },
      })
    );
  }
}
