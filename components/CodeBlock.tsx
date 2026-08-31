import { Children, isValidElement, useState } from 'react';
import { Check, Copy } from 'lucide-react';

function getLanguage(children: React.ReactNode): string {
  const codeEl = Children.toArray(children)[0];
  if (isValidElement(codeEl) && typeof codeEl.props.className === 'string') {
    const match = codeEl.props.className.match(/language-(\w+)/);
    if (match) return match[1];
  }
  return '';
}

function getCodeText(children: React.ReactNode): string {
  const codeEl = Children.toArray(children)[0];
  if (isValidElement(codeEl)) {
    return Children.toArray(codeEl.props.children).join('');
  }
  return '';
}

export default function CodeBlock(props: any) {
  const [copied, setCopied] = useState(false);
  const language = getLanguage(props.children);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(getCodeText(props.children));
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (e) {
      console.error('코드 복사 실패:', e);
    }
  };

  return (
    <div className="code-block">
      <div className="code-block-header">
        <span className="code-block-lang">{language}</span>
        <button
          type="button"
          onClick={handleCopy}
          className="code-block-copy"
          aria-label={copied ? '복사됨' : '코드 복사'}
        >
          {copied ? <Check size={13} /> : <Copy size={13} />}
        </button>
      </div>
      <pre {...props} />
    </div>
  );
}
