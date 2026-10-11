import { Children, isValidElement, useState } from 'react';
import { Check, Link as LinkIcon } from 'lucide-react';

type HeadingTag = 'h1' | 'h2' | 'h3' | 'h4';

// MDX 본문의 h1~h4 에 마우스를 올리면 링크 아이콘을 띄우고, 클릭하면 해당 제목으로 가는 URL 을 복사한다.
// id 는 rehype-slug 가 만들고, rehype-autolink-headings 가 넣은 빈 앵커는 이 버튼으로 대신한다.
function createHeading(Tag: HeadingTag) {
  function Heading({ id, children, ...props }: any) {
    const [copied, setCopied] = useState(false);

    const content = Children.toArray(children).filter(
      (child) => !(isValidElement(child) && (child.props as any)?.href === `#${id}` && (child.props as any)?.['aria-hidden']),
    );

    if (!id) return <Tag {...props}>{content}</Tag>;

    const handleCopy = async () => {
      const url = `${window.location.origin}${window.location.pathname}#${encodeURIComponent(id)}`;
      try {
        await navigator.clipboard.writeText(url);
        window.history.replaceState(null, '', `#${encodeURIComponent(id)}`);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      } catch (e) {
        console.error('링크 복사 실패:', e);
      }
    };

    return (
      <Tag id={id} {...props} className={`group ${props.className ?? ''}`}>
        {content}
        <button
          type="button"
          onClick={handleCopy}
          aria-label={copied ? '링크 복사됨' : '제목 링크 복사'}
          title={copied ? '복사됨' : '링크 복사'}
          className="-my-2 ml-1 inline-flex translate-y-[-0.1em] items-center gap-1 rounded p-2 align-middle text-sm font-normal text-slate-400 opacity-0 transition-opacity hover:text-blue-600 focus-visible:opacity-100 group-hover:opacity-100 [@media(hover:none)]:opacity-60 dark:hover:text-blue-400"
        >
          {copied ? (
            <>
              <Check size={16} />
              <span className="text-xs">복사됨</span>
            </>
          ) : (
            <LinkIcon size={16} />
          )}
        </button>
      </Tag>
    );
  }
  Heading.displayName = `Heading(${Tag})`;
  return Heading;
}

export const headingComponents = {
  h1: createHeading('h1'),
  h2: createHeading('h2'),
  h3: createHeading('h3'),
  h4: createHeading('h4'),
};
