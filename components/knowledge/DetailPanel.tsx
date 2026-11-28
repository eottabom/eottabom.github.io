import Link from 'next/link';
import { useState } from 'react';
import type { ReactNode } from 'react';
import { ArrowRight, ChevronDown, FileText } from 'lucide-react';
import { ARTICLE_COLOR, categoryColor } from '../../lib/knowledge/colors';
import { RELATION_GROUPS, findArticlesSharingConcepts, findSectionsInArticle, groupConceptRelations, mergeRelationRows } from '../../lib/knowledge/query';
import type { KnowledgeIndex, RelationRow, Selection } from '../../lib/knowledge/query';
import type { Article, Concept, Evidence } from '../../lib/knowledge/types';
import CategoryBars from './CategoryBars';

// 글 목록은 처음에 이만큼 보여주고, 더보기를 누를 때마다 이만큼 더 펼친다.
const ARTICLE_PAGE_SIZE = 5;

const byNewest = (a: Article, b: Article): number => b.date.localeCompare(a.date);

interface DetailPanelProps {
    selection: Selection;
    index: KnowledgeIndex;
    articles: Article[];
    // null 이면 지금 전체 보기다.
    centerConceptId: string | null;
    // 지금 그래프에서 펼칠 수 있는 개념(중심과 직접 이어진 개념)
    expandableConceptIds: Set<string>;
    expandedConceptIds: string[];
    onSelect: (selection: Selection) => void;
    // 개념을 중심으로 다시 탐색한다.
    onExplore: (conceptId: string) => void;
    onToggleExpand: (conceptId: string) => void;
    // 분야 전체 보기로 간다. null 이면 전체.
    onShowOverview: (categoryId: string | null) => void;
}

type PanelActions = Omit<DetailPanelProps, 'selection' | 'index' | 'articles'>;

const primaryButtonClass = 'rounded-full bg-gray-900 px-4 py-1.5 text-xs font-medium text-white transition hover:bg-gray-700';
const secondaryButtonClass = 'rounded-full bg-gray-100 px-4 py-1.5 text-xs font-medium text-gray-700 transition hover:bg-gray-200';

const shortTitle = (title: string): string => title.split(' - ')[0];

// 그래프의 개념 노드와 같은 모양(분야 색으로 채운 원)이다. 색은 데이터에 따라 달라지므로 인라인 스타일로 준다.
const Dot = ({ color }: { color: string }) => (
    <span className="h-2.5 w-2.5 flex-shrink-0 rounded-full" style={{ backgroundColor: color }} aria-hidden />
);

// 세 화면(개념, 글, 분야)이 같이 쓰는 맨 위 한 줄. 위치 경로는 그래프 왼쪽 위에 이미 있으므로 여기에는 두지 않는다.
// 왼쪽은 글 화면에서만 쓰는 종류 표시이고, 오른쪽은 짧은 요약이다.
const PanelHeader = ({ left, right }: { left?: ReactNode; right: string }) => (
    <div className="flex items-center justify-between gap-3 text-xs">
        <div className="flex min-w-0 items-center gap-1 text-gray-500">{left}</div>
        <span className="flex-shrink-0 text-gray-400">{right}</span>
    </div>
);

const Section = ({ title, count, children }: { title: string; count?: number; children: ReactNode }) => (
    <section className="mt-8">
        <h3 className="text-sm font-bold text-gray-900">
            {title}
            {count !== undefined && <span className="ml-1 font-medium text-gray-400">{count}</span>}
        </h3>
        <div className="mt-3">{children}</div>
    </section>
);

const ConceptChip = ({ concept, onClick, title }: { concept: Concept | undefined; onClick: () => void; title?: string }) => {
    if (!concept) {
        return null;
    }
    return (
        <button
            type="button"
            title={title}
            onClick={onClick}
            className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3 py-1 text-[13px] text-gray-700 transition hover:border-gray-400 hover:text-gray-900"
        >
            <Dot color={categoryColor(concept.category)} />
            {concept.name}
        </button>
    );
};

// 절 링크를 쉼표로 이어 보여준다. 글 카드와 개념 행에서 "어디를 읽으면 되는지" 알려줄 때 쓴다.
const SectionLinks = ({ label, sections }: { label: string; sections: Evidence[] }) =>
    sections.length === 0 ? null : (
        <p className="mt-1.5 text-xs leading-relaxed text-gray-500">
            {label}{' '}
            {sections.map((section, position) => (
                <span key={section.url}>
                    {position > 0 && ', '}
                    <a href={section.url} className="text-gray-600 underline decoration-gray-300 underline-offset-2 hover:text-blue-600">
                        {section.heading}
                    </a>
                </span>
            ))}
        </p>
    );

// children 자리에 화면마다 다른 부가 정보(이 개념이 나오는 절, 겹치는 개념)를 넣는다.
const ArticleCard = ({ article, onSelect, children }: { article: Article; onSelect: DetailPanelProps['onSelect']; children?: ReactNode }) => (
    <li className="group rounded-xl border border-gray-200 bg-white p-4 transition hover:border-gray-300 hover:shadow-sm">
        <button
            type="button"
            onClick={() => onSelect({ kind: 'article', id: article.id })}
            className="text-left text-[14px] font-semibold leading-snug text-gray-900 group-hover:text-blue-600"
        >
            {shortTitle(article.title)}
        </button>
        {children}
        <div className="mt-2 flex items-center justify-between">
            <span className="text-xs text-gray-400">{article.date}</span>
            <Link href={article.url} className="inline-flex items-center gap-0.5 text-xs font-medium text-blue-600 hover:text-blue-700">
                원문 읽기
                <ArrowRight className="h-3.5 w-3.5" aria-hidden />
            </Link>
        </div>
    </li>
);

// 관련 글을 모두 보여주되, 길어지지 않도록 몇 개씩 나눠 펼친다. 다른 노드를 고르면 DetailPanel 의 key 가 바뀌어 처음 개수로 돌아간다.
const MoreArticleList = ({ articles, renderCard }: { articles: Article[]; renderCard: (article: Article) => ReactNode }) => {
    const [visibleCount, setVisibleCount] = useState(ARTICLE_PAGE_SIZE);
    const restCount = articles.length - visibleCount;
    return (
        <>
            <ul className="space-y-2.5">{articles.slice(0, visibleCount).map(renderCard)}</ul>
            {restCount > 0 && (
                <button
                    type="button"
                    onClick={() => setVisibleCount((count) => count + ARTICLE_PAGE_SIZE)}
                    className="mt-3 flex w-full items-center justify-center gap-1 rounded-xl border border-gray-200 py-2 text-xs font-medium text-gray-600 transition hover:border-gray-300 hover:bg-gray-50 hover:text-gray-900"
                >
                    더보기
                    <span className="text-gray-400">{restCount}</span>
                    <ChevronDown className="h-3.5 w-3.5" aria-hidden />
                </button>
            )}
        </>
    );
};

const DocumentLink = ({ href, children }: { href: string; children: ReactNode }) => (
    <a href={href} className="flex items-start gap-2 text-[13px] leading-snug text-gray-600 hover:text-blue-600">
        <FileText className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-gray-400" aria-hidden />
        <span>{children}</span>
    </a>
);

// 관계 한 줄. 이어진 개념 이름 아래에 왜 이어졌는지(설명)와 어디서 읽을 수 있는지(근거 절)를 함께 보여준다.
const RelationRowItem = ({ row, index, onExplore }: { row: RelationRow; index: KnowledgeIndex; onExplore: (conceptId: string) => void }) => {
    const concepts = row.conceptIds.flatMap((conceptId) => {
        const concept = index.conceptsById.get(conceptId);
        return concept ? [concept] : [];
    });
    if (concepts.length === 0) {
        return null;
    }
    return (
        <li className="py-3">
            <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1">
                <Dot color={categoryColor(concepts[0].category)} />
                {concepts.map((concept, position) => (
                    <span key={concept.id} className="text-sm">
                        <button type="button" onClick={() => onExplore(concept.id)} className="font-semibold text-gray-900 hover:text-blue-600">
                            {concept.name}
                        </button>
                        {position < concepts.length - 1 && <span className="text-gray-400">,</span>}
                    </span>
                ))}
            </div>
            {row.description && <p className="mt-1 pl-4 text-[13px] leading-relaxed text-gray-600">{row.description}</p>}
            {row.evidence.length > 0 && (
                <p className="mt-1 pl-4 text-xs leading-relaxed text-gray-400">
                    근거{' '}
                    {row.evidence.map((item, position) => (
                        <span key={item.url}>
                            {position > 0 && ', '}
                            <a href={item.url} className="text-blue-600 hover:text-blue-700">
                                › {item.heading ?? shortTitle(item.articleTitle)}
                            </a>
                        </span>
                    ))}
                </p>
            )}
        </li>
    );
};

const ConceptDetail = ({ concept, index, actions }: { concept: Concept; index: KnowledgeIndex; actions: PanelActions }) => {
    const { centerConceptId, expandableConceptIds, expandedConceptIds, onSelect, onExplore, onToggleExpand } = actions;
    const relations = index.relationsByConcept.get(concept.id) ?? [];
    const groups = groupConceptRelations(concept.id, relations);
    const conceptArticles = index.articlesByConcept.get(concept.id) ?? [];
    const connectedCount = new Set(RELATION_GROUPS.flatMap(({ key }) => groups[key].map(({ conceptId }) => conceptId))).size;
    const isCenter = concept.id === centerConceptId;
    const isExpandable = expandableConceptIds.has(concept.id);
    const isExpanded = expandedConceptIds.includes(concept.id);
    const leadArticle = conceptArticles[0];

    return (
        <>
            <PanelHeader right={`연결 ${connectedCount}, 글 ${conceptArticles.length}`} />
            <h2 className="mt-3 text-2xl font-extrabold leading-tight tracking-tight text-gray-900">{concept.name}</h2>
            <p className="mt-3 text-[15px] leading-relaxed text-gray-700">{concept.description}</p>
            <div className="mt-5 flex flex-wrap gap-2">
                {isCenter && leadArticle && (
                    <Link href={leadArticle.url} className={`inline-flex items-center gap-1 ${primaryButtonClass}`}>
                        대표 글 읽기
                        <ArrowRight className="h-3.5 w-3.5" aria-hidden />
                    </Link>
                )}
                {!isCenter && (
                    <button type="button" onClick={() => onExplore(concept.id)} className={primaryButtonClass}>
                        이 개념 중심으로 보기
                    </button>
                )}
                {isExpandable && (
                    <button type="button" aria-pressed={isExpanded} onClick={() => onToggleExpand(concept.id)} className={secondaryButtonClass}>
                        {isExpanded ? '펼친 연결 접기' : '연결 펼치기'}
                    </button>
                )}
            </div>

            {RELATION_GROUPS.map(({ key, label }) =>
                groups[key].length === 0 ? null : (
                    <Section key={key} title={label} count={groups[key].length}>
                        <ul className="divide-y divide-gray-100 border-y border-gray-100">
                            {mergeRelationRows(groups[key]).map((row) => (
                                <RelationRowItem key={row.conceptIds.join(',')} row={row} index={index} onExplore={onExplore} />
                            ))}
                        </ul>
                    </Section>
                ),
            )}

            {conceptArticles.length > 0 && (
                <Section title="이 개념을 다룬 글" count={conceptArticles.length}>
                    <MoreArticleList
                        articles={conceptArticles}
                        renderCard={(article) => (
                            <ArticleCard key={article.id} article={article} onSelect={onSelect}>
                                <SectionLinks label="이 개념이 나오는 절:" sections={findSectionsInArticle(relations, article.id)} />
                            </ArticleCard>
                        )}
                    />
                </Section>
            )}
        </>
    );
};

// 이 글이 다룬 개념 한 줄. 개념 설명과 함께, 이 글의 어느 절에서 그 개념을 다뤘는지 보여준다.
const ArticleConceptRow = ({ concept, article, index, onExplore }: { concept: Concept; article: Article; index: KnowledgeIndex; onExplore: (conceptId: string) => void }) => (
    <li className="py-3">
        <div className="flex items-center justify-between gap-3">
            <button type="button" onClick={() => onExplore(concept.id)} className="inline-flex items-center gap-1.5 text-left text-sm font-semibold text-gray-900 hover:text-blue-600">
                <Dot color={categoryColor(concept.category)} />
                {concept.name}
            </button>
            <span className="flex-shrink-0 text-xs text-gray-400">{index.categoryNames.get(concept.category) ?? concept.category}</span>
        </div>
        <p className="mt-1 line-clamp-2 pl-4 text-[13px] leading-relaxed text-gray-600">{concept.description}</p>
        <div className="pl-4">
            <SectionLinks label="이 글의 절:" sections={findSectionsInArticle(index.relationsByConcept.get(concept.id) ?? [], article.id)} />
        </div>
    </li>
);

const ArticleDetail = ({ article, index, articles, actions }: { article: Article; index: KnowledgeIndex; articles: Article[]; actions: PanelActions }) => {
    // 개수 제한 없이 모두 구하고, 보여주는 개수는 더보기로 조절한다.
    const sharing = findArticlesSharingConcepts(article, articles, articles.length);
    const concepts = article.concepts.flatMap((conceptId) => {
        const concept = index.conceptsById.get(conceptId);
        return concept ? [concept] : [];
    });
    const conceptNames = (other: Article): string =>
        other.concepts
            .filter((conceptId) => article.concepts.includes(conceptId))
            .map((conceptId) => index.conceptsById.get(conceptId)?.name ?? conceptId)
            .join(', ');

    return (
        <>
            <PanelHeader
                left={
                    <span className="inline-flex items-center gap-1.5">
                        <span className="h-3 w-2.5 rounded-[2px]" style={{ backgroundColor: ARTICLE_COLOR }} aria-hidden />글
                    </span>
                }
                right={`개념 ${concepts.length}`}
            />
            <h2 className="mt-3 text-xl font-extrabold leading-snug tracking-tight text-gray-900">{article.title}</h2>
            <p className="mt-2 text-xs text-gray-400">
                Posted Date: {article.date}
                {article.updated && article.updated !== article.date ? `, Updated: ${article.updated}` : ''}
            </p>
            {article.description && <p className="mt-3 text-[15px] leading-relaxed text-gray-700">{article.description}</p>}
            <div className="mt-5">
                <Link href={article.url} className={`inline-flex items-center gap-1 ${primaryButtonClass}`}>
                    원문 읽기
                    <ArrowRight className="h-3.5 w-3.5" aria-hidden />
                </Link>
            </div>

            <Section title="이 글의 개념" count={concepts.length}>
                <ul className="divide-y divide-gray-100 border-y border-gray-100">
                    {concepts.map((concept) => (
                        <ArticleConceptRow key={concept.id} concept={concept} article={article} index={index} onExplore={actions.onExplore} />
                    ))}
                </ul>
            </Section>

            {article.references.length > 0 && (
                <Section title="본문에서 참조한 글" count={article.references.length}>
                    <ul className="space-y-2">
                        {article.references.map((reference) => (
                            <li key={reference.id}>
                                <DocumentLink href={reference.url}>{shortTitle(reference.title)}</DocumentLink>
                            </li>
                        ))}
                    </ul>
                </Section>
            )}

            {sharing.length > 0 && (
                <Section title="같은 개념을 다룬 글" count={sharing.length}>
                    <MoreArticleList
                        articles={sharing}
                        renderCard={(other) => (
                            <ArticleCard key={other.id} article={other} onSelect={actions.onSelect}>
                                <p className="mt-1.5 text-xs leading-relaxed text-gray-500">겹치는 개념: {conceptNames(other)}</p>
                            </ArticleCard>
                        )}
                    />
                </Section>
            )}
        </>
    );
};

const HubDetail = ({ categoryId, index, articles, actions }: { categoryId: string | null; index: KnowledgeIndex; articles: Article[]; actions: PanelActions }) => {
    const allConcepts = [...index.conceptsById.values()];
    const concepts = allConcepts.filter((concept) => categoryId === null || concept.category === categoryId);
    const conceptIds = new Set(concepts.map((concept) => concept.id));
    const categoryArticles = articles.filter((article) => article.concepts.some((id) => conceptIds.has(id))).sort(byNewest);
    const name = categoryId ? index.categoryNames.get(categoryId) ?? categoryId : 'All';
    const countOf = (id: string): number => allConcepts.filter((concept) => concept.category === id).length;
    // 분야 보기에서는 글 카드에 그 글이 다룬 이 분야 개념을 보여준다.
    const categoryConceptNames = (article: Article): string =>
        article.concepts
            .filter((conceptId) => conceptIds.has(conceptId))
            .map((conceptId) => index.conceptsById.get(conceptId)?.name ?? conceptId)
            .join(', ');

    return (
        <>
            <PanelHeader right={`개념 ${concepts.length}, 글 ${categoryArticles.length}`} />
            <h2 className="mt-3 text-2xl font-extrabold tracking-tight text-gray-900">{name}</h2>
            <p className="mt-3 text-[13px] leading-relaxed text-gray-500">
                노드를 누르면 여기에 설명이 나오고, 개념을 두 번 누르면 그 개념을 중심으로 들어갑니다. 노드는 끌어서 옮길 수 있습니다.
            </p>

            {categoryId === null ? (
                <Section title="분야" count={index.categoryNames.size}>
                    <CategoryBars
                        categories={[...index.categoryNames.entries()].map(([id, categoryName]) => ({ id, name: categoryName, count: countOf(id) }))}
                        onSelect={actions.onShowOverview}
                    />
                </Section>
            ) : (
                <Section title="개념" count={concepts.length}>
                    <div className="flex flex-wrap gap-1.5">
                        {concepts.map((concept) => (
                            <ConceptChip key={concept.id} concept={concept} onClick={() => actions.onExplore(concept.id)} />
                        ))}
                    </div>
                </Section>
            )}

            {categoryArticles.length > 0 && (
                <Section title="관련 글" count={categoryArticles.length}>
                    <MoreArticleList
                        articles={categoryArticles}
                        renderCard={(article) => (
                            <ArticleCard key={article.id} article={article} onSelect={actions.onSelect}>
                                {categoryId && <p className="mt-1.5 text-xs leading-relaxed text-gray-500">다룬 개념: {categoryConceptNames(article)}</p>}
                            </ArticleCard>
                        )}
                    />
                </Section>
            )}
        </>
    );
};

export default function DetailPanel({ selection, index, articles, ...actions }: DetailPanelProps) {
    // 고른 노드마다 key 를 달리 줘서, 다른 노드로 바뀌면 더보기로 펼친 개수가 처음으로 돌아가게 한다.
    const key = `${selection.kind}:${selection.id}`;
    if (selection.kind === 'hub') {
        return <HubDetail key={key} categoryId={selection.id === 'all' ? null : selection.id} index={index} articles={articles} actions={actions} />;
    }
    if (selection.kind === 'concept') {
        const concept = index.conceptsById.get(selection.id);
        return concept ? <ConceptDetail key={key} concept={concept} index={index} actions={actions} /> : null;
    }
    const article = index.articlesById.get(selection.id);
    return article ? <ArticleDetail key={key} article={article} index={index} articles={articles} actions={actions} /> : null;
}
