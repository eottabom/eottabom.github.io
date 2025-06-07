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
