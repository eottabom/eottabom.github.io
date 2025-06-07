import { ReactNode } from 'react';

type InfoPanelType =
  | 'info'
  | 'warning'
  | 'danger'
  | 'success'
  | 'note'
  | 'tip'
  | 'neutral'
  | 'quote';

type InfoPanelProps = {
  type?: InfoPanelType;
  children: ReactNode;
};

export default function InfoPanel({ type = 'info', children }: InfoPanelProps) {
  const styles: Record<InfoPanelType, string> = {
    info: 'bg-blue-50 border-l-4 border-blue-400 text-blue-900',
    warning: 'bg-yellow-50 border-l-4 border-yellow-400 text-yellow-900',
    danger: 'bg-red-50 border-l-4 border-red-400 text-red-900',
    success: 'bg-green-50 border-l-4 border-green-400 text-green-900',
    note: 'bg-purple-50 border-l-4 border-purple-400 text-purple-900',
    tip: 'bg-cyan-50 border-l-4 border-cyan-400 text-cyan-900',
    neutral: 'bg-gray-50 border-l-4 border-gray-400 text-gray-900',
    quote: 'bg-indigo-50 border-l-4 border-indigo-400 text-indigo-900',
  };

  return (
    <div className={`px-4 py-2 my-4 rounded ${styles[type]}`}>
      <div className="prose-sm">{children}</div>
    </div>
  );
}
