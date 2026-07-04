'use client';

import { useState } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { Menu } from 'lucide-react';
import { SuccessModal } from '@/components/ui/SuccessModal';

export function AppLayoutClient({
  businessName,
  children,
}: {
  businessName: string;
  children: React.ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="flex min-h-screen overflow-hidden">
      {/* Slide-out Sidebar Drawer Backdrop (Mobile only) */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 z-40 bg-ink-950/40 backdrop-blur-sm transition-opacity duration-300 lg:hidden"
        />
      )}

      {/* Sidebar component */}
      <Sidebar
        businessName={businessName}
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
      />
      
      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto bg-ink-50 flex flex-col h-screen">
        {/* Responsive Mobile Header */}
        <div className="no-print flex h-14 items-center justify-between border-b border-ink-100 bg-white px-4 py-3 lg:hidden shrink-0">
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setIsOpen(true)}
              className="rounded-lg p-1.5 text-ink-600 hover:bg-ink-50 focus:outline-none"
              aria-label="Open Sidebar"
            >
              <Menu size={20} />
            </button>
            <span className="font-semibold text-ink-900 text-sm truncate max-w-[200px]">
              {businessName}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-500 text-xs font-bold text-white">
              SV
            </div>
          </div>
        </div>

        {/* Dynamic Page Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          {children}
        </div>
      </main>
      <SuccessModal />
    </div>
  );
}
