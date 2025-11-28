
import React, { useState } from 'react';
import { Search, ChevronDown, ArrowRight, Monitor } from 'lucide-react';
import { SearchEngine } from '../types';

interface SearchBarProps {
  engine: string; // 'google' | 'bing' | 'baidu' | 'local'
  onEngineChange: (engine: any) => void;
  query: string;
  onQueryChange: (query: string) => void;
  onSearch: () => void;
}

const SearchBar: React.FC<SearchBarProps> = ({ engine, onEngineChange, query, onQueryChange, onSearch }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const engines = {
    local: { name: '本地搜索', icon: Monitor },
    google: { name: '谷歌搜索', icon: Search },
    bing: { name: '必应搜索', icon: Search },
    baidu: { name: '百度搜索', icon: Search },
  };

  const currentEngine = engines[engine as keyof typeof engines] || engines.google;
  const CurrentIcon = currentEngine.icon;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch();
  };

  return (
    <div className="w-full max-w-3xl mx-auto my-8 relative z-20">
      <form onSubmit={handleSubmit} className="relative flex items-center w-full bg-white dark:bg-slate-800 rounded-2xl shadow-sm dark:shadow-none border border-slate-100 dark:border-slate-700 hover:shadow-md transition-all">
        {/* Engine Selector */}
        <div className="relative border-r border-slate-100 dark:border-slate-700">
          <button
            type="button"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-2 px-4 py-4 text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-slate-800 dark:hover:text-white outline-none transition-colors min-w-[110px]"
          >
            <CurrentIcon className="w-4 h-4 text-blue-500" />
            {currentEngine.name}
            <ChevronDown className="w-4 h-4 opacity-50 ml-auto" />
          </button>
          
          {isDropdownOpen && (
            <div className="absolute top-full left-0 mt-2 w-36 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-100 dark:border-slate-700 overflow-hidden py-1 z-30">
              {(Object.keys(engines) as Array<keyof typeof engines>).map((key) => {
                const ItemIcon = engines[key].icon;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => {
                      onEngineChange(key);
                      setIsDropdownOpen(false);
                    }}
                    className={`w-full text-left px-4 py-3 text-sm flex items-center gap-2 transition-colors ${
                        engine === key 
                        ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' 
                        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                    }`}
                  >
                    <ItemIcon className="w-4 h-4" />
                    {engines[key].name}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Input */}
        <input
          type="text"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder={engine === 'local' ? "搜索本地导航..." : "输入关键词搜索..."}
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
