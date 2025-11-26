
import React, { useState, useEffect, useRef } from 'react';
import { 
  Settings, 
  ChevronRight, 
  User, 
  Plus, 
  Edit2, 
  Compass,
  Moon,
  Sun,
  Trash2,
  Menu,
  X,
  Download,
  Upload,
  Loader2,
  ArrowUp,
  ArrowDown,
  Lock
} from 'lucide-react';
import { INITIAL_DATA, ICON_MAP } from './constants';
import { AppData, LinkItem, Category } from './types';
import DateWidget from './components/DateWidget';
import WeatherWidget from './components/WeatherWidget';
import ClockWidget from './components/ClockWidget';
import ExtraWidget from './components/ExtraWidget';
import SearchBar from './components/SearchBar';
import AdminModal from './components/AdminModal';
import EditModal from './components/EditModal';
import CategoryModal from './components/CategoryModal';
import ChangePasswordModal from './components/ChangePasswordModal';

// --- Helper for LocalStorage (Only for Theme now) ---
const useStickyState = <T,>(defaultValue: T, key: string): [T, React.Dispatch<React.SetStateAction<T>>] => {
  const [value, setValue] = useState<T>(() => {
    const stickyValue = window.localStorage.getItem(key);
    return stickyValue !== null ? JSON.parse(stickyValue) : defaultValue;
  });
  useEffect(() => {
    window.localStorage.setItem(key, JSON.stringify(value));
  }, [key, value]);
  return [value, setValue];
};

// --- Weather Data Type ---
export interface WeatherData {
  temp: number;
  weatherCode: number;
  minTemp: number;
  maxTemp: number;
  windSpeed: number;
  humidity: number;
  feelsLike: number;
  city: string;
  daily: any;
  aqi: number;
}

const App: React.FC = () => {
  // Data is now simple state, initialized empty/loading
  const [data, setData] = useState<AppData>(INITIAL_DATA);
  const [dataLoading, setDataLoading] = useState(true);
  
  const [darkMode, setDarkMode] = useStickyState(false, 'flatnav-theme');
  const [activeCategory, setActiveCategory] = useState<string>('');
  
  const [isAdmin, setIsAdmin] = useState(false);
  // Store the password currently used for the session (defaults to "666333" if not logged in, but updated on login)
  const [sessionPassword, setSessionPassword] = useState("666333"); 
  
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [showChangePwdModal, setShowChangePwdModal] = useState(false);
  
  // Responsive State
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // Weather State
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(true);
  
  // Edit Link State
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<LinkItem | null>(null);
  const [editingCategoryId, setEditingCategoryId] = useState<string>('');

  // Category State
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  
  // File Input Ref
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- Theme Effect ---
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // --- 1. Fetch Data from Server ---
  const fetchData = async () => {
    setDataLoading(true);
    try {
        const res = await fetch('/api/data');
        if (res.ok) {
            const serverData = await res.json();
            if (serverData && Array.isArray(serverData.categories)) {
                setData(serverData);
                if (serverData.categories.length > 0 && !activeCategory) {
                    setActiveCategory(serverData.categories[0].id);
                }
            } else {
                console.warn("Server data invalid, using initial data");
                setData(INITIAL_DATA);
            }
        } else {
            console.error("Failed to fetch data from server, status:", res.status);
            setData(INITIAL_DATA);
        }
    } catch (error) {
        console.error("Network error fetching data", error);
        setData(INITIAL_DATA);
    } finally {
        setDataLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // --- 2. Save Data to Server ---
  const saveDataToServer = async (newData: AppData) => {
      // Optimistic update
      setData(newData); 
      
      try {
          const res = await fetch('/api/data', {
              method: 'POST',
              headers: {
                  'Content-Type': 'application/json',
                  'x-admin-password': sessionPassword // Verify with current session password
              },
              body: JSON.stringify(newData)
          });
          if (!res.ok) {
              const err = await res.json();
              alert(`保存失败：${err.error || '未知错误'}`);
              fetchData(); // Revert
          }
      } catch (error) {
          alert('保存失败：网络错误');
          fetchData(); // Revert
      }
  };

  // --- Login Logic ---
  const handleLogin = (pwd: string) => {
      setIsAdmin(true);
      setSessionPassword(pwd);
  };

  // --- Weather Fetching ---
  useEffect(() => {
    const fetchWeatherByIP = async () => {
       try {
          const ipRes = await fetch('/api/ip');
          const ipData = await ipRes.json();
          
          if (ipData.status !== 'fail') {
             const { lat, lon, city } = ipData;
             await fetchWeather(lat, lon, city || '本地');
          } else {
             await fetchWeather(39.9042, 116.4074, '北京');
          }
       } catch (e) {
          console.error("IP Geolocation failed", e);
          await fetchWeather(39.9042, 116.4074, '北京');
       }
    };

    const fetchWeather = async (lat: number, lon: number, cityName: string) => {
        try {
            const weatherRes = await fetch(
                `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto`
            );
            const weatherData = await weatherRes.json();

            let aqiValue = 0;
            try {
                const aqiRes = await fetch(
                    `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&current=us_aqi`
                );
                const aqiData = await aqiRes.json();
                if(aqiData.current && aqiData.current.us_aqi) {
                    aqiValue = aqiData.current.us_aqi;
                }
            } catch (e) {
                console.warn("AQI fetch failed", e);
            }
            
            if (weatherData.current && weatherData.daily) {
                setWeather({
                    temp: Math.round(weatherData.current.temperature_2m),
                    weatherCode: weatherData.current.weather_code,
                    minTemp: Math.round(weatherData.daily.temperature_2m_min[0]),
                    maxTemp: Math.round(weatherData.daily.temperature_2m_max[0]),
                    windSpeed: weatherData.current.wind_speed_10m,
                    humidity: weatherData.current.relative_humidity_2m,
                    feelsLike: Math.round(weatherData.current.apparent_temperature),
                    city: cityName, 
                    daily: weatherData.daily,
                    aqi: aqiValue
                });
            }
        } catch(e) {
            console.error("Weather API failed", e);
        } finally {
            setWeatherLoading(false);
        }
    };

    if (!navigator.geolocation || !window.isSecureContext) {
      fetchWeatherByIP();
      return;
    }

    navigator.geolocation.getCurrentPosition((position) => {
        const { latitude, longitude } = position.coords;
        fetchWeather(latitude, longitude, '本地');
    }, (err) => {
      console.warn("Geolocation permission denied", err);
      fetchWeatherByIP();
    });
  }, []);

  const scrollToCategory = (id: string) => {
    setActiveCategory(id);
    setSidebarOpen(false); // Close sidebar on mobile
    const element = document.getElementById(id);
    if (element) {
      const main = document.querySelector('main');
      if(main) {
        const mainTop = main.getBoundingClientRect().top;
        const elTop = element.getBoundingClientRect().top;
        main.scrollTo({
            top: main.scrollTop + elTop - mainTop - 32,
            behavior: 'smooth'
        });
      }
    }
  };

  // --- CRUD Operations for Links ---
  const handleSaveLink = (item: LinkItem) => {
    const newCategories = data.categories.map(cat => {
      if (cat.id === editingCategoryId) {
        const existingIndex = cat.items.findIndex(i => i.id === item.id);
        if (existingIndex > -1) {
          const newItems = [...cat.items];
          newItems[existingIndex] = item;
          return { ...cat, items: newItems };
        } else {
          return { ...cat, items: [...cat.items, item] };
        }
      }
      return cat;
    });
    saveDataToServer({ ...data, categories: newCategories });
  };

  const handleDeleteLink = (itemId: string) => {
    const newCategories = data.categories.map(cat => {
      if (cat.id === editingCategoryId) {
        return { ...cat, items: cat.items.filter(i => i.id !== itemId) };
      }
      return cat;
    });
    saveDataToServer({ ...data, categories: newCategories });
  };

  // --- CRUD Operations for Categories ---
  const handleSaveCategory = (title: string, iconName: string) => {
    let newCategories;
    
    if (editingCategory) {
        // Update existing
        newCategories = data.categories.map(c => 
            c.id === editingCategory.id ? { ...c, title, iconName } : c
        );
    } else {
        // Create new
        const newCategory: Category = {
            id: `c${Date.now()}`,
            title,
            iconName,
            items: []
        };
        newCategories = [...data.categories, newCategory];
        setTimeout(() => scrollToCategory(newCategory.id), 100);
    }
    
    saveDataToServer({ ...data, categories: newCategories });
  };

  const handleDeleteCategory = (id: string) => {
    if (window.confirm('确定要删除此分类及其所有内容吗？')) {
      const newCategories = data.categories.filter(c => c.id !== id);
      saveDataToServer({ ...data, categories: newCategories });
      if (activeCategory === id && newCategories.length > 0) {
        setActiveCategory(newCategories[0].id);
      }
    }
  };

  // --- Category Reordering ---
  const moveCategory = (index: number, direction: 'up' | 'down') => {
      if (direction === 'up' && index === 0) return;
      if (direction === 'down' && index === data.categories.length - 1) return;

      const newCategories = [...data.categories];
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      
      [newCategories[index], newCategories[targetIndex]] = [newCategories[targetIndex], newCategories[index]];
      
      saveDataToServer({ ...data, categories: newCategories });
  };

  // --- Password Change ---
  const handleChangePassword = (newPassword: string) => {
      saveDataToServer({ ...data, adminPassword: newPassword });
      setSessionPassword(newPassword);
      alert('密码修改成功！');
  };

  // --- Import / Export Logic ---
  const handleExportData = () => {
    const dataStr = JSON.stringify(data, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `flatnav-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImportData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = e.target?.result as string;
        const parsedData = JSON.parse(json);
        if (parsedData && Array.isArray(parsedData.categories)) {
          if (window.confirm('导入配置将覆盖服务器上的所有数据，确定继续吗？')) {
            saveDataToServer(parsedData);
            alert('导入成功，已同步至服务器！');
          }
        } else {
          alert('无效的配置文件格式');
        }
      } catch (err) {
        alert('解析文件失败');
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // --- Modal Openers ---
  const openAddLinkModal = (catId: string) => {
    setEditingItem(null);
    setEditingCategoryId(catId);
    setEditModalOpen(true);
  };

  const openEditLinkModal = (item: LinkItem, catId: string) => {
    setEditingItem(item);
    setEditingCategoryId(catId);
    setEditModalOpen(true);
  };

  const openCategoryModal = (category?: Category) => {
      setEditingCategory(category || null);
      setCategoryModalOpen(true);
  }

  if (dataLoading) {
      return (
          <div className={`flex h-screen items-center justify-center font-sans ${darkMode ? 'dark bg-slate-900' : 'bg-slate-50'}`}>
              <div className="flex flex-col items-center gap-3">
                  <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                  <p className="text-slate-500 dark:text-slate-400 text-sm">正在连接服务器...</p>
              </div>
          </div>
      )
  }

  return (
    <div className={`flex h-screen overflow-hidden font-sans transition-colors duration-300 ${darkMode ? 'dark' : ''}`}>
      
      <input type="file" ref={fileInputRef} onChange={handleImportData} className="hidden" accept=".json" />

      {/* Sidebar Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm transition-opacity" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`
          fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white dark:bg-slate-900 border-r border-slate-100 dark:border-slate-800 flex flex-col justify-between shrink-0 transition-all duration-300 transform
          ${sidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full lg:translate-x-0 lg:shadow-none'}
      `}>
        <div className="flex flex-col h-full overflow-hidden">
          <div className="p-6 mb-2 shrink-0 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-slate-900 dark:bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-md">
                <Compass className="w-6 h-6" />
              </div>
              <div>
                <h1 className="font-bold text-lg leading-tight text-slate-900 dark:text-white">Dark's Nav</h1>
                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 tracking-widest uppercase">Dashboard</p>
              </div>
            </div>
            <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300">
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="px-4 flex-1 overflow-y-auto no-scrollbar">
            <div className="flex items-center justify-between mb-4 px-2">
               <span className="text-xs font-bold text-slate-400 dark:text-slate-500">分类导航</span>
               <div className="h-[1px] bg-slate-100 dark:bg-slate-800 flex-1 ml-4"></div>
            </div>
            
            <nav className="space-y-2 pb-4">
              {data.categories?.map((cat, index) => {
                const Icon = ICON_MAP[cat.iconName] || ICON_MAP['LayoutGrid'];
                const isActive = activeCategory === cat.id;
                
                return (
                  <div key={cat.id} className="group relative flex flex-col">
                    <div className="flex items-center w-full">
                        <button
                        onClick={() => scrollToCategory(cat.id)}
                        className={`flex-1 flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                            isActive 
                            ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 shadow-sm shadow-blue-100 dark:shadow-none' 
                            : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-slate-200'
                        }`}
                        >
                        <div className="flex items-center gap-3">
                            <Icon className={`w-5 h-5 ${isActive ? 'text-blue-500 dark:text-blue-400' : 'text-slate-400 dark:text-slate-500'}`} />
                            <span className="truncate max-w-[110px] text-left">{cat.title}</span>
                        </div>
                        {isActive && <ChevronRight className="w-4 h-4 text-blue-400 dark:text-blue-500" />}
                        </button>
                    </div>
                    
                    {/* Admin Controls for Category */}
                    {isAdmin && (
                        <div className="absolute right-1 top-1/2 -translate-y-1/2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-white dark:bg-slate-900 shadow-sm rounded-lg p-1 border border-slate-100 dark:border-slate-700 z-10">
                            <button
                                onClick={(e) => { e.stopPropagation(); moveCategory(index, 'up'); }}
                                disabled={index === 0}
                                className={`p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 ${index === 0 ? 'text-slate-300' : 'text-slate-500'}`}
                                title="上移"
                            >
                                <ArrowUp className="w-3 h-3" />
                            </button>
                            <button
                                onClick={(e) => { e.stopPropagation(); moveCategory(index, 'down'); }}
                                disabled={index === data.categories.length - 1}
                                className={`p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 ${index === data.categories.length - 1 ? 'text-slate-300' : 'text-slate-500'}`}
                                title="下移"
                            >
                                <ArrowDown className="w-3 h-3" />
                            </button>
                            <button
                                onClick={(e) => { e.stopPropagation(); openCategoryModal(cat); }}
                                className="p-1 rounded hover:bg-blue-50 dark:hover:bg-blue-900/30 text-blue-500"
                                title="编辑"
                            >
                                <Edit2 className="w-3 h-3" />
                            </button>
                            <button
                                onClick={(e) => { e.stopPropagation(); handleDeleteCategory(cat.id); }}
                                className="p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/30 text-red-500"
                                title="删除"
                            >
                                <Trash2 className="w-3 h-3" />
                            </button>
                        </div>
                    )}
                  </div>
                );
              })}
              
              {/* Admin Actions */}
              {isAdmin && (
                  <div className="space-y-2 mt-4 animate-in fade-in slide-in-from-top-2">
                    <button
                      onClick={() => openCategoryModal()}
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-medium text-slate-400 dark:text-slate-500 border border-dashed border-slate-200 dark:border-slate-700 hover:border-blue-300 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all"
                    >
                      <Plus className="w-4 h-4" />
                      <span>添加分类</span>
                    </button>
                    
                    <div className="grid grid-cols-2 gap-2">
                        <button onClick={handleExportData} className="flex items-center justify-center gap-1.5 px-2 py-2.5 rounded-xl text-xs font-medium bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors" title="导出配置"><Download className="w-3.5 h-3.5" /><span>导出</span></button>
                        <button onClick={() => fileInputRef.current?.click()} className="flex items-center justify-center gap-1.5 px-2 py-2.5 rounded-xl text-xs font-medium bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-green-600 hover:bg-green-50 transition-colors" title="导入恢复"><Upload className="w-3.5 h-3.5" /><span>导入</span></button>
                    </div>
                    
                    <button 
                        onClick={() => setShowChangePwdModal(true)}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
                    >
                        <Lock className="w-3 h-3" />
                        <span>修改后台密码</span>
                    </button>
                  </div>
              )}
            </nav>
          </div>
        </div>

        <div className="p-4 border-t border-slate-100 dark:border-slate-800 shrink-0 bg-white dark:bg-slate-900">
           <div className="flex items-center p-1 mb-4 bg-slate-100 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-2xl">
              <button onClick={() => setDarkMode(false)} className={`flex-1 flex items-center justify-center py-2.5 rounded-xl transition-all duration-300 ${!darkMode ? 'bg-white shadow-sm text-violet-600' : 'text-slate-400 dark:text-slate-600 hover:text-slate-600'}`}><Sun className="w-5 h-5" /></button>
              <button onClick={() => setDarkMode(true)} className={`flex-1 flex items-center justify-center py-2.5 rounded-xl transition-all duration-300 ${darkMode ? 'bg-slate-800 shadow-sm text-violet-400' : 'text-slate-400 dark:text-slate-600 hover:text-slate-600'}`}><Moon className="w-5 h-5" /></button>
           </div>

           <button
            onClick={() => isAdmin ? setIsAdmin(false) : setShowAdminModal(true)}
            className="w-full py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 active:scale-95 transition-all text-white font-medium shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2 group"
           >
            <User className="w-5 h-5 group-hover:scale-110 transition-transform" />
            <span>{isAdmin ? '退出管理' : '管理员登录'}</span>
           </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col h-screen min-w-0 bg-[#f8fafc] dark:bg-[#0b1120]">
        <header className="lg:hidden h-16 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between px-4 shrink-0 z-30 transition-colors duration-300">
            <button onClick={() => setSidebarOpen(true)} className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 transition-colors"><Menu className="w-6 h-6" /></button>
            <h1 className="font-bold text-lg leading-tight text-slate-900 dark:text-white">Dark's Nav</h1>
            <div className="w-10"></div>
        </header>

        <main className="flex-1 overflow-y-auto no-scrollbar p-4 lg:p-8 transition-colors duration-300">
          <div className="grid grid-cols-2 lg:grid-cols-12 gap-3 lg:gap-6 mb-8 lg:mb-12 auto-rows-fr">
              <div className="col-span-1 lg:col-span-3 min-h-[120px] lg:min-h-[140px] h-auto"><DateWidget /></div>
              <div className="col-span-1 lg:col-span-4 min-h-[120px] lg:min-h-[140px] h-auto"><WeatherWidget data={weather} loading={weatherLoading} /></div>
               <div className="col-span-1 lg:col-span-2 min-h-[120px] lg:min-h-[140px] h-auto"><ClockWidget /></div>
              <div className="col-span-1 lg:col-span-3 min-h-[120px] lg:min-h-[140px] h-auto"><ExtraWidget data={weather} loading={weatherLoading} /></div>
          </div>

          <div className="mb-10"><SearchBar /></div>

          <div className="space-y-10 pb-20 max-w-[1600px] mx-auto">
            {data.categories?.map((category) => {
              const Icon = ICON_MAP[category.iconName] || ICON_MAP['LayoutGrid'];
              return (
                <section key={category.id} id={category.id} className="scroll-mt-20 lg:scroll-mt-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="bg-white dark:bg-slate-800 rounded-t-2xl p-6 border-b border-slate-50 dark:border-slate-700 flex items-center gap-3 transition-colors">
                     <div className={`p-2 rounded-lg bg-blue-500 text-white shadow-md shadow-blue-500/20`}><Icon className="w-5 h-5" /></div>
                     <h2 className="text-lg font-bold text-slate-800 dark:text-white">{category.title}</h2>
                     {isAdmin && (
                          <button onClick={() => openAddLinkModal(category.id)} className="ml-auto p-2 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-100 transition-colors" title="添加链接"><Plus className="w-5 h-5" /></button>
                     )}
                  </div>

                  <div className="bg-[#fcfdff] dark:bg-[#162032] rounded-b-2xl p-6 border border-t-0 border-slate-100 dark:border-slate-800 shadow-sm transition-colors">
                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {category.items.map((link) => (
                          <div key={link.id} className="group relative">
                              <a href={link.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-50 dark:border-slate-700 hover:shadow-md hover:border-blue-100 dark:hover:border-blue-900 hover:-translate-y-1 transition-all duration-300 h-full">
                                  <div className="w-10 h-10 rounded-full bg-slate-50 dark:bg-slate-700 flex-shrink-0 flex items-center justify-center overflow-hidden border border-slate-100 dark:border-slate-600">
                                      {link.icon ? (
                                          <img src={link.icon} alt={link.title} className="w-6 h-6 object-contain" onError={(e) => {(e.target as HTMLImageElement).style.display='none';}} />
                                      ) : (<div className="text-slate-400 dark:text-slate-500 text-xs font-bold">{link.title.substring(0,1)}</div>)}
                                  </div>
                                  <div className="overflow-hidden">
                                      <h3 className="font-semibold text-slate-700 dark:text-slate-200 truncate text-sm">{link.title}</h3>
                                      {link.description && <p className="text-xs text-slate-400 dark:text-slate-500 truncate">{link.description}</p>}
                                  </div>
                              </a>
                              {isAdmin && (
                                  <button onClick={(e) => { e.preventDefault(); openEditLinkModal(link, category.id); }} className="absolute top-2 right-2 p-1.5 rounded-lg bg-white/90 dark:bg-slate-700/90 shadow-sm border border-slate-100 dark:border-slate-600 text-slate-400 dark:text-slate-400 hover:text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity md:opacity-0 opacity-100"><Edit2 className="w-3 h-3" /></button>
                              )}
                          </div>
                        ))}
                        {category.items.length === 0 && (<div className="col-span-full py-8 text-center text-slate-400 dark:text-slate-500 text-sm border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-800/50">此分类暂无链接，点击右上角 + 号添加</div>)}
                     </div>
                  </div>
                </section>
              );
            })}
          </div>
        </main>
      </div>

      <AdminModal 
        isOpen={showAdminModal} 
        onClose={() => setShowAdminModal(false)}
        onLogin={handleLogin}
        currentRealPassword={data.adminPassword} 
      />

      <EditModal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        initialData={editingItem}
        categoryId={editingCategoryId}
        onSave={handleSaveLink}
        onDelete={handleDeleteLink}
      />

      <CategoryModal 
        isOpen={categoryModalOpen}
        onClose={() => setCategoryModalOpen(false)}
        onSave={handleSaveCategory}
        initialData={editingCategory}
      />

      <ChangePasswordModal
        isOpen={showChangePwdModal}
        onClose={() => setShowChangePwdModal(false)}
        onSave={handleChangePassword}
      />
    </div>
  );
};

export default App;
