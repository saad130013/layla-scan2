
import React, { useState, useEffect, useCallback } from 'react';
import { 
  Upload, 
  Map as MapIcon, 
  Users, 
  Calendar, 
  ClipboardCheck, 
  BarChart3, 
  Menu, 
  X,
  Languages,
  LayoutDashboard
} from 'lucide-react';
import { Worker, Inspector, LocationData, VisitRecord, ViewState, AreaData, Language, TRANSLATIONS, INSPECTOR_COLORS, ScheduleMethod } from './types';
import DashboardScreen from './components/DashboardScreen';
import UploadScreen from './components/UploadScreen';
import LocationMapScreen from './components/LocationMapScreen';
import AssignmentScreen from './components/AssignmentScreen';
import SchedulingScreen from './components/SchedulingScreen';
import InspectionDayView from './components/InspectionDayView';
import ReportingScreen from './components/ReportingScreen';

const App: React.FC = () => {
  const [language, setLanguage] = useState<Language>(() => {
    return (localStorage.getItem('opscheck_lang') as Language) || 'ar'; // Default to Arabic based on request
  });
  const [activeView, setActiveView] = useState<ViewState>('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [scheduleMethod, setScheduleMethod] = useState<ScheduleMethod>(() => {
    return (localStorage.getItem('opscheck_method') as ScheduleMethod) || 'Manual';
  });

  // Core Data State
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [inspectors, setInspectors] = useState<Inspector[]>([]);
  const [areas, setAreas] = useState<AreaData[]>([]);
  const [visits, setVisits] = useState<VisitRecord[]>([]);

  useEffect(() => {
    localStorage.setItem('opscheck_lang', language);
  }, [language]);

  useEffect(() => {
    localStorage.setItem('opscheck_method', scheduleMethod);
  }, [scheduleMethod]);

  useEffect(() => {
    const savedWorkers = localStorage.getItem('opscheck_workers');
    const savedInspectors = localStorage.getItem('opscheck_inspectors');
    const savedVisits = localStorage.getItem('opscheck_visits');
    
    if (savedWorkers) setWorkers(JSON.parse(savedWorkers));
    if (savedInspectors) setInspectors(JSON.parse(savedInspectors));
    if (savedVisits) setVisits(JSON.parse(savedVisits));
  }, []);

  useEffect(() => {
    localStorage.setItem('opscheck_workers', JSON.stringify(workers));
    localStorage.setItem('opscheck_inspectors', JSON.stringify(inspectors));
    localStorage.setItem('opscheck_visits', JSON.stringify(visits));
  }, [workers, inspectors, visits]);

  useEffect(() => {
    const areaMap: Record<string, Record<string, LocationData>> = {};
    
    workers.forEach(w => {
      // Aggressive trimming and normalization
      const areaName = (w.Area || 'Unknown Area').trim();
      const locRaw = w.LOCATION_RAW || w.Location || 'Unknown Location';
      
      const locNames = String(locRaw)
        .split('+')
        .map(l => l.trim())
        .filter(Boolean);

      locNames.forEach(locName => {
        if (!areaMap[areaName]) areaMap[areaName] = {};
        
        // Use normalized names for keys to prevent duplicate entries due to case/whitespace
        const normalizedLoc = locName;
        const locId = `${areaName}-${normalizedLoc}`.replace(/\s+/g, '_').toLowerCase();
        
        if (!areaMap[areaName][normalizedLoc]) {
          areaMap[areaName][normalizedLoc] = {
            id: locId,
            name: normalizedLoc,
            area: areaName,
            workerIds: [],
          };
        }
        
        if (!areaMap[areaName][normalizedLoc].workerIds.includes(w.Worker_ID)) {
          areaMap[areaName][normalizedLoc].workerIds.push(w.Worker_ID);
        }
      });
    });

    const processedAreas: AreaData[] = Object.entries(areaMap).map(([name, locs]) => ({
      name,
      locations: Object.values(locs)
    }));
    
    setAreas(processedAreas);
  }, [workers]);

  const navItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: TRANSLATIONS[language].nav.dashboard },
    { id: 'upload', icon: Upload, label: TRANSLATIONS[language].nav.upload },
    { id: 'map', icon: MapIcon, label: TRANSLATIONS[language].nav.map },
    { id: 'assignment', icon: Users, label: TRANSLATIONS[language].nav.assignment },
    { id: 'scheduling', icon: Calendar, label: TRANSLATIONS[language].nav.scheduling },
    { id: 'inspection', icon: ClipboardCheck, label: TRANSLATIONS[language].nav.inspection },
    { id: 'reporting', icon: BarChart3, label: TRANSLATIONS[language].nav.reporting },
  ];

  const handleDataProcessed = (newWorkers: Worker[], newInspectors: Inspector[]) => {
    setWorkers(newWorkers);
    if (newInspectors.length > 0) {
      const colorizedNew = newInspectors.map((ins, idx) => ({
        ...ins,
        Color: ins.Color || INSPECTOR_COLORS[idx % INSPECTOR_COLORS.length]
      }));
      const existingManual = inspectors.filter(i => !colorizedNew.some(ni => ni.Inspector_ID === i.Inspector_ID));
      setInspectors([...colorizedNew, ...existingManual]);
    }
    setActiveView('dashboard');
  };

  const handleRecordVisit = useCallback((record: VisitRecord) => {
    setVisits(prev => [...prev, record]);
    if (record.visited) {
      setInspectors(prev => prev.map(ins => {
        if (ins.Inspector_ID === record.inspectorId) {
          const newQueue = ins.LocationQueue.filter(id => id !== record.locationId);
          newQueue.push(record.locationId);
          return { ...ins, LocationQueue: newQueue };
        }
        return ins;
      }));
    }
  }, []);

  const isRtl = language === 'ar';

  return (
    <div className={`min-h-screen flex flex-col md:flex-row bg-slate-50 font-sans`} dir={isRtl ? 'rtl' : 'ltr'}>
      <header className="md:hidden bg-white border-b px-4 py-3 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <div className="flex flex-col">
            <span className="font-black text-xs text-indigo-600 leading-tight">SERVICES INSPECTOR</span>
            <span className="font-bold text-[8px] text-slate-400 leading-tight">ENVIRONMENTAL SERVICES</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
           <button onClick={() => setLanguage(l => l === 'en' ? 'ar' : 'en')} className="p-2 text-slate-500 hover:text-indigo-600">
            <Languages className="w-5 h-5" />
          </button>
          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
            {isMobileMenuOpen ? <X /> : <Menu />}
          </button>
        </div>
      </header>

      <nav className={`${isMobileMenuOpen ? 'flex' : 'hidden'} md:flex flex-col w-full md:w-64 bg-slate-900 text-slate-300 md:h-screen sticky top-0 z-40 shadow-2xl`}>
        <div className="hidden md:flex flex-col gap-1 px-6 py-8 border-b border-slate-800/50 mb-4">
          <div className="font-black text-white text-lg leading-tight tracking-tight">
            SERVICES <span className="text-indigo-400">INSPECTOR</span>
          </div>
          <div className="font-bold text-[9px] text-slate-400 tracking-widest uppercase opacity-80">
            ENVIRONMENTAL SERVICES
          </div>
          <div className="font-medium text-[8px] text-slate-500 tracking-wider uppercase">
            SUPPORT SERVICES DIVISION
          </div>
        </div>

        <div className="flex-1 px-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setActiveView(item.id as ViewState);
                setIsMobileMenuOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group ${activeView === item.id ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20' : 'hover:bg-slate-800 hover:text-white'}`}
            >
              <item.icon className={`w-5 h-5 ${activeView === item.id ? 'text-white' : 'text-slate-500 group-hover:text-indigo-400'}`} />
              <span className="font-medium">{item.label}</span>
            </button>
          ))}
        </div>

        <div className="p-4 bg-slate-950/50 mt-auto">
          <button onClick={() => setLanguage(l => l === 'en' ? 'ar' : 'en')} className="w-full flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors mb-4">
            <Languages className="w-5 h-5" />
            <span className="text-sm font-medium">{isRtl ? 'English' : 'العربية'}</span>
          </button>
          <div className="flex items-center gap-3 px-2 border-t border-slate-800 pt-4">
            <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold text-white shadow-inner">AD</div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate">{isRtl ? 'المدير العام' : 'Administrator'}</p>
              <p className="text-[10px] text-slate-500 truncate uppercase tracking-tighter">{isRtl ? 'إدارة الدعم والمساندة' : 'Support Division'}</p>
            </div>
          </div>
        </div>
      </nav>

      <main className="flex-1 min-w-0 overflow-y-auto h-screen relative">
        <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-8 pb-20">
          {activeView === 'dashboard' && (
            <DashboardScreen 
              language={language}
              areas={areas}
              workers={workers}
              inspectors={inspectors}
              visits={visits}
              scheduleMethod={scheduleMethod}
            />
          )}
          {activeView === 'upload' && (
            <UploadScreen 
              language={language}
              onDataProcessed={handleDataProcessed}
              workersCount={workers.length}
              inspectorsCount={inspectors.length}
            />
          )}
          {activeView === 'map' && <LocationMapScreen language={language} areas={areas} workers={workers} />}
          {activeView === 'assignment' && <AssignmentScreen language={language} areas={areas} inspectors={inspectors} onUpdateInspectors={setInspectors} workers={workers} />}
          {activeView === 'scheduling' && (
            <SchedulingScreen 
              language={language} 
              inspectors={inspectors} 
              onUpdateInspectors={setInspectors} 
              areas={areas} 
              onMethodChange={setScheduleMethod}
            />
          )}
          {activeView === 'inspection' && <InspectionDayView language={language} inspectors={inspectors} areas={areas} workers={workers} onVisitRecorded={handleRecordVisit} visits={visits} />}
          {activeView === 'reporting' && <ReportingScreen language={language} inspectors={inspectors} visits={visits} areas={areas} workers={workers} />}
        </div>
      </main>
    </div>
  );
};

export default App;
