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
            <div role="tablist" aria-label="Tabs" className="relative flex items-end w-full">
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
                                'relative -mb-px px-4 py-2 text-sm md:text-base select-none outline-none transition border',
                                'first:rounded-tl-lg last:rounded-tr-lg',
                                i > 0 ? '-ml-px' : '',
                                isActive
                                    ? [
                                        // 기존 스타일 유지
                                        'bg-white text-blue-600 border-gray-300 border-b-0 font-semibold z-20 relative scale-105',
                                        // 활성 탭이 "첫 번째"일 때 왼쪽 경계선을 재도색
                                        "first:before:content-[''] first:before:absolute first:before:top-0 first:before:-left-px first:before:h-full first:before:w-px first:before:bg-gray-300 first:dark:before:bg-gray-700",
                                        // 스케일 기준점을 왼쪽-아래로 둬서 왼쪽 선이 밀리지 않게 함
                                        'origin-bottom-left',
                                    ].join(' ')
                                    : 'bg-white text-gray-500 hover:text-gray-700 hover:bg-gray-50 border-gray-300 font-normal'

                            ].join(' ')}
                        >
                            {tab.props.label}
                        </button>
                    );
                })}
                {/* 오른쪽 빈 공간 라인 맞추기 */}
                <div className="flex-1 h-px bg-gray-300 dark:bg-gray-700" />
            </div>

            {/* Panel */}
            <div
                role="tabpanel"
                id={`${uid}-panel-${active}`}
                aria-labelledby={`${uid}-tab-${active}`}
                className="rounded-b-lg border border-gray-300 border-t-0 bg-white p-5 md:p-7 shadow-sm
                   dark:border-gray-700 dark:bg-gray-900"
            >
                {tabList[active]}
            </div>
        </div>
    );
}

export function Tab({ children }: TabProps) {
    return <div>{children}</div>;
}
