import { ReactNode, useState } from 'react';

export function Tabs({ children }: { children: ReactNode }) {
    const tabList = Array.isArray(children) ? children : [children];
    const [activeTab, setActiveTab] = useState(0);

    return (
        <div className="mb-8 w-full py-4">
            {/* 탭 버튼 영역 */}
            <div className="flex">
                {tabList.map((child: any, idx) => {
                    const isActive = idx === activeTab;

                    const borderClass = isActive
                        ? ''
                        : '';

                    return (
                        <div
                            key={idx}
                            onClick={() => setActiveTab(idx)}
                            tabIndex={0}
                            className={`px-4 py-2 text-mi cursor-pointer transition-all rounded-t border 
                                ${borderClass}
                                ${
                                    isActive
                                        ? 'bg-blue-10 border-b-2 border-b-blue-500 text-blue-600 font-semibold'
                                        : 'border-b border-gray-200 text-gray-500 hover:bg-gray-100 hover:text-black'
                                }
                            `}
                        >
                            {child.props.label ?? `Tab ${idx + 1}`}
                        </div>
                    );
                })}
            </div>

            {/* 콘텐츠 영역 */}
            <div
                className="space-x-2 px-6 border-t shadow-sm border border-gray-200 bg-white rounded-t">
                {tabList[activeTab]}
            </div>
        </div>
    );
}

export function Tab({children}: { children: ReactNode }) {
    return <div>{children}</div>;
}

