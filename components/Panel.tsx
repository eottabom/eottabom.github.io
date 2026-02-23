import React, {isValidElement, ReactNode} from 'react';
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
    bg: 'bg-blue-50',
    border: 'border-l-4 border-blue-400',
    text: 'text-blue-900',
    icon: <Info className="w-4 h-4" />,
    iconColor: 'text-blue-500',
    titleColor: 'text-blue-700',
  },
  warning: {
    bg: 'bg-yellow-50',
    border: 'border-l-4 border-yellow-400',
    text: 'text-yellow-900',
    icon: <AlertTriangle className="w-4 h-4" />,
    iconColor: 'text-yellow-500',
    titleColor: 'text-yellow-700',
  },
  danger: {
    bg: 'bg-red-50',
    border: 'border-l-4 border-red-400',
    text: 'text-red-900',
    icon: <ShieldAlert className="w-4 h-4" />,
    iconColor: 'text-red-500',
    titleColor: 'text-red-700',
  },
  success: {
    bg: 'bg-green-50',
    border: 'border-l-4 border-green-400',
    text: 'text-green-900',
    icon: <CheckCircle className="w-4 h-4" />,
    iconColor: 'text-green-500',
    titleColor: 'text-green-700',
  },
  note: {
    bg: 'bg-purple-50',
    border: 'border-l-4 border-purple-400',
    text: 'text-purple-900',
    icon: <BadgeCheck className="w-4 h-4" />,
    iconColor: 'text-purple-500',
    titleColor: 'text-purple-700',
  },
  tip: {
    bg: 'bg-cyan-50',
    border: 'border-l-4 border-cyan-400',
    text: 'text-cyan-900',
    icon: <Sparkles className="w-4 h-4" />,
    iconColor: 'text-cyan-500',
    titleColor: 'text-cyan-700',
  },
  neutral: {
    bg: 'bg-gray-50',
    border: 'border-l-4 border-gray-400',
    text: 'text-gray-900',
    icon: <CircleEllipsis className="w-4 h-4" />,
    iconColor: 'text-gray-500',
    titleColor: 'text-gray-700',
  },
  quote: {
    bg: 'bg-indigo-50',
    border: 'border-l-4 border-indigo-400',
    text: 'text-indigo-900',
    icon: <AlignLeft className="w-4 h-4" />,
    iconColor: 'text-indigo-500',
    titleColor: 'text-indigo-700',
  },
};

function extractLines(children: ReactNode): ReactNode[][] {
  const result: ReactNode[][] = [];
  let line: ReactNode[] = [];

  const flush = () => {
    if (line.length > 0) {
      result.push(line);
      line = [];
    }
  };

  const walk = (node: ReactNode) => {
    if (typeof node === 'string') {
      node.split(/\r?\n/).forEach((part, i) => {
        if (i > 0) {
          flush();
        }
        if (part) {
          line.push(part);
        }
      });
    } else if (Array.isArray(node)) {
      node.forEach((child) => {
        walk(child);
      });
    } else if (isValidElement(node)) {
      const { type, props } = node as any;
      if (type === 'a' || type === 'code' || type === 'b' || type === 'newline') {
        line.push(node);
      } else {
        walk(props.children);
      }
    } else if (typeof node === 'number') {
      line.push(node);
    }
  };

  walk(children);
  flush();
  return result;
}

function renderText(type: InfoPanelType, children: ReactNode) {
  const lines = extractLines(children);
  const [title = [], ...rest] = lines;
  const style = typeStyles[type];

  const commonTextStyle = 'text-base leading-[1.6] break-words whitespace-pre-line';

  return (
      <>
        <div className={`flex gap-2 ${style.titleColor}`}>
          <div className="flex-shrink-0 relative top-[0.2rem]">
            {React.cloneElement(style.icon, {
              className: `w-5 h-5 ${style.titleColor}`,
            })}
          </div>
          <div className={commonTextStyle}>
            {title}
          </div>
        </div>

        {rest.length > 0 && (
            <div className={`mt-2 pl-[1.8rem] space-y-[0.4rem] ${style.titleColor}`}>
              {rest.map((line, i) => (
                  <div key={i} className={commonTextStyle}>
                    {line}
                  </div>
              ))}
            </div>
        )}
      </>
  );
}


export default function InfoPanel({ type = 'info', children, }: InfoPanelProps) {
  const style = typeStyles[type];

  return (
      <div
          className={`my-4 px-4 py-3 rounded-md prose ${style.bg} ${style.border} ${style.text}`}
      >
        {renderText(type, children)}
      </div>
  );
}
