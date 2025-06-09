import React, { ReactNode } from 'react';
import {
  Info,
  AlertTriangle,
  ShieldAlert,
  BadgeCheck,
  AlignLeft ,
  Sparkles,
  CheckCircle,
  CircleEllipsis,
} from 'lucide-react';

export type InfoPanelType =
    | 'info'
    | 'warning'
    | 'danger'
    | 'success'
    | 'note'
    | 'tip'
    | 'neutral'
    | 'quote';

interface InfoPanelProps {
  type?: InfoPanelType;
  children: ReactNode;
}

const typeStyles: Record<
    InfoPanelType,
    {
      bg: string;
      border: string;
      text: string;
      icon: JSX.Element;
      iconColor: string;
      titleColor: string;
    }
> = {
  info: {
    bg: 'bg-blue-50 dark:bg-blue-900/30',
    border: 'border-l-4 border-blue-400',
    text: 'text-blue-900 dark:text-blue-100',
    icon: <Info className="w-4 h-4" />,
    iconColor: 'text-blue-500',
    titleColor: 'text-blue-700 dark:text-blue-300',
  },
  warning: {
    bg: 'bg-yellow-50 dark:bg-yellow-900/30',
    border: 'border-l-4 border-yellow-400',
    text: 'text-yellow-900 dark:text-yellow-100',
    icon: <AlertTriangle className="w-4 h-4" />,
    iconColor: 'text-yellow-500',
    titleColor: 'text-yellow-700 dark:text-yellow-200',
  },
  danger: {
    bg: 'bg-red-50 dark:bg-red-900/30',
    border: 'border-l-4 border-red-400',
    text: 'text-red-900 dark:text-red-100',
    icon: <ShieldAlert className="w-4 h-4" />,
    iconColor: 'text-red-500',
    titleColor: 'text-red-700 dark:text-red-300',
  },
  success: {
    bg: 'bg-green-50 dark:bg-green-900/30',
    border: 'border-l-4 border-green-400',
    text: 'text-green-900 dark:text-green-100',
    icon: <CheckCircle className="w-4 h-4" />,
    iconColor: 'text-green-500',
    titleColor: 'text-green-700 dark:text-green-300',
  },
  note: {
    bg: 'bg-purple-50 dark:bg-purple-900/30',
    border: 'border-l-4 border-purple-400',
    text: 'text-purple-900 dark:text-purple-100',
    icon: <BadgeCheck className="w-4 h-4" />,
    iconColor: 'text-purple-500',
    titleColor: 'text-purple-700 dark:text-purple-300',
  },
  tip: {
    bg: 'bg-cyan-50 dark:bg-cyan-900/30',
    border: 'border-l-4 border-cyan-400',
    text: 'text-cyan-900 dark:text-cyan-100',
    icon: <Sparkles className="w-4 h-4" />,
    iconColor: 'text-cyan-500',
    titleColor: 'text-cyan-700 dark:text-cyan-300',
  },
  neutral: {
    bg: 'bg-gray-50 dark:bg-gray-900/30',
    border: 'border-l-4 border-gray-400',
    text: 'text-gray-900 dark:text-gray-100',
    icon: <CircleEllipsis className="w-4 h-4" />,
    iconColor: 'text-gray-500',
    titleColor: 'text-gray-700 dark:text-gray-300',
  },
  quote: {
    bg: 'bg-indigo-50 dark:bg-indigo-900/30',
    border: 'border-l-4 border-indigo-400',
    text: 'text-indigo-900 dark:text-indigo-100',
    icon: <AlignLeft className="w-4 h-4" />,
    iconColor: 'text-indigo-500',
    titleColor: 'text-indigo-700 dark:text-indigo-300',
  },
};

function extractTextFromChildren(children: ReactNode): string {
  if (typeof children === 'string') {
    return children;
  }
  if (Array.isArray(children)) {
    return children.map(extractTextFromChildren).join('\n');
  }
  if (typeof children === 'object' && 'props' in children) {
    return extractTextFromChildren((children as any).props.children);
  }
  return '';
}

function renderText(type: InfoPanelType, children: ReactNode) {
  const text = extractTextFromChildren(children);
  const lines = text
      .split(/\r?\n/)
      .reduce<string[]>((acc, line) => {
        const trimmed = line.trim();
        if (!trimmed) return acc;

        const hasHtmlTag = /^<\w+/.test(trimmed); // <a ...>, <code>, <strong> 등
        if (hasHtmlTag) {
          acc.push(trimmed); // 그대로 넣음
        } else if (acc.length > 0 && !/^<\w+/.test(acc[acc.length - 1])) {
          acc[acc.length - 1] += ' ' + trimmed; // 이전 줄에 이어붙임
        } else {
          acc.push(trimmed);
        }

        return acc;
      }, []);

  const [title, ...bodyLines] = lines;

  const style = typeStyles[type];

  return (
      <>
        <div className={`text-mi flex items-center gap-2 mt-2 mb-2 ${style.titleColor}`}>
          {React.cloneElement(style.icon, { className: `w-4 h-4 ${style.titleColor}` })}
          {title}
        </div>
        <div className={`space-y-1 text-mi pl-[1.3rem] ${style.titleColor}`}>
          {bodyLines.map((line, idx) => (
              <div key={idx}>{line}</div>
          ))}
        </div>
      </>
  );
}

export default function InfoPanel({ type = 'info', children }: InfoPanelProps) {
  const style = typeStyles[type];

  return (
      <div className={`my-4 px-4 py-3 rounded-md prose ${style.bg} ${style.border} ${style.text}`}>
        {renderText(type, children)}
      </div>
  );
}
