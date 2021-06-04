import React, { useState } from 'react';
import './style.css';

interface TabConfig {
    id: string;
    label?: React.ReactNode;
    content: React.ReactNode;
}

interface TabSetProps {
    tabs: TabConfig[];
    initialTabId?: string;
    className?: string;
}

export const TabSet = ({ tabs, initialTabId, className }: TabSetProps) => {
    const [currentTabId, setCurrentTabId] = useState<string>(() => {
        if (initialTabId) {
            return initialTabId;
        } else if (tabs.length > 0) {
            return tabs[0].id;
        } else {
            return '';
        }
    });

    const activeTab = tabs.find((tab) => tab.id === currentTabId);

    return (
        <fieldset className={`tabs-container fieldset ${className}`}>
            <legend className='tab-selectors'>
                {tabs.map((tab) => (
                    <div key={tab.id}
                        className={`tab-button legend ${tab.id === currentTabId ? 'selected' : ''}`}
                        onClick={() => setCurrentTabId(tab.id)}
                    >
                        {tab.label ?? tab.id}
                    </div>
                ))}
            </legend>
            <div className='tab-content'>
                {activeTab && activeTab.content}
            </div>
        </fieldset>
    )
}