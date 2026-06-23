'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';

function OpenAppContent() {
  const searchParams = useSearchParams();
  const [redirectUrl, setRedirectUrl] = useState('eaglepathway://login');
  
  useEffect(() => {
    // We need to capture both the hash fragment (used by implicit flow) 
    // and query params (used by PKCE) from the URL and append them to the deep link.
    if (typeof window !== 'undefined') {
      const hash = window.location.hash;
      const search = window.location.search;
      // Reconstruct the deep link with the exact same parameters
      setRedirectUrl(`eaglepathway://login${search}${hash}`);
    }
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-500">
      <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 max-w-sm w-full">
        <div className="w-16 h-16 bg-brand-blue/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8 text-brand-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
        </div>
        
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Open the App</h1>
        <p className="text-gray-500 mb-8 text-sm leading-relaxed">
          Tap the button below to complete your action securely inside the Eagle Pathway mobile app.
        </p>

        <a 
          href={redirectUrl}
          className="block w-full bg-brand-blue text-white font-semibold py-3.5 px-4 rounded-xl shadow-sm hover:bg-brand-blue/90 active:scale-95 transition-all"
        >
          Open Eagle Pathway App
        </a>
      </div>
    </div>
  );
}

export default function OpenAppPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-brand-blue" />
      </div>
    }>
      <OpenAppContent />
    </Suspense>
  );
}
