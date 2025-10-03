import React from 'react';

export const KpiCard: React.FC<{ title: string; value: string; tooltip: string; }> = ({ title, value, tooltip }) => (
    <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg shadow group relative">
        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">{title}</h3>
        <p className="mt-1 text-3xl font-semibold text-gray-900 dark:text-white">{value}</p>
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max max-w-xs hidden group-hover:block bg-gray-900 text-white text-xs rounded py-1 px-2 z-10">
            {tooltip}
        </div>
    </div>
);
