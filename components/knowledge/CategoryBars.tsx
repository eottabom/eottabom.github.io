import { categoryColor } from '../../lib/knowledge/colors';

export interface CategoryCount {
    id: string;
    name: string;
    count: number;
}

// 분야 목록. 개념 수만큼 차는 막대로 분야별 비중을 한눈에 보여준다.
// 상세 패널(전체 보기)과 메인 페이지 그래프 옆에서 같이 쓴다.
interface CategoryBarsProps {
    categories: CategoryCount[];
    onSelect: (categoryId: string) => void;
    // 마우스를 올리거나 키보드로 고른 분야. 벗어나면 null 이다. 메인 페이지에서 그래프를 함께 강조할 때 쓴다.
    onHover?: (categoryId: string | null) => void;
}

export default function CategoryBars({ categories, onSelect, onHover }: CategoryBarsProps) {
    // 막대 길이는 가장 큰 분야를 기준으로 정해, 맨 위 막대가 꽉 차고 서로 비교하기 쉽게 한다.
    const largestCount = Math.max(1, ...categories.map(({ count }) => count));
    return (
        <ul className="space-y-2.5">
            {categories.map(({ id, name, count }) => (
                <li key={id}>
                    <button
                        type="button"
                        onClick={() => onSelect(id)}
                        onMouseEnter={() => onHover?.(id)}
                        onMouseLeave={() => onHover?.(null)}
                        onFocus={() => onHover?.(id)}
                        onBlur={() => onHover?.(null)}
                        className="group w-full text-left"
                    >
                        <span className="flex items-center justify-between text-sm text-gray-700 group-hover:text-gray-900">
                            <span className="flex items-center gap-2">
                                <span className="h-2.5 w-2.5 flex-shrink-0 rounded-full" style={{ backgroundColor: categoryColor(id) }} aria-hidden />
                                {name}
                            </span>
                            <span className="text-xs text-gray-400">{count}</span>
                        </span>
                        <span className="mt-1.5 block h-1 rounded-full bg-gray-100">
                            <span
                                className="block h-1 rounded-full opacity-70 transition group-hover:opacity-100"
                                style={{ width: `${(count / largestCount) * 100}%`, backgroundColor: categoryColor(id) }}
                            />
                        </span>
                    </button>
                </li>
            ))}
        </ul>
    );
}
