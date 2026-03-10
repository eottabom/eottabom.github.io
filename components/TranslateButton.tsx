import { useState, useEffect, useRef } from 'react';
import { X, Chrome, Globe, ExternalLink } from 'lucide-react';

type BrowserType = 'chrome' | 'edge' | 'safari' | 'firefox' | 'other';

interface BrowserGuide {
  name: string;
  icon: typeof Chrome;
  steps: string[];
}

function detectBrowser(): BrowserType {
  if (typeof navigator === 'undefined') {
      return 'other';
  }
  const ua = navigator.userAgent;

  if (ua.includes('Edg/') || ua.includes('Edg ')) {
      return 'edge';
  }
  if (ua.includes('Chrome') && !ua.includes('Edg')) {
      return 'chrome';
  }
  if (ua.includes('Safari') && !ua.includes('Chrome')) {
      return 'safari';
  }
  if (ua.includes('Firefox')) {
      return 'firefox';
  }
  return 'other';
}

const browserGuides: Record<BrowserType, BrowserGuide> = {
  chrome: {
    name: 'Chrome',
    icon: Chrome,
    steps: [
      'Right-click anywhere on the page',
      'Select "Translate to ..." from the menu',
      'Or click the translate icon in the address bar',
    ],
  },
  edge: {
    name: 'Edge',
    icon: Globe,
    steps: [
      'Click the translate icon in the address bar',
      'Or right-click → "Translate to ..."',
      'Edge will auto-detect the language',
    ],
  },
  safari: {
    name: 'Safari',
    icon: Globe,
    steps: [
      'Click the "aA" button in the address bar',
      'Select "Translate to ..." from the menu',
      'Safari supports major languages',
    ],
  },
  firefox: {
    name: 'Firefox',
    icon: Globe,
    steps: [
      'Click the translate icon in the address bar',
      'Or go to Settings → General → Language',
      'Enable "Offer to translate" option',
    ],
  },
  other: {
    name: 'Your Browser',
    icon: Globe,
    steps: [
      'Check your browser settings for translation options',
      'Or use the Google Translate link below',
    ],
  },
};

export default function TranslateButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [browser, setBrowser] = useState<BrowserType>('other');
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setBrowser(detectBrowser());
  }, []);

  useEffect(() => {
    if (!isOpen) {
        return;
    }
    const handleClickOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const guide = browserGuides[browser];
  const BrowserIcon = guide.icon;

  const openGoogleTranslate = () => {
    const url = encodeURIComponent(window.location.href);
    window.open(
      `https://translate.google.com/translate?sl=ko&tl=en&u=${url}`,
      '_blank'
    );
  };

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="px-2 py-1.5 rounded-full text-[13px] font-semibold transition-all duration-200 flex items-center gap-1 text-gray-500 hover:text-gray-800"
        aria-label="Translate this page"
        title="Translate"
      >
        <span className="text-base leading-none">🌐</span>
        <span>Translate</span>
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-80 bg-white border border-gray-200 rounded-xl shadow-lg p-5 z-50">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <BrowserIcon className="w-5 h-5 text-blue-600" />
              <h3 className="text-sm font-bold text-gray-900">
                Translate this page
              </h3>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-400 hover:text-gray-600 transition"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="mb-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              {guide.name} Translation Guide
            </p>
            <ol className="space-y-1.5">
              {guide.steps.map((step, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                  <span className="flex-shrink-0 w-5 h-5 flex items-center justify-center rounded-full bg-blue-50 text-blue-600 text-xs font-bold">
                    {i + 1}
                  </span>
                  {step}
                </li>
              ))}
            </ol>
          </div>

          <div className="border-t border-gray-100 pt-3">
            <button
              onClick={openGoogleTranslate}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition"
            >
              <ExternalLink className="w-4 h-4" />
              Open in Google Translate
            </button>
          </div>
        </div>
      )}
    </div>
  );
}