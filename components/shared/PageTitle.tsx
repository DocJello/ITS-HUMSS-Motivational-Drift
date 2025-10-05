import React from 'react';

interface PageTitleProps {
    title: string;
    subtitle?: string;
}

export const PageTitle: React.FC<PageTitleProps> = ({ title, subtitle }) => {
    return (
        <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{title}</h1>
            {subtitle && <p className="mt-1 text-md text-gray-600 dark:text-gray-400">{subtitle}</p>}
        </div>
    );
};
