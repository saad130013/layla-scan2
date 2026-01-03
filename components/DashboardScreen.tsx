
import React from 'react';
import { AreaData, Worker, Inspector, VisitRecord, Language, ScheduleMethod } from '../types';
import { 
  Users, 
  MapPin, 
  Map as MapIcon, 
  ShieldCheck, 
  BrainCircuit, 
  MousePointer2,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Clock,
  FileSpreadsheet
} from 'lucide-react';
import * as XLSX from 'xlsx';

interface Props {
  language: Language;
  areas: AreaData[];
  workers: Worker[];
  inspectors: Inspector[];
  visits: VisitRecord[];
  scheduleMethod: ScheduleMethod;
}

const DashboardScreen: React.FC<Props> = ({ language, areas, workers, inspectors, visits, scheduleMethod }) => {
  const isRtl = language === 'ar';

  const totalLocs = areas.reduce((acc, a) => acc + a.locations.length, 0);
  const activeInspectors = inspectors.filter(i => i.Status === 'Active').length;
  const visitedThisWeek = new Set(visits.filter(v => v.visited).map(v => v.locationId)).size;
  const coveragePercent = totalLocs > 0 ? Math.round((visitedThisWeek / totalLocs) * 100) : 0;

  const t = {
    en: {
      title: 'Operations Dashboard',
      subtitle: 'Real-time overview of workforce and inspection logistics.',
      totalAreas: 'Total Areas',
      totalLocs: 'Total Locations',
      totalWorkers: 'Total Employees',
      totalInspectors: 'Inspectors',
      scheduleMode: 'Scheduling Method',
      smart: 'Smart Distribution',
      manual: 'Manual Assignment',
      coverage: 'Operation Coverage',
      weeklyStatus: 'Weekly Progress',
      alerts: 'Operational Alerts',
      noData: 'No data uploaded yet. Please go to Upload section.',
      activeNow: 'Active Inspectors',
      locations: 'Locations',
      inspectors: 'Inspectors',
      exportLocs: 'Export Locations List'
    },
    ar: {
      title: 'لوحة التحكم والعمليات',
      subtitle: 'نظرة عامة فورية على القوى العاملة ولوجستيات التفتيش.',
      totalAreas: 'إجمالي المناطق',
      totalLocs: 'إجمالي المواقع',
      totalWorkers: 'إجمالي العمالة',
      totalInspectors: 'المفتشين',
      scheduleMode: 'طريقة الجدولة',
      smart: 'توزيع ذكي (Smart)',
      manual: 'توزيع يدوي (Manual)',
      coverage: 'تغطية العمليات',
      weeklyStatus: 'التقدم الأسبوعي',
      alerts: 'تنبيهات العمليات',
      noData: 'لا توجد بيانات مرفوعة. يرجى الذهاب لقسم رفع الملفات.',
      activeNow: 'المفتشين النشطين',
      locations: 'المواقع',
      inspectors: 'المفتشين',
      exportLocs: 'تصدير قائمة المواقع'
    }
  }[language];

  const handleExportLocations = () => {
    const uniqueMap = new Map<string, any>();
    
    areas.forEach(area => {
      area.locations.forEach(loc => {
        const areaName = area.name.trim();
        const locName = loc.name.trim();
        const key = `${areaName.toLowerCase()}|${locName.toLowerCase()}`;
        
        if (!uniqueMap.has(key)) {
          uniqueMap.set(key, {
            [isRtl ? 'المنطقة' : 'Area']: areaName,
            [isRtl ? 'الموقع' : 'Location']: locName,
            [isRtl ? 'إجمالي عدد العمال' : 'Total Workers']: loc.workerIds.length
          });
        }
      });
    });

    const data = Array.from(uniqueMap.values());
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Master_Locations");
    XLSX.writeFile(wb, `OpsCheck_Master_Locations_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  if (workers.length === 0) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center text-slate-400 space-y-4">
        <AlertCircle className="w-16 h-16 opacity-20" />
        <p className="font-bold text-lg">{t.noData}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900">{t.title}</h2>
          <p className="text-slate-500 mt-1">{t.subtitle}</p>
        </div>
        <button 
          onClick={handleExportLocations}
          className="flex items-center gap-2 px-5 py-3 bg-white border border-slate-200 rounded-xl text-slate-700 font-bold hover:bg-slate-50 transition-all shadow-sm hover:shadow-md"
        >
          <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
          {t.exportLocs}
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title={t.totalAreas} value={areas.length} icon={MapIcon} color="indigo" />
        <StatCard title={t.totalLocs} value={totalLocs} icon={MapPin} color="emerald" />
        <StatCard title={t.totalWorkers} value={workers.length} icon={Users} color="amber" />
        <StatCard title={t.totalInspectors} value={inspectors.length} icon={ShieldCheck} color="purple" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-6">
              <h4 className="font-bold text-slate-800">{t.scheduleMode}</h4>
              <div className={`p-2 rounded-lg ${scheduleMethod === 'Smart' ? 'bg-indigo-50 text-indigo-600' : 'bg-amber-50 text-amber-600'}`}>
                {scheduleMethod === 'Smart' ? <BrainCircuit className="w-5 h-5" /> : <MousePointer2 className="w-5 h-5" />}
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className={`px-4 py-2 rounded-full text-sm font-black uppercase tracking-widest ${scheduleMethod === 'Smart' ? 'bg-indigo-600 text-white' : 'bg-amber-500 text-white'}`}>
                {scheduleMethod === 'Smart' ? t.smart : t.manual}
              </div>
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-6 leading-relaxed">
            {isRtl 
              ? 'يتم تحديد هذه الحالة بناءً على آخر عملية جدولة تمت في قسم "الجدولة الذكية".' 
              : 'This state is determined based on the last scheduling operation in the "Smart Planner" section.'}
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h4 className="font-bold text-slate-800 mb-6">{t.weeklyStatus}</h4>
          <div className="flex items-center justify-center py-4">
            <div className="relative w-32 h-32">
               <svg className="w-full h-full" viewBox="0 0 36 36">
                <path className="text-slate-100" strokeDasharray="100, 100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3" />
                <path className="text-indigo-600" strokeDasharray={`${coveragePercent}, 100`} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-black text-slate-900">{coveragePercent}%</span>
                <span className="text-[10px] font-bold text-slate-400 uppercase">{t.locations}</span>
              </div>
            </div>
          </div>
          <div className="mt-6 flex items-center justify-between text-xs font-bold text-slate-500">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-indigo-600"></div>
              <span>{visitedThisWeek} {isRtl ? 'تمت زيارتها' : 'Visited'}</span>
            </div>
            <span>{totalLocs} {isRtl ? 'إجمالي' : 'Total'}</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <h4 className="font-bold text-slate-800 mb-4">{t.alerts}</h4>
          <div className="flex-1 space-y-3 overflow-y-auto max-h-[160px] pr-2">
             <AlertItem 
              icon={ShieldCheck} 
              color="emerald" 
              text={isRtl ? `${activeInspectors} مفتشين نشطين في الميدان` : `${activeInspectors} active inspectors in field`}
              status="OK"
            />
            {coveragePercent < 30 && (
              <AlertItem 
                icon={TrendingUp} 
                color="amber" 
                text={isRtl ? 'نسبة التغطية الأسبوعية منخفضة' : 'Weekly coverage is below target'}
                status="NOTICE"
              />
            )}
             <AlertItem 
                icon={Clock} 
                color="indigo" 
                text={isRtl ? 'النظام جاهز للزيارات القادمة' : 'System ready for upcoming visits'}
                status="INFO"
              />
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, icon: Icon, color }: any) => (
  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow group">
    <div className={`w-12 h-12 bg-${color}-50 text-${color}-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
      <Icon className="w-6 h-6" />
    </div>
    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">{title}</p>
    <h3 className="text-4xl font-black text-slate-900">{value}</h3>
  </div>
);

const AlertItem = ({ icon: Icon, color, text, status }: any) => (
  <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
    <div className={`w-8 h-8 bg-${color}-100 text-${color}-600 rounded-lg flex items-center justify-center flex-shrink-0`}>
      <Icon className="w-4 h-4" />
    </div>
    <p className="flex-1 text-xs font-bold text-slate-700">{text}</p>
    <span className={`text-[8px] font-black px-1.5 py-0.5 rounded-full bg-${color}-600 text-white`}>{status}</span>
  </div>
);

export default DashboardScreen;
