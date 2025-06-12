import { ReactNode, useState } from 'react';

export function Tabs({ children }: { children: ReactNode }) {
    const tabList = Array.isArray(children) ? children : [children];
    const [activeTab, setActiveTab] = useState(0);

    return (
        <div className="mb-8">
            <div className="flex border-b mb-4">
                {tabList.map((child: any, idx) => (
                    <button
                        key={idx}
                        className={`px-4 py-2 text-sm ${
                            idx === activeTab ? 'border-b-2 border-blue-500 font-semibold' : 'text-gray-500'
                        }`}
                        onClick={() => setActiveTab(idx)}
                    >
                        {child.props.label}
                    </button>
                ))}
            </div>
            <div className="mt-4">{tabList[activeTab]}</div>
        </div>
    );
}

export function Tab({ children }: { children: ReactNode }) {
    return <div>{children}</div>;
}
