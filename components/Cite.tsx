import { Children, isValidElement, ReactElement, ReactNode } from 'react';

interface CiteProps {
  children: ReactNode;
  'data-src'?: string;
}

// 링크 하나만 들어 있는 문단인지 확인한다. a 는 MDX 컴포넌트로 바뀌어 있어서 태그 이름 대신 href 로 본다.
const isLinkOnly = (node: ReactNode): boolean => {
  if (!isValidElement(node)) return false;
  const inner = Children.toArray((node as ReactElement).props.children).filter(
    (child) => !(typeof child === 'string' && child.trim() === ''),
  );
  return inner.length === 1 && isValidElement(inner[0]) && Boolean((inner[0] as ReactElement).props.href);
};

// :::cite 디렉티브. 원문, 번역 같은 문단을 큰 따옴표로 감싸 보여주고, 마지막 문단이 링크 하나뿐이면 출처로 오른쪽 아래에 붙인다.
// 마크다운 > 인용(prose 스타일)과 구분되도록 not-prose 로 따로 그린다.
export default function Cite({ children, 'data-src': dataSrc }: CiteProps) {
  const blocks = Children.toArray(children).filter(isValidElement);
  const last = blocks[blocks.length - 1];
  const hasSource = blocks.length > 1 && isLinkOnly(last);
  const body = hasSource ? blocks.slice(0, -1) : blocks;

  return (
    <figure data-src={dataSrc} className="not-prose relative my-8 rounded-r-md border-l-4 border-gray-700 bg-stone-50 py-5 pl-10 pr-8 sm:pl-14 sm:pr-12">
      <span aria-hidden className="absolute left-2.5 top-1 font-serif text-5xl sm:left-3 sm:text-6xl leading-none text-gray-800">
        &ldquo;
      </span>
      {/* 닫는 따옴표는 출처와 겹치지 않도록 본문 끝에 붙인다. */}
      <div className="relative space-y-3 text-[1.05rem] italic leading-relaxed text-gray-700">
        {body}
        <span aria-hidden className="absolute -bottom-8 -right-7 font-serif text-5xl sm:-bottom-9 sm:-right-9 sm:text-6xl leading-none text-gray-800">
          &rdquo;
        </span>
      </div>
      {hasSource && (
        <figcaption className="mt-6 text-right text-sm text-gray-500 [&_a]:underline [&_a]:underline-offset-2 hover:[&_a]:text-gray-700">
          {(last as ReactElement).props.children}
        </figcaption>
      )}
    </figure>
  );
}
