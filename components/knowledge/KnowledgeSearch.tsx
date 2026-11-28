import { useEffect, useId, useMemo, useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';
import { Search, X } from 'lucide-react';
import { indexDocuments, searchDocuments } from '../../lib/search';
import type { Selection } from '../../lib/knowledge/query';
import type { KnowledgeData } from '../../lib/knowledge/types';

const MAX_RESULTS_PER_KIND = 6;
const CONCEPT_NAME_WEIGHT = 10;
const CONCEPT_ALIAS_WEIGHT = 8;
const ARTICLE_TITLE_WEIGHT = 6;
const ARTICLE_TAG_WEIGHT = 4;
const BODY_TEXT_WEIGHT = 2;

interface SearchItem extends Selection {
    label: string;
    meta: string;
    categories: string[];
}

interface KnowledgeSearchProps {
    data: KnowledgeData;
    categoryNames: Map<string, string>;
    categoryFilter: string | null;
    onSelect: (selection: Selection) => void;
}

const buildDocuments = (data: KnowledgeData, categoryNames: Map<string, string>) => {
    const conceptCategory = new Map(data.concepts.map((concept) => [concept.id, concept.category]));
    return indexDocuments<SearchItem>([
        ...data.concepts.map((concept) => ({
            item: {
                kind: 'concept' as const,
                id: concept.id,
                label: concept.name,
                meta: categoryNames.get(concept.category) ?? concept.category,
                categories: [concept.category],
            },
            fields: [
                { value: concept.name, weight: CONCEPT_NAME_WEIGHT },
                ...concept.aliases.map((alias) => ({ value: alias, weight: CONCEPT_ALIAS_WEIGHT })),
                { value: concept.description, weight: BODY_TEXT_WEIGHT },
            ],
        })),
        ...data.articles.map((article) => ({
            item: {
                kind: 'article' as const,
                id: article.id,
                label: article.title,
                meta: article.date,
                categories: [...new Set(article.concepts.map((id) => conceptCategory.get(id) ?? ''))],
            },
            fields: [
                { value: article.title, weight: ARTICLE_TITLE_WEIGHT },
                ...article.tags.map((tag) => ({ value: tag, weight: ARTICLE_TAG_WEIGHT })),
                { value: article.summary ?? '', weight: BODY_TEXT_WEIGHT },
                { value: article.description ?? '', weight: BODY_TEXT_WEIGHT },
            ],
        })),
    ]);
};

export default function KnowledgeSearch({ data, categoryNames, categoryFilter, onSelect }: KnowledgeSearchProps) {
    const listboxId = useId();
    const inputRef = useRef<HTMLInputElement>(null);
    const [query, setQuery] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const [activeIndex, setActiveIndex] = useState(0);

    const documents = useMemo(() => buildDocuments(data, categoryNames), [data, categoryNames]);

    const results = useMemo(() => {
        const matched = searchDocuments(documents, query)
            .map(({ item }) => item)
            .filter((item) => categoryFilter === null || item.categories.includes(categoryFilter));
        return [
            ...matched.filter((item) => item.kind === 'concept').slice(0, MAX_RESULTS_PER_KIND),
            ...matched.filter((item) => item.kind === 'article').slice(0, MAX_RESULTS_PER_KIND),
        ];
    }, [documents, query, categoryFilter]);

    // ⌘K, Ctrl+K 로 어디서든 검색창으로 간다.
    useEffect(() => {
        const handleShortcut = (event: globalThis.KeyboardEvent): void => {
            if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
                event.preventDefault();
                inputRef.current?.focus();
                inputRef.current?.select();
            }
        };
        window.addEventListener('keydown', handleShortcut);
        return () => window.removeEventListener('keydown', handleShortcut);
    }, []);

    const choose = (item: SearchItem): void => {
        onSelect({ kind: item.kind, id: item.id });
        setIsOpen(false);
        inputRef.current?.blur();
    };

    const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>): void => {
        if (event.key === 'Escape') {
            setIsOpen(false);
            return;
        }
        if (results.length === 0) {
            return;
        }
        if (event.key === 'ArrowDown') {
            event.preventDefault();
            setIsOpen(true);
            setActiveIndex((index) => (index + 1) % results.length);
        } else if (event.key === 'ArrowUp') {
            event.preventDefault();
            setActiveIndex((index) => (index - 1 + results.length) % results.length);
        } else if (event.key === 'Enter') {
            event.preventDefault();
            choose(results[activeIndex] ?? results[0]);
        }
    };

    const isListVisible = isOpen && query.trim() !== '';
    const optionId = (index: number): string => `${listboxId}-option-${index}`;

    return (
        <div className="relative w-full max-w-sm">
            <div
                className={`relative rounded-full p-[1.5px] transition-all duration-300 ${
                    query ? 'bg-gradient-to-r from-green-500 via-emerald-400 to-teal-500' : 'bg-gradient-to-r from-green-300 via-emerald-200 to-teal-300'
                }`}
            >
                <div className="relative rounded-full bg-white">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" aria-hidden />
                    <input
                        ref={inputRef}
                        type="search"
                        role="combobox"
                        aria-expanded={isListVisible}
                        aria-controls={listboxId}
                        aria-activedescendant={isListVisible && results.length > 0 ? optionId(activeIndex) : undefined}
                        aria-label="개념, 글 검색"
                        value={query}
                        placeholder="개념, 글 제목, 태그로 검색"
                        onChange={(event) => {
                            setQuery(event.target.value);
                            setActiveIndex(0);
                            setIsOpen(true);
                        }}
                        onFocus={() => setIsOpen(true)}
                        onBlur={() => setIsOpen(false)}
                        onKeyDown={handleKeyDown}
                        className="w-full rounded-full bg-transparent py-2 pl-9 pr-8 text-sm text-black placeholder-gray-400 outline-none"
                    />
                    {query && (
                        <button
                            type="button"
                            aria-label="검색어 지우기"
                            onClick={() => setQuery('')}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    )}
                </div>
            </div>

            {isListVisible && (
                <ul
                    id={listboxId}
                    role="listbox"
                    className="absolute left-0 right-0 top-full z-40 mt-2 max-h-96 overflow-y-auto rounded-2xl border border-gray-200 bg-white py-1.5 text-left shadow-md"
                >
                    {results.length === 0 && <li className="px-3 py-2 text-sm text-gray-400">검색 결과가 없습니다.</li>}
                    {results.map((item, index) => {
                        const isFirstOfKind = index === 0 || results[index - 1].kind !== item.kind;
                        return (
                            <li key={`${item.kind}:${item.id}`} role="presentation">
                                {isFirstOfKind && (
                                    <p className="px-3 pb-1 pt-2 text-[11px] font-semibold text-gray-400">
                                        {item.kind === 'concept' ? '개념' : '글'}
                                    </p>
                                )}
                                <button
                                    id={optionId(index)}
                                    type="button"
                                    role="option"
                                    aria-selected={index === activeIndex}
                                    onMouseDown={(event) => event.preventDefault()}
                                    onClick={() => choose(item)}
                                    onMouseEnter={() => setActiveIndex(index)}
                                    className={`flex w-full items-baseline justify-between gap-3 px-3 py-1.5 text-left text-sm ${
                                        index === activeIndex ? 'bg-gray-100' : ''
                                    }`}
                                >
                                    <span className="truncate text-gray-900">{item.label}</span>
                                    <span className="flex-shrink-0 text-xs text-gray-400">{item.meta}</span>
                                </button>
                            </li>
                        );
                    })}
                </ul>
            )}
        </div>
    );
}
