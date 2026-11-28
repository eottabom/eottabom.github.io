import { useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useRouter } from 'next/router';
import type { Subgraph, SubgraphNode } from '../../lib/knowledge/subgraph';
import CategoryBars from './CategoryBars';
import type { CategoryCount } from './CategoryBars';

// 메인 페이지의 지식 그래프. Knowledge 페이지와 같은 GraphCanvas 를 미리보기 모드로 쓴다.
// 확대, 이동, 끌기는 막고, 노드를 누르면 그 노드를 볼 수 있는 페이지로 이동한다.

// Cytoscape 는 브라우저에서만 불러온다. 메인의 첫 번들에는 들어가지 않는다.
const GraphCanvas = dynamic(() => import('./GraphCanvas'), {
    ssr: false,
    loading: () => <p className="absolute inset-0 flex items-center justify-center text-xs text-gray-400">그래프를 불러오는 중입니다.</p>,
});

const noop = (): void => {};

export default function KnowledgePreview({ subgraph, categories }: { subgraph: Subgraph; categories: CategoryCount[] }) {
    const router = useRouter();
    // GraphCanvas 는 hiddenIds 가 바뀌면 필터를 다시 적용하므로, 렌더링마다 새 Set 을 만들지 않는다.
    const hiddenIds = useMemo(() => new Set<string>(), []);
    const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);

    // 오른쪽 분야에 마우스를 올리면 그 분야 개념과, 그 개념을 다룬 글만 진하게 남기고 나머지는 흐리게 한다.
    // Knowledge 페이지의 선택 강조(가운데 허브를 고른 상태 + 함께 강조할 노드)를 그대로 쓴다.
    const highlightedIds = useMemo(() => {
        if (!hoveredCategory) {
            return null;
        }
        const conceptIds = new Set(
            subgraph.nodes.filter((node) => node.kind === 'concept' && node.category === hoveredCategory).map((node) => node.id),
        );
        const articleIds = subgraph.edges
            .filter((edge) => edge.type === 'MENTIONS' && conceptIds.has(edge.source))
            .map((edge) => edge.target);
        return [...conceptIds, ...articleIds];
    }, [hoveredCategory, subgraph]);

    const open = (node: SubgraphNode): void => {
        if (node.kind === 'concept') {
            void router.push(`/knowledge/?concept=${node.refId}`);
            return;
        }
        if (node.kind === 'article') {
            void router.push(`/post/${node.refId}/`);
            return;
        }
        void router.push('/knowledge/');
    };

    return (
        <section>
            <span className="inline-block px-3 py-1 text-xs font-semibold rounded-full bg-white text-gray-500 uppercase tracking-wide">
                Knowledge Graph
            </span>

            {/* 설명 문장은 두지 않는다. 제목과 그래프만으로 무엇인지 보이게 한다. */}
            <div className="mt-4 flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
                <h2 className="text-3xl font-bold text-gray-900">주제별로 둘러보기</h2>
                <Link
                    href="/knowledge/"
                    className="inline-block flex-shrink-0 self-start bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-6 py-2 rounded transition md:self-auto"
                >
                    Explore Knowledge Graph →
                </Link>
            </div>

            {/* 넓은 화면에서는 왼쪽 그래프, 오른쪽 분야 목록으로 빈 공간 없이 채운다. 좁은 화면에서는 위아래로 쌓는다. */}
            <div className="mt-8 grid overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm md:grid-cols-[minmax(0,1fr)_240px]">
                <div className="relative h-[420px] sm:h-[520px]">
                    <GraphCanvas
                        subgraph={subgraph}
                        relatedNodeIds={highlightedIds}
                        centerCaption=""
                        selectedNodeId={highlightedIds ? subgraph.centerId : null}
                        hiddenIds={hiddenIds}
                        onSelectNode={open}
                        onRecenter={noop}
                        onClearSelection={noop}
                        preview
                    />
                    <Link
                        href="/knowledge/"
                        className="absolute bottom-4 right-4 rounded-full bg-gray-900 px-3 py-1 text-xs font-medium text-white opacity-80 transition hover:opacity-100"
                    >
                        그래프 열기 →
                    </Link>
                </div>
                <div className="border-t border-gray-100 p-6 md:border-l md:border-t-0">
                    <h3 className="text-sm font-bold text-gray-900">
                        분야
                        <span className="ml-1 font-medium text-gray-400">{categories.length}</span>
                    </h3>
                    {/* 점과 선만 보이는 그래프는 무엇을 누를 수 있는지 드러나지 않으므로 한 줄로 알려준다. 모바일에서는 이 목록이 주 탐색 수단이다. */}
                    <p className="mt-1.5 text-xs leading-relaxed text-gray-400">분야를 고르거나 그래프의 점을 눌러 글을 찾아보세요.</p>
                    <div className="mt-4">
                        <CategoryBars
                            categories={categories}
                            onSelect={(categoryId) => void router.push(`/knowledge/?category=${categoryId}`)}
                            onHover={setHoveredCategory}
                        />
                    </div>
                </div>
            </div>
        </section>
    );
}
