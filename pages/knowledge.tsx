import { useEffect, useMemo, useRef, useState } from 'react';
import type { InferGetStaticPropsType } from 'next';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/router';
import { ArrowLeft, Check, Info, Link2, Maximize2, Minimize2, X } from 'lucide-react';
import Header from '../components/Header';
import Seo from '../components/Seo';
import AdSense from '../components/AdSense';
import DetailPanel from '../components/knowledge/DetailPanel';
import KnowledgeSearch from '../components/knowledge/KnowledgeSearch';
import { loadKnowledge } from '../lib/knowledge/load';
import { createKnowledgeIndex } from '../lib/knowledge/query';
import type { Selection } from '../lib/knowledge/query';
import { buildOverview, buildSubgraph, hiddenElementIds } from '../lib/knowledge/subgraph';
import type { SubgraphNode } from '../lib/knowledge/subgraph';
import { articleNodeId, conceptNodeId } from '../lib/knowledge/types';
import type { KnowledgeData, RelationType } from '../lib/knowledge/types';

// Cytoscape 는 브라우저에서만 불러온다. 이 페이지 밖의 번들에는 들어가지 않는다.
const GraphCanvas = dynamic(() => import('../components/knowledge/GraphCanvas'), {
    ssr: false,
    loading: () => <p className="absolute inset-0 flex items-center justify-center text-xs text-gray-400">그래프를 불러오는 중입니다.</p>,
});

// loadKnowledge 는 fs 를 쓰므로 getStaticProps 안에서만 부른다. 검증에 실패하면 여기서 빌드가 멈춘다.
export const getStaticProps = async () => {
    const data: KnowledgeData = loadKnowledge();
    return { props: { data } };
};

type NodeKindFilter = 'concept' | 'article';

const NODE_LEGEND: { kind: NodeKindFilter; label: string; swatch: JSX.Element }[] = [
    { kind: 'concept', label: '개념', swatch: <span className="h-2.5 w-2.5 rounded-full bg-gray-500" /> },
    { kind: 'article', label: '글', swatch: <span className="h-3 w-2.5 rounded-[2px] bg-[#059669]" /> },
];

// 관계 선은 색이 같아서 선 모양과 화살표로 구분한다. 그래프의 선 스타일과 맞춘다.
const relationSwatch = (dashed: boolean, arrow: boolean): JSX.Element => (
    <svg width="22" height="8" viewBox="0 0 22 8" aria-hidden>
        <line x1="1" y1="4" x2={arrow ? 16 : 21} y2="4" stroke="#9ca3af" strokeWidth="1.6" strokeDasharray={dashed ? '3 2' : undefined} />
        {arrow && <path d="M15 1 L21 4 L15 7 Z" fill="#9ca3af" />}
    </svg>
);

const RELATION_LEGEND: { type: RelationType; label: string; swatch: JSX.Element }[] = [
    { type: 'PART_OF', label: '구성', swatch: relationSwatch(false, true) },
    { type: 'AFFECTS', label: '영향', swatch: relationSwatch(true, true) },
    { type: 'RELATED_TO', label: '관련', swatch: relationSwatch(false, false) },
];

const toggle = <T,>(items: T[], item: T): T[] => (items.includes(item) ? items.filter((value) => value !== item) : [...items, item]);

export default function KnowledgePage({ data }: InferGetStaticPropsType<typeof getStaticProps>) {
    const index = useMemo(() => createKnowledgeIndex(data), [data]);
    // null 이면 전체 보기(허브 중심), 값이 있으면 그 개념 중심 보기다.
    const [centerConceptId, setCenterConceptId] = useState<string | null>(null);
    const [expandedConceptIds, setExpandedConceptIds] = useState<string[]>([]);
    const [selection, setSelection] = useState<Selection | null>({ kind: 'hub', id: 'all' });
    const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
    const [isPanelOpen, setIsPanelOpen] = useState(true);
    const panelRef = useRef<HTMLElement>(null);
    const frameRef = useRef<HTMLDivElement>(null);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [isUrlCopied, setIsUrlCopied] = useState(false);
    const [hiddenKinds, setHiddenKinds] = useState<NodeKindFilter[]>([]);
    const [hiddenRelationTypes, setHiddenRelationTypes] = useState<RelationType[]>([]);
    // 이 페이지 안에서 지나온 기록. 처음 들어온 화면보다 뒤가 있을 때만 이전 버튼을 보여준다.
    const historyRef = useRef<{ keys: string[]; current: number }>({ keys: [], current: -1 });
    const [canGoBack, setCanGoBack] = useState(false);

    // Esc 로 나와도 버튼 상태가 맞도록 브라우저 이벤트를 따른다.
    useEffect(() => {
        const sync = (): void => setIsFullscreen(document.fullscreenElement === frameRef.current);
        document.addEventListener('fullscreenchange', sync);
        return () => document.removeEventListener('fullscreenchange', sync);
    }, []);

    useEffect(() => {
        if (!isUrlCopied) {
            return;
        }
        const timer = window.setTimeout(() => setIsUrlCopied(false), 1500);
        return () => window.clearTimeout(timer);
    }, [isUrlCopied]);

    const toggleFullscreen = (): void => {
        if (document.fullscreenElement) {
            void document.exitFullscreen();
            return;
        }
        void frameRef.current?.requestFullscreen();
    };

    const copyUrl = (): void => {
        void navigator.clipboard.writeText(window.location.href).then(() => setIsUrlCopied(true));
    };
    const router = useRouter();

    // URL 이 중심 개념, 분야, 고른 글의 원본이다. 직접 접속, 뒤로 가기, 앞으로 가기 모두 여기서 상태를 맞춘다.
    // /knowledge/?concept=jit 은 그 개념 중심 보기, ?category=spring 은 그 분야의 전체 보기다.
    // article 이 함께 있으면 그 화면에서 그 글을 고른 상태로 연다. 예: ?concept=jit&article=jvm-jit-tiered-compilation
    useEffect(() => {
        if (!router.isReady) {
            return;
        }
        const { concept, category, article } = router.query;
        const nextConcept = typeof concept === 'string' && index.conceptsById.has(concept) ? concept : null;
        const nextArticle = typeof article === 'string' && index.articlesById.has(article) ? article : null;
        setCenterConceptId(nextConcept);
        setExpandedConceptIds([]);
        if (nextConcept) {
            // 개념 화면의 분야는 이전에 보던 분야가 아니라 그 개념의 분야로 정한다. 어떤 경로로 들어와도 같은 화면이 된다.
            setCategoryFilter(index.conceptsById.get(nextConcept)?.category ?? null);
            setSelection(nextArticle ? { kind: 'article', id: nextArticle } : { kind: 'concept', id: nextConcept });
            return;
        }
        const nextCategory = typeof category === 'string' && index.categoryNames.has(category) ? category : null;
        setCategoryFilter(nextCategory);
        setSelection(nextArticle ? { kind: 'article', id: nextArticle } : { kind: 'hub', id: nextCategory ?? 'all' });
    }, [router.isReady, router.query, index]);

    // Next 라우터가 기록마다 붙이는 key 로 지금이 몇 번째 화면인지 센다. 뒤로, 앞으로 가기면 이미 본 key 로 돌아온다.
    useEffect(() => {
        if (!router.isReady) {
            return;
        }
        const key = (window.history.state as { key?: string } | null)?.key ?? router.asPath;
        const history = historyRef.current;
        const found = history.keys.indexOf(key);
        if (found >= 0) {
            history.current = found;
        } else {
            history.keys = [...history.keys.slice(0, history.current + 1), key];
            history.current = history.keys.length - 1;
        }
        setCanGoBack(history.current > 0);
    }, [router.isReady, router.asPath]);

    // 중심을 바꾸는 동작은 URL 만 바꾸고, 상태는 위 effect 가 맞춘다. 그래서 탐색 기록이 브라우저 기록과 같다.
    const navigate = (query: Record<string, string>): void => {
        void router.push({ pathname: router.pathname, query }, undefined, { shallow: true, scroll: false });
    };

    const subgraph = useMemo(
        () =>
            centerConceptId === null
                ? buildOverview(index, categoryFilter)
                : buildSubgraph(index, centerConceptId, { expanded: expandedConceptIds, categoryFilter: null }),
        [index, centerConceptId, expandedConceptIds, categoryFilter],
    );
    const hiddenIds = useMemo(
        () => (subgraph ? hiddenElementIds(subgraph, { hiddenKinds, hiddenRelationTypes }) : new Set<string>()),
        [subgraph, hiddenKinds, hiddenRelationTypes],
    );
    const centerConcept = centerConceptId ? index.conceptsById.get(centerConceptId) : undefined;
    const filterName = categoryFilter ? index.categoryNames.get(categoryFilter) ?? categoryFilter : 'All';
    const centerCategoryName = centerConcept ? index.categoryNames.get(centerConcept.category) ?? '' : '';

    // 전체 보기에서는 선 대신 데이터로 개념과 글의 연결을 찾아 함께 강조한다.
    const relatedNodeIds = useMemo(() => {
        if (centerConceptId !== null || !selection || !subgraph) {
            return null;
        }
        if (selection.kind === 'concept') {
            return [subgraph.centerId, ...(index.articlesByConcept.get(selection.id) ?? []).map((article) => articleNodeId(article.id))];
        }
        if (selection.kind === 'article') {
            const article = index.articlesById.get(selection.id);
            return [subgraph.centerId, ...(article?.concepts ?? []).map((conceptId) => conceptNodeId(conceptId))];
        }
        return null;
    }, [centerConceptId, selection, subgraph, index]);
    const expandableConceptIds = useMemo(
        () => new Set((subgraph?.nodes ?? []).filter((node) => node.role === 'neighbor').map((node) => node.refId)),
        [subgraph],
    );

    const selectedNodeId = useMemo(() => {
        if (!selection || !subgraph) {
            return null;
        }
        if (selection.kind === 'hub') {
            return null;
        }
        const id = selection.kind === 'concept' ? conceptNodeId(selection.id) : articleNodeId(selection.id);
        return subgraph.nodes.some((node) => node.id === id) ? id : null;
    }, [selection, subgraph]);

    // 다른 노드를 고르면 패널을 맨 위부터 보여준다.
    useEffect(() => {
        panelRef.current?.scrollTo({ top: 0 });
    }, [selection]);

    const handleSelect = (next: Selection): void => {
        setSelection(next);
        setIsPanelOpen(true);
    };

    const handleExplore = (conceptId: string): void => {
        setIsPanelOpen(true);
        if (conceptId === centerConceptId) {
            setSelection({ kind: 'concept', id: conceptId });
            return;
        }
        navigate({ concept: conceptId });
    };

    // 검색에서 글을 고르면 그 글이 보이는 그래프로 옮기고, 고른 글을 주소에 담는다.
    // 지금 그래프에 그 글이 있으면 화면은 그대로 두고 주소에만 더하고, 없으면 전체 보기로 가서 그 글과 이어진 개념을 강조한다.
    const handleSearchSelect = (next: Selection): void => {
        if (next.kind === 'concept') {
            handleExplore(next.id);
            return;
        }
        if (next.kind !== 'article') {
            handleSelect(next);
            return;
        }
        setIsPanelOpen(true);
        const isOnGraph = subgraph?.nodes.some((node) => node.id === articleNodeId(next.id)) ?? false;
        if (!isOnGraph) {
            navigate({ article: next.id });
            return;
        }
        const current = centerConceptId ? { concept: centerConceptId } : categoryFilter ? { category: categoryFilter } : {};
        navigate({ ...current, article: next.id });
    };

    const handleToggleExpand = (conceptId: string): void => {
        setExpandedConceptIds((current) =>
            current.includes(conceptId) ? current.filter((id) => id !== conceptId) : [...current, conceptId],
        );
    };

    const handleSelectNode = (node: SubgraphNode): void => {
        handleSelect({ kind: node.kind, id: node.refId });
    };

    // 탭이나 경로에서 분야를 고르면 그 분야의 전체 보기로 돌아간다.
    const handleShowOverview = (categoryId: string | null): void => {
        setIsPanelOpen(true);
        // 주소에 고른 글이 담겨 있으면 같은 분야라도 주소를 다시 써서 글 선택을 지운다.
        if (centerConceptId === null && categoryId === categoryFilter && !router.query.article) {
            setSelection({ kind: 'hub', id: categoryId ?? 'all' });
            return;
        }
        navigate(categoryId ? { category: categoryId } : {});
    };


    return (
        <>
            <Seo
                title="Knowledge"
                description="블로그 글에서 다룬 기술 개념과 그 사이의 관계를 따라가며 원문을 찾는 지식 그래프"
            />
            <Header />
            <main>
                {/* 상단 영역: 다른 목록 페이지(Posts, Read / Keep)와 같은 히어로 */}
                <div className="bg-gradient-to-b from-sky-50 via-emerald-50/40 to-white text-gray-800">
                    <div className="mx-auto w-full px-4 py-14 text-center sm:px-6 lg:px-8">
                        <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">Knowledge Graph</h1>
                        <p className="mt-2 text-sm text-gray-400">블로그 글에서 다룬 기술 개념과 그 연결을 따라가 보세요.</p>
                    </div>
                </div>

                {/* 검색 + 분야 (sticky): Posts 페이지의 검색바와 태그 버튼과 같은 모양 */}
                <div className="sticky top-14 z-30 bg-white/90 backdrop-blur-md">
                    <div className="mx-auto max-w-5xl space-y-4 border-b border-gray-200 px-4 py-3 shadow-sm">
                        <div className="flex justify-center">
                            <KnowledgeSearch
                                data={data}
                                categoryNames={index.categoryNames}
                                // 개념 화면은 그 개념의 분야가 정해져 있어도 다른 분야 글로 넘어갈 수 있게 전체에서 찾는다.
                                categoryFilter={centerConceptId ? null : categoryFilter}
                                onSelect={handleSearchSelect}
                            />
                        </div>
                        {/* 가로 스크롤(overflow-x-auto)은 세로도 잘라내므로, 위아래 여백을 둬서 버튼 모서리와 포커스 테두리가 잘리지 않게 한다. */}
                        <nav aria-label="분야 필터" className="flex justify-start gap-1.5 lg:justify-center overflow-x-auto px-1 py-1">
                            {[{ id: null, name: 'All' }, ...data.categories].map((category) => {
                                const isActive = categoryFilter === category.id;
                                const count = category.id === null
                                    ? data.concepts.length
                                    : data.concepts.filter((concept) => concept.category === category.id).length;
                                return (
                                    <button
                                        key={category.id ?? 'all'}
                                        type="button"
                                        aria-pressed={isActive}
                                        onClick={() => handleShowOverview(category.id)}
                                        className={`flex-shrink-0 whitespace-nowrap rounded-full px-4 py-1.5 text-[13px] font-medium transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-300 ${
                                            isActive ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                                        }`}
                                    >
                                        {category.name}
                                        <span className="ml-0.5 text-gray-400">{count}</span>
                                    </button>
                                );
                            })}
                        </nav>
                    </div>
                </div>

                <div className="mx-auto max-w-7xl px-4 pb-16 pt-6 sm:px-6 lg:px-8">
                <div
                    ref={frameRef}
                    className="flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white lg:h-[680px] lg:flex-row [&:fullscreen]:h-screen [&:fullscreen]:rounded-none [&:fullscreen]:border-0"
                >
                    <section
                        aria-label="지식 그래프"
                        className="relative h-[60vh] min-h-[420px] flex-1 lg:h-auto"
                    >
                        {subgraph && (
                            <GraphCanvas
                                subgraph={subgraph}
                                relatedNodeIds={relatedNodeIds}
                                centerCaption={centerConcept ? centerCategoryName : ''}
                                selectedNodeId={selectedNodeId}
                                hiddenIds={hiddenIds}
                                onSelectNode={handleSelectNode}
                                onRecenter={handleExplore}
                                onClearSelection={() =>
                                    setSelection(centerConceptId ? { kind: 'concept', id: centerConceptId } : { kind: 'hub', id: categoryFilter ?? 'all' })
                                }
                            />
                        )}

                        <nav aria-label="탐색 경로" className="absolute left-5 top-4 z-10 flex items-center gap-1 text-xs text-gray-500">
                            {canGoBack && (
                                <button
                                    type="button"
                                    onClick={() => router.back()}
                                    className="mr-2 inline-flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-gray-600 ring-1 ring-gray-200 hover:text-gray-900"
                                >
                                    <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
                                    이전
                                </button>
                            )}
                            <button type="button" onClick={() => handleShowOverview(categoryFilter)} className="hover:text-gray-900">
                                {filterName}
                            </button>
                            {centerConcept && (
                                <>
                                    <span aria-hidden>/</span>
                                    <span className="text-gray-700">{centerConcept.name}</span>
                                </>
                            )}
                        </nav>
                        <div className="absolute right-3 top-3 z-10 flex items-center gap-0.5">
                            <button
                                type="button"
                                aria-label={isUrlCopied ? '주소를 복사했습니다' : '현재 탐색 주소 복사'}
                                title={isUrlCopied ? '복사했어요' : '현재 탐색 주소 복사'}
                                onClick={copyUrl}
                                className="flex h-8 w-8 items-center justify-center text-gray-700 hover:text-black"
                            >
                                {isUrlCopied ? <Check className="h-[18px] w-[18px] text-emerald-600" /> : <Link2 className="h-[18px] w-[18px]" />}
                            </button>
                            <button
                                type="button"
                                aria-label={isFullscreen ? '전체 화면 끝내기' : '전체 화면'}
                                title={isFullscreen ? '전체 화면 끝내기' : '전체 화면'}
                                onClick={toggleFullscreen}
                                className="flex h-8 w-8 items-center justify-center text-gray-700 hover:text-black"
                            >
                                {isFullscreen ? <Minimize2 className="h-[18px] w-[18px]" /> : <Maximize2 className="h-[18px] w-[18px]" />}
                            </button>
                            {/* 패널을 닫았을 때만 그래프 도구 줄에 여는 버튼을 둔다. 열려 있을 때는 패널 안에 닫기 버튼이 있다. */}
                            {!isPanelOpen && (
                                <button
                                    type="button"
                                    aria-expanded={false}
                                    aria-label="상세 보기"
                                    title="상세 보기"
                                    onClick={() => setIsPanelOpen(true)}
                                    className="hidden h-8 w-8 items-center justify-center text-gray-700 hover:text-black lg:flex"
                                >
                                    <Info className="h-[18px] w-[18px]" />
                                </button>
                            )}
                        </div>
                        {/* 범례가 곧 필터다. 누르면 그 종류를 숨기고, 다시 누르면 보여준다. */}
                        <div className="absolute bottom-4 left-3 right-28 z-10 flex flex-wrap items-center gap-x-1 gap-y-1 text-xs sm:left-4" role="group" aria-label="범례와 필터">
                            {NODE_LEGEND.map(({ kind, label, swatch }) => {
                                const isHidden = hiddenKinds.includes(kind);
                                return (
                                    <button
                                        key={kind}
                                        type="button"
                                        aria-pressed={!isHidden}
                                        title={isHidden ? `${label} 보이기` : `${label} 숨기기`}
                                        onClick={() => setHiddenKinds((current) => toggle(current, kind))}
                                        className={`flex items-center gap-1.5 rounded-full px-2 py-1 transition hover:bg-gray-100 ${isHidden ? 'text-gray-300 line-through' : 'text-gray-600'}`}
                                    >
                                        <span className={`flex items-center ${isHidden ? 'opacity-30' : ''}`}>{swatch}</span>
                                        {label}
                                    </button>
                                );
                            })}
                            {centerConceptId !== null && (
                                <>
                                    <span className="mx-1.5 h-3 w-px bg-gray-200" aria-hidden />
                                    {RELATION_LEGEND.map(({ type, label, swatch }) => {
                                        const isHidden = hiddenRelationTypes.includes(type);
                                        return (
                                            <button
                                                key={type}
                                                type="button"
                                                aria-pressed={!isHidden}
                                                title={isHidden ? `${label} 관계 보이기` : `${label} 관계 숨기기`}
                                                onClick={() => setHiddenRelationTypes((current) => toggle(current, type))}
                                                className={`flex items-center gap-1.5 rounded-full px-2 py-1 transition hover:bg-gray-100 ${isHidden ? 'text-gray-300 line-through' : 'text-gray-600'}`}
                                            >
                                                <span className={`flex items-center ${isHidden ? 'opacity-30' : ''}`}>{swatch}</span>
                                                {label}
                                            </button>
                                        );
                                    })}
                                </>
                            )}
                        </div>
                        {subgraph && (subgraph.hiddenCount > 0 || subgraph.skippedExpansions.length > 0) && (
                            <p className="absolute left-5 top-9 rounded-md bg-white/90 px-2.5 py-1.5 text-[11px] text-gray-500">
                                {subgraph.hiddenCount > 0 ? `연결이 많아 ${subgraph.hiddenCount}개는 그리지 않았습니다. ` : ''}
                                {subgraph.skippedExpansions.length > 0 ? '노드가 많아 일부 연결은 펼치지 않았습니다.' : ''}
                            </p>
                        )}


                    </section>

                    {isPanelOpen && (
                        <aside
                            ref={panelRef}
                            aria-label="상세 정보"
                            className="relative border-t border-gray-200 bg-white px-7 pb-8 pt-7 lg:w-[32%] lg:min-w-[340px] lg:overflow-y-auto lg:border-l lg:border-t-0 lg:pt-3"
                        >
                            {/* 모바일에서는 패널이 그래프 아래에 붙어 있어 닫을 필요가 없으므로 넓은 화면에서만 보인다. */}
                            <div className="-mr-3 mb-1 hidden justify-end lg:flex">
                                <button
                                    type="button"
                                    aria-expanded
                                    aria-label="상세 닫기"
                                    title="상세 닫기"
                                    onClick={() => setIsPanelOpen(false)}
                                    className="flex h-8 w-8 items-center justify-center rounded-full text-gray-500 transition hover:bg-gray-100 hover:text-gray-900"
                                >
                                    <X className="h-[18px] w-[18px]" />
                                </button>
                            </div>
                            {selection && (
                                <DetailPanel
                                    selection={selection}
                                    index={index}
                                    articles={data.articles}
                                    centerConceptId={centerConceptId}
                                    expandableConceptIds={expandableConceptIds}
                                    expandedConceptIds={expandedConceptIds}
                                    onSelect={handleSelect}
                                    onExplore={handleExplore}
                                    onToggleExpand={handleToggleExpand}
                                    onShowOverview={handleShowOverview}
                                />
                            )}
                        </aside>
                    )}
                </div>
                {/* 그래프와 패널을 쓰는 데 방해되지 않도록 틀 바깥 아래에 광고를 하나 둔다. */}
                <div className="mt-10">
                    <AdSense />
                </div>
                </div>
            </main>
        </>
    );
}
