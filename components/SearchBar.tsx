import React, { useState } from 'react';
import { Search, ChevronDown, ArrowRight } from 'lucide-react';
import { SearchEngine } from '../types';

const SearchBar: React.FC = () => {
  const [engine, setEngine] = useState<SearchEngine>('google');
  const [query, setQuery] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const engines = {
    google: { name: '谷歌搜索', url: 'https://www.google.com/search?q=' },
    bing: { name: '必应搜索', url: 'https://www.bing.com/search?q=' },
    baidu: { name: '百度搜索', url: 'https://www.baidu.com/s?wd=' },
  };

  const handleSearch = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!query.trim()) return;
    window.location.href = `${engines[engine].url}${encodeURIComponent(query)}`;
  };

  return (
    <div className="w-full max-w-3xl mx-auto my-8 relative z-20">
      <form onSubmit={handleSearch} className="relative flex items-center w-full bg-white dark:bg-slate-800 rounded-2xl shadow-sm dark:shadow-none border border-slate-100 dark:border-slate-700 hover:shadow-md transition-all">
        {/* Engine Selector */}
        <div className="relative border-r border-slate-100 dark:border-slate-700">
          <button
            type="button"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-2 px-4 py-4 text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-slate-800 dark:hover:text-white outline-none transition-colors"
          >
            {engines[engine].name}
            <ChevronDown className="w-4 h-4 opacity-50" />
          </button>
          
          {isDropdownOpen && (
            <div className="absolute top-full left-0 mt-2 w-32 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-100 dark:border-slate-700 overflow-hidden py-1">
              {(Object.keys(engines) as SearchEngine[]).map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => {
                    setEngine(key);
                    setIsDropdownOpen(false);
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  {engines[key].name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Input */}
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="输入关键词搜索..."
          className="flex-1 px-4 py-4 bg-transparent outline-none text-slate-700 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500"
        />

        {/* Action Button */}
        <button type="submit" className="p-4 text-slate-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
          <ArrowRight className="w-5 h-5" />
        </button>
      </form>
    </div>
  );
};

export default SearchBar;