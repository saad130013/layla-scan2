
import React, { useState, useMemo } from 'react';
import { Inspector, AreaData, Worker, VisitRecord, Language, TRANSLATIONS } from '../types';
import { CheckCircle2, XCircle, Camera, ClipboardList, MapPin, UserCheck, ChevronRight } from 'lucide-react';

interface Props {
  language: Language;
  inspectors: Inspector[];
  areas: AreaData[];
  workers: Worker[];
  visits: VisitRecord[];
  onVisitRecorded: (record: VisitRecord) => void;
}

const InspectionDayView: React.FC<Props> = ({ language, inspectors, areas, workers, visits, onVisitRecorded }) => {
  const [selectedInspectorId, setSelectedInspectorId] = useState<string | null>(null);
  const [activeLocationId, setActiveLocationId] = useState<string | null>(null);
  const [actualCount, setActualCount] = useState<number>(0);
  const [notes, setNotes] = useState('');

  const isRtl = language === 'ar';
  const t = {
    en: {
      title: 'Field Inspection',
      desc: 'Select an inspector to view their active visit list for the day.',
      prefDay: 'Preferred Day',
      locsInQueue: 'Locations in Queue',
      todayQueue: "Today's Inspection Queue",
      scheduled: 'Scheduled',
      expected: 'Expected Workforce',
      actual: 'Actual Worker Count',
      inspNotes: 'Inspection Notes',
      placeholderNotes: 'Describe any anomalies...',
      photo: 'Evidence Photo',
      photoBtn: 'Take / Upload Photo',
      baseline: 'Baseline Registry (Verification)',
      confirmSuccess: 'Confirm Visit Successful',
      reportUnvisited: 'Report as Unvisited',
      completed: 'COMPLETED',
      beginVisit: 'Begin Visit',
      noLocs: 'No locations scheduled in queue'
    },
    ar: {
      title: 'التفتيش الميداني',
      desc: 'اختر مفتشاً لعرض قائمة زياراته النشطة لهذا اليوم.',
      prefDay: 'اليوم المفضل',
      locsInQueue: 'موقع في الانتظار',
      todayQueue: 'قائمة تفتيش اليوم',
      scheduled: 'مجدول',
      expected: 'القوة العاملة المتوقعة',
      actual: 'عدد الموظفين الفعلي',
      inspNotes: 'ملاحظات التفتيش',
      placeholderNotes: 'صف أي ملاحظات أو مخالفات...',
      photo: 'صورة الإثبات',
      photoBtn: 'التقاط / رفع صورة',
      baseline: 'سجل الأساس (التحقق)',
      confirmSuccess: 'تأكيد نجاح الزيارة',
      reportUnvisited: 'إبلاغ عن عدم الزيارة',
      completed: 'مكتمل',
      beginVisit: 'بدء الزيارة',
      noLocs: 'لا توجد مواقع مجدولة في القائمة'
    }
  }[language];

  const allLocations = areas.flatMap(a => a.locations);
  const selectedInspector = inspectors.find(i => i.Inspector_ID === selectedInspectorId);

  const scheduledLocations = useMemo(() => {
    if (!selectedInspector) return [];
    return selectedInspector.LocationQueue.slice(0, selectedInspector.MaxLocationsPerDay)
      .map(id => allLocations.find(l => l.id === id))
      .filter(Boolean);
  }, [selectedInspector, allLocations]);

  const handleStartInspection = (locId: string) => {
    const loc = allLocations.find(l => l.id === locId);
    setActiveLocationId(locId);
    setActualCount(loc?.workerIds.length || 0);
    setNotes('');
  };

  const getWeekString = (d: Date) => {
    const startOfYear = new Date(d.getFullYear(), 0, 1);
    const pastDaysOfYear = (d.getTime() - startOfYear.getTime()) / 86400000;
    return `${d.getFullYear()}-W${Math.ceil((pastDaysOfYear + startOfYear.getDay() + 1) / 7)}`;
  };

  const submitVisit = (visited: boolean) => {
    if (!selectedInspectorId || !activeLocationId) return;
    onVisitRecorded({
      id: Math.random().toString(36).substr(2, 9),
      locationId: activeLocationId,
      inspectorId: selectedInspectorId,
      date: new Date().toISOString(),
      visited,
      actualCount,
      notes,
      scheduledWeek: getWeekString(new Date())
    });
    setActiveLocationId(null);
  };

  if (!selectedInspectorId) {
    return (
      <div className="space-y-6">
        <header>
          <h2 className="text-3xl font-bold text-slate-900">{t.title}</h2>
          <p className="text-slate-500 mt-1">{t.desc}</p>
        </header>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {inspectors.map(ins => (
            <button key={ins.Inspector_ID} onClick={() => setSelectedInspectorId(ins.Inspector_ID)} className="bg-white p-6 rounded-xl border border-slate-200 text-left hover:border-indigo-500 transition-all hover:shadow-md group">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                  <UserCheck className="w-7 h-7" />
                </div>
                <div className={isRtl ? 'text-left' : 'text-right'}>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t.prefDay}</p>
                  <p className="text-sm font-bold text-indigo-600">{TRANSLATIONS[language][ins.PreferredDay]}</p>
                </div>
              </div>
              <h4 className={`text-lg font-bold text-slate-800 truncate ${isRtl ? 'text-right' : 'text-left'}`}>{ins.Inspector_Name}</h4>
              <p className={`text-sm text-slate-500 font-medium ${isRtl ? 'text-right' : 'text-left'}`}>{ins.LocationQueue.length} {t.locsInQueue}</p>
            </button>
          ))}
        </div>
      </div>
    );
  }

  const activeLocation = allLocations.find(l => l.id === activeLocationId);
  const currentWeek = getWeekString(new Date());

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button onClick={() => { setSelectedInspectorId(null); setActiveLocationId(null); }} className="p-2 hover:bg-slate-200 rounded-lg">
            <ChevronRight className={`w-6 h-6 ${isRtl ? '' : 'rotate-180'}`} />
          </button>
          <div>
            <h2 className="text-2xl font-bold text-slate-900">{selectedInspector.Inspector_Name}</h2>
            <p className="text-slate-500 text-sm">{t.todayQueue} • {TRANSLATIONS[language][selectedInspector.PreferredDay]}</p>
          </div>
        </div>
        <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-xs font-bold">
          <ClipboardList className="w-4 h-4" />
          {scheduledLocations.length} {t.scheduled}
        </div>
      </header>

      {activeLocation ? (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-lg animate-in slide-in-from-bottom-4 duration-300">
          <div className="p-6 bg-slate-900 text-white">
            <div className="flex items-center gap-2 mb-2 text-indigo-400">
              <MapPin className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-widest">{activeLocation.area}</span>
            </div>
            <h3 className="text-2xl font-bold">{activeLocation.name}</h3>
            <p className="text-slate-400 mt-1">{t.expected}: {activeLocation.workerIds.length}</p>
          </div>
          <div className="p-6 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">{t.actual}</label>
                  <div className="flex items-center gap-4">
                    <button onClick={() => setActualCount(Math.max(0, actualCount - 1))} className="w-12 h-12 rounded-lg border-2 border-slate-200 flex items-center justify-center text-2xl font-bold">-</button>
                    <input type="number" value={actualCount} onChange={(e) => setActualCount(parseInt(e.target.value) || 0)} className="flex-1 h-12 border-2 border-slate-200 rounded-lg text-center text-xl font-bold outline-none" />
                    <button onClick={() => setActualCount(actualCount + 1)} className="w-12 h-12 rounded-lg border-2 border-slate-200 flex items-center justify-center text-2xl font-bold">+</button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">{t.inspNotes}</label>
                  <textarea placeholder={t.placeholderNotes} className="w-full h-32 border-2 border-slate-200 rounded-lg p-4 outline-none resize-none" value={notes} onChange={(e) => setNotes(e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">{t.photo}</label>
                  <button className="w-full flex items-center justify-center gap-2 h-12 border-2 border-dashed border-slate-300 rounded-lg text-slate-500 hover:bg-slate-50"><Camera className="w-5 h-5" /> {t.photoBtn}</button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-4">{t.baseline}</label>
                <div className="bg-slate-50 rounded-xl border border-slate-200 divide-y divide-slate-200 overflow-y-auto max-h-[400px]">
                  {activeLocation.workerIds.map((wid, idx) => {
                    const worker = workers.find(w => w.Worker_ID === wid);
                    return (
                      <div key={wid} className="p-3 flex items-center gap-3">
                        <span className="text-xs text-slate-400 font-mono w-4">{idx + 1}</span>
                        <div className="flex-1 truncate">
                          <p className={`text-sm font-bold text-slate-800 truncate ${isRtl ? 'text-right' : 'text-left'}`}>{worker?.Worker_Name}</p>
                          <p className={`text-[10px] text-slate-500 font-mono ${isRtl ? 'text-right' : 'text-left'}`}>ID: {wid}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
            <div className="flex flex-col md:flex-row items-center gap-4 pt-6 border-t border-slate-100">
              <button onClick={() => submitVisit(true)} className="w-full flex items-center justify-center gap-3 py-4 bg-emerald-600 text-white rounded-xl font-bold shadow-lg shadow-emerald-600/20"><CheckCircle2 className="w-6 h-6" /> {t.confirmSuccess}</button>
              <button onClick={() => submitVisit(false)} className="w-full flex items-center justify-center gap-3 py-4 bg-slate-100 text-slate-700 rounded-xl font-bold"><XCircle className="w-6 h-6" /> {t.reportUnvisited}</button>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {scheduledLocations.map((loc, idx) => {
            const isCompleted = visits.some(v => v.locationId === loc?.id && v.scheduledWeek === currentWeek);
            return (
              <div key={loc?.id} className={`bg-white rounded-xl border-2 overflow-hidden flex flex-col ${isCompleted ? 'border-emerald-100 bg-emerald-50/20' : 'border-slate-200 hover:border-indigo-300'}`}>
                <div className={`p-4 ${isCompleted ? 'bg-emerald-600' : 'bg-slate-800'} text-white flex items-center justify-between`}>
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold">{idx + 1}</span>
                    <span className="text-[10px] font-bold uppercase tracking-widest">{loc?.area}</span>
                  </div>
                  {isCompleted && <CheckCircle2 className="w-5 h-5" />}
                </div>
                <div className="p-5 flex-1 flex flex-col">
                  <h4 className="text-lg font-bold text-slate-800 mb-1">{loc?.name}</h4>
                  <p className="text-sm text-slate-500 mb-6">{loc?.workerIds.length} {t.scheduled}</p>
                  {isCompleted ? <div className="mt-auto py-3 px-4 bg-emerald-100 rounded-lg text-emerald-700 text-xs font-bold flex items-center justify-center gap-2"><CheckCircle2 className="w-4 h-4" /> {t.completed}</div> : <button onClick={() => handleStartInspection(loc?.id!)} className="mt-auto w-full py-3 bg-indigo-600 text-white rounded-lg font-bold">{t.beginVisit}</button>}
                </div>
              </div>
            );
          })}
          {scheduledLocations.length === 0 && (
            <div className="col-span-full py-20 bg-white rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400">
              <ClipboardList className="w-12 h-12 mb-4" />
              <p className="font-bold">{t.noLocs}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default InspectionDayView;
