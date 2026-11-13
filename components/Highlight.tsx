type HighlightProps = {
    color?: 'red' | 'blue' | 'green' | 'yellow';
    children: React.ReactNode;
};

const colorClassMap = {
    red: 'text-red-600',
    blue: 'text-blue-600',
    green: 'text-green-600',
    yellow: 'text-yellow-600',
};

export function Highlight({ color = 'red', children }: HighlightProps) {
    const colorClass = colorClassMap[color] ?? 'text-red-600';
    return <span className={`${colorClass} font-bold`}>{children}</span>;
}

export function RedText({ children }: { children: React.ReactNode }) {
    return <Highlight color="red">{children}</Highlight>;
}

export function BlueText({ children }: { children: React.ReactNode }) {
    return <Highlight color="blue">{children}</Highlight>;
}

export function GreenText({ children }: { children: React.ReactNode }) {
    return <Highlight color="green">{children}</Highlight>;
}

// 그림의 번호(색 원 안의 흰 숫자)를 본문에서 같은 모양으로 가리킬 때 쓴다.
// 색은 Excalidraw 그림의 선 색과 맞췄다. 편집 툴(DevEditor)의 번호 메뉴도 이 목록을 쓴다.
export const STEP_NUMBER_COLORS = [
    { color: 'black', label: '검정', className: 'bg-[#1e1e1e]' },
    { color: 'blue', label: '파랑', className: 'bg-[#1971c2]' },
    { color: 'purple', label: '보라', className: 'bg-[#6741d9]' },
    { color: 'green', label: '초록', className: 'bg-[#2f9e44]' },
    { color: 'red', label: '빨강', className: 'bg-[#e03131]' },
    { color: 'orange', label: '주황', className: 'bg-[#f08c00]' },
] as const;

export type StepNumberColor = (typeof STEP_NUMBER_COLORS)[number]['color'];

export const stepNumberClassName = (color: StepNumberColor = 'black'): string => {
    const bg = STEP_NUMBER_COLORS.find((c) => c.color === color)?.className ?? STEP_NUMBER_COLORS[0].className;
    return `inline-block h-5 w-5 rounded-full ${bg} text-center relative -top-0.5 align-middle font-sans text-[12px] font-semibold leading-5 tabular-nums text-white`;
};

export function StepNumber({ color = 'black', children }: { color?: StepNumberColor; children: React.ReactNode }) {
    return <span className={stepNumberClassName(color)}>{children}</span>;
}
