import React, { ReactNode, ReactElement, useId, useState } from 'react';

type TabProps = { label: string; children: ReactNode };

export function Tabs({children, defaultIndex = 0, }: {
    children: ReactNode;
    defaultIndex?: number;
}) {
    const tabList = React.Children.toArray(children) as ReactElement<TabProps>[];
    const [active, setActive] = useState(Math.min(defaultIndex, tabList.length - 1));
    const uid = useId();

    return (
        <div className="w-full">
            {/* Tab bar */}
            <div
                role="tablist"
                aria-label="Tabs"
                className="inline-flex max-w-full overflow-x-auto rounded-t-lg border border-b-0 border-gray-200"
            >
                {tabList.map((tab, i) => {
                    const isActive = i === active;
                    return (
                        <button
                            key={i}
                            role="tab"
                            id={`${uid}-tab-${i}`}
                            aria-selected={isActive}
                            aria-controls={`${uid}-panel-${i}`}
                            onClick={() => setActive(i)}
                            className={[
                                'shrink-0 px-4 py-2 text-sm md:text-base select-none outline-none transition',
                                'border-b-2 -mb-px',
                                i === 0 ? 'rounded-tl-lg' : 'border-l border-l-gray-200',
                                i === tabList.length - 1 ? 'rounded-tr-lg' : '',
                                isActive
                                    ? 'border-b-blue-600 text-blue-600 font-semibold'
                                    : 'border-b-transparent text-gray-500 hover:text-gray-700 font-normal',
                            ].join(' ')}
                        >
                            {tab.props.label}
                        </button>
                    );
                })}
            </div>

            {/* Panel */}
            <div
                role="tabpanel"
                id={`${uid}-panel-${active}`}
                aria-labelledby={`${uid}-tab-${active}`}
                className="rounded-b-lg rounded-tr-lg border border-gray-200 bg-white p-5 md:p-7"
            >
                {tabList[active]}
            </div>
        </div>
    );
}

export function Tab({ children }: TabProps) {
    return <div>{children}</div>;
}
