
import React, { useState, useMemo } from 'react';
import { FileUp, CheckCircle2, AlertTriangle, Info, Users, ClipboardCheck, ArrowRight, SkipForward, Layers, Map as MapIcon, MapPin } from 'lucide-react';
import { Worker, Inspector, Language } from '../types';
import * as XLSX from 'xlsx';

interface Props {
  language: Language;
  onDataProcessed: (workers: Worker[], inspectors: Inspector[]) => void;
  workersCount: number;
  inspectorsCount: number;
}

interface Mapping {
  workerId: string;
  workerNameEng: string;
  workerNameAr: string;
  area: string;
  location: string;
  nationality: string;
  company: string;
  position: string;
}

const UploadScreen: React.FC<Props> = ({ language, onDataProcessed, workersCount, inspectorsCount }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [rawWorkers, setRawWorkers] = useState<any[] | null>(null);
  const [rawInspectors, setRawInspectors] = useState<any[] | null>(null);
  
  const [workerMapping, setWorkerMapping] = useState<Mapping | null>(null);
  const [inspectorMapping, setInspectorMapping] = useState<{ id: string, name: string } | null>(null);

  const isRtl = language === 'ar';

  const t = {
    en: {
      title: 'System Onboarding',
      desc: 'Upload your baseline workforce and inspector registers to get started.',
      workersTitle: 'Employees Baseline',
      workersDesc: 'Upload the primary worker registry (ID#, NAME (ENG), etc.).',
      inspectorsTitle: 'Inspector Register',
      inspectorsDesc: 'Upload authorized inspectors (رقم، الاسم).',
      choose: 'Choose Excel File',
      skip: 'Skip & Manage Manually',
      mappingTitle: 'Detected Mapping',
      confirmBtn: 'Proceed to Dashboard',
      errorId: 'Missing required column: ID#',
      errorNames: 'Missing required name columns: NAME (ENG) or NAME (AR)',
      errorLoc: 'Missing required columns: AREA or LOCATION',
      errorIns: 'Missing required inspector columns: رقم or الاسم',
      workerId: 'Worker ID (ID#)',
      workerName: 'Name Source',
      area: 'Area',
      location: 'Location',
      nationality: 'Nationality',
      company: 'Company',
      position: 'Position',
      insId: 'Inspector ID (رقم)',
      insName: 'Inspector Name (الاسم)',
      statWorkers: 'Total Workers',
      statInspectors: 'Total Inspectors',
      statStatus: 'System Status',
      statusOnline: 'Online',
      fileStats: 'File Content Summary',
      areasCount: 'Unique Areas',
      locsCount: 'Unique Locations',
      totalWorkers: 'Total Employees'
    },
    ar: {
      title: 'تهيئة النظام',
      desc: 'ارفع سجل القوى العاملة وسجل المفتشين للبدء.',
      workersTitle: 'قاعدة بيانات الموظفين',
      workersDesc: 'ارفع سجل الموظفين الأساسي (ID#، NAME (ENG)، إلخ).',
      inspectorsTitle: 'سجل المفتشين',
      inspectorsDesc: 'ارفع قائمة المفتشين المعتمدين (رقم، الاسم).',
      choose: 'اختر ملف إكسل',
      skip: 'تخطى للإضافة يدوياً',
      mappingTitle: 'الأعمدة المكتشفة',
      confirmBtn: 'المتابعة للوحة التحكم',
      errorId: 'العمود المطلوب مفقود: ID#',
      errorNames: 'أعمدة الأسماء مفقودة: NAME (ENG) أو NAME (AR)',
      errorLoc: 'أعمدة المنطقة أو الموقع مفقودة: AREA أو LOCATION',
      errorIns: 'أعمدة المفتشين مفقودة: رقم أو الاسم',
      workerId: 'رقم الموظف (ID#)',
      workerName: 'مصدر الاسم',
      area: 'المنطقة (AREA)',
      location: 'الموقع (LOCATION)',
      nationality: 'الجنسية',
      company: 'الشركة',
      position: 'المسمى الوظيفي',
      insId: 'رقم المفتش (رقم)',
      insName: 'اسم المفتش (الاسم)',
      statWorkers: 'إجمالي الموظفين',
      statInspectors: 'إجمالي المفتشين',
      statStatus: 'حالة النظام',
      statusOnline: 'متصل',
      fileStats: 'إحصائيات الملف المرفوع',
      areasCount: 'عدد المناطق',
      locsCount: 'عدد المواقع',
      totalWorkers: 'إجمالي العمالة'
    }
  }[language];

  const findHeaderExact = (headers: string[], target: string) => {
    return headers.find(h => h.trim().toUpperCase() === target.toUpperCase());
  };

  const processFile = async (file: File, type: 'workers' | 'inspectors') => {
    try {
      setLoading(true);
      setError(null);
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json(sheet) as any[];
      
      if (json.length === 0) throw new Error("File is empty");
      const headers = Object.keys(json[0]);

      if (type === 'workers') {
        const idCol = findHeaderExact(headers, 'ID#');
        const nameEng = findHeaderExact(headers, 'NAME (ENG)') || findHeaderExact(headers, 'EMP');
        const nameAr = findHeaderExact(headers, 'NAME (AR)');
        const areaCol = findHeaderExact(headers, 'AREA');
        const locCol = findHeaderExact(headers, 'LOCATION');
        const natCol = findHeaderExact(headers, 'NATIONALITY');
        const compCol = findHeaderExact(headers, 'COMPANY');
        const posCol = findHeaderExact(headers, 'POSITION');

        if (!idCol) return setError(t.errorId);
        if (!nameEng && !nameAr) return setError(t.errorNames);
        if (!areaCol || !locCol) return setError(t.errorLoc);

        setRawWorkers(json);
        setWorkerMapping({ 
          workerId: idCol, 
          workerNameEng: nameEng || '', 
          workerNameAr: nameAr || '', 
          area: areaCol, 
          location: locCol,
          nationality: natCol || '',
          company: compCol || '',
          position: posCol || ''
        });
      } else {
        const idCol = findHeaderExact(headers, 'رقم');
        const nameCol = findHeaderExact(headers, 'الاسم');

        if (!idCol || !nameCol) return setError(t.errorIns);

        setRawInspectors(json);
        setInspectorMapping({ id: idCol, name: nameCol });
      }
    } catch (e) {
      setError(isRtl ? 'خطأ في قراءة ملف الإكسل.' : 'Error reading Excel file.');
    } finally {
      setLoading(false);
    }
  };

  const fileStats = useMemo(() => {
    if (!rawWorkers || !workerMapping) return null;
    
    const areas = new Set();
    const locations = new Set();
    
    rawWorkers.forEach(row => {
      const area = row[workerMapping.area];
      const locRaw = row[workerMapping.location];
      
      if (area) areas.add(String(area).trim());
      if (locRaw) {
        String(locRaw).split('+').forEach(l => locations.add(l.trim()));
      }
    });

    return {
      areasCount: areas.size,
      locsCount: locations.size,
      totalWorkers: rawWorkers.length
    };
  }, [rawWorkers, workerMapping]);

  const handleApply = () => {
    if (!rawWorkers || !workerMapping) return;

    const processedWorkers: Worker[] = rawWorkers.map(row => {
      const id = row[workerMapping.workerId];
      const name = row[workerMapping.workerNameEng] || row[workerMapping.workerNameAr];
      const area = row[workerMapping.area];
      const location = row[workerMapping.location];

      if (!id || !name || !area || !location) return null;

      return {
        Worker_ID: String(id),
        Worker_Name: String(name),
        Area: String(area),
        Location: String(location),
        LOCATION_RAW: String(location),
        Nationality: row[workerMapping.nationality] || '',
        Company: row[workerMapping.company] || '',
        Position: row[workerMapping.position] || '',
        ...row
      };
    }).filter(Boolean) as Worker[];

    let processedInspectors: Inspector[] = [];
    if (rawInspectors && inspectorMapping) {
      processedInspectors = rawInspectors.map(row => {
        const id = row[inspectorMapping.id];
        const name = row[inspectorMapping.name];
        if (!id || !name) return null;

        return {
          Inspector_ID: String(id),
          Inspector_Name: String(name),
          Status: 'Active',
          Notes: row['ملاحظات'] || row['المسمى الوظيفي'] || '',
          PreferredDay: 'Sunday' as const,
          MaxLocationsPerDay: 5,
          LocationQueue: []
        };
      }).filter(Boolean) as Inspector[];
    }

    onDataProcessed(processedWorkers, processedInspectors);
  };

  return (
    <div className="space-y-6">
      <header>
        <h2 className="text-3xl font-bold text-slate-900">{t.title}</h2>
        <p className="text-slate-500 mt-1">{t.desc}</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col">
          <div className="flex items-center gap-3 mb-4 text-indigo-600">
            <Users className="w-6 h-6" />
            <h3 className="font-bold text-lg text-slate-800">{t.workersTitle}</h3>
          </div>
          <p className="text-sm text-slate-500 mb-6">{t.workersDesc}</p>
          
          <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-300 rounded-lg cursor-pointer bg-slate-50 hover:bg-slate-100 transition-colors">
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
              <FileUp className="w-8 h-8 text-slate-400 mb-2" />
              <p className="text-xs text-slate-500 uppercase font-semibold tracking-wider">
                {rawWorkers ? `${rawWorkers.length} rows detected` : t.choose}
              </p>
            </div>
            <input type="file" className="hidden" accept=".xlsx, .xls, .csv" onChange={(e) => e.target.files?.[0] && processFile(e.target.files[0], 'workers')} />
          </label>

          {workerMapping && (
            <div className="mt-4 p-4 bg-indigo-50/50 rounded-lg border border-indigo-100 space-y-2">
               <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-700 uppercase tracking-widest mb-2 border-b border-indigo-100 pb-2">
                <Layers className="w-3.5 h-3.5" />
                {t.mappingTitle}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <MappingRow label={t.workerId} value={workerMapping.workerId} />
                <MappingRow label={t.workerName} value={`${workerMapping.workerNameEng}${workerMapping.workerNameAr ? ' / ' + workerMapping.workerNameAr : ''}`} />
                <MappingRow label={t.area} value={workerMapping.area} />
                <MappingRow label={t.location} value={workerMapping.location} />
                <MappingRow label={t.nationality} value={workerMapping.nationality} />
                <MappingRow label={t.company} value={workerMapping.company} />
                <MappingRow label={t.position} value={workerMapping.position} />
              </div>
            </div>
          )}
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col">
          <div className="flex items-center gap-3 mb-4 text-emerald-600">
            <ClipboardCheck className="w-6 h-6" />
            <h3 className="font-bold text-lg text-slate-800">{t.inspectorsTitle}</h3>
          </div>
          <p className="text-sm text-slate-500 mb-6">{t.inspectorsDesc}</p>
          
          <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-300 rounded-lg cursor-pointer bg-slate-50 hover:bg-slate-100 transition-colors">
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
              <FileUp className="w-8 h-8 text-slate-400 mb-2" />
              <p className="text-xs text-slate-500 uppercase font-semibold tracking-wider">
                {rawInspectors ? `${rawInspectors.length} rows detected` : t.choose}
              </p>
            </div>
            <input type="file" className="hidden" accept=".xlsx, .xls, .csv" onChange={(e) => e.target.files?.[0] && processFile(e.target.files[0], 'inspectors')} />
          </label>

          <button 
            onClick={() => { setRawInspectors([]); setInspectorMapping({ id: 'Manual', name: 'Manual' }); }}
            className="mt-4 flex items-center justify-center gap-2 py-2 text-sm text-slate-400 font-bold hover:text-emerald-600 transition-colors"
          >
            <SkipForward className="w-4 h-4" />
            {t.skip}
          </button>

          {inspectorMapping && rawInspectors && rawInspectors.length > 0 && (
            <div className="mt-4 p-4 bg-emerald-50/50 rounded-lg border border-emerald-100 space-y-2">
               <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 uppercase tracking-widest mb-2 border-b border-emerald-100 pb-2">
                <Layers className="w-3.5 h-3.5" />
                {t.mappingTitle}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <MappingRow label={t.insId} value={inspectorMapping.id} />
                <MappingRow label={t.insName} value={inspectorMapping.name} />
              </div>
            </div>
          )}
        </div>
      </div>

      {fileStats && (
        <div className="bg-white border-2 border-indigo-100 rounded-xl p-6 shadow-md animate-in fade-in zoom-in-95 duration-300">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-indigo-600 text-white rounded-lg flex items-center justify-center">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900">{t.fileStats}</h3>
              <p className="text-xs text-slate-500">{isRtl ? 'ملخص محتويات ملف العمالة المرفوع حالياً' : 'Summary of the currently uploaded worker file'}</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex items-center gap-4">
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm text-indigo-600">
                <MapIcon className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t.areasCount}</p>
                <p className="text-2xl font-black text-slate-900">{fileStats.areasCount}</p>
              </div>
            </div>
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex items-center gap-4">
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm text-emerald-600">
                <MapPin className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t.locsCount}</p>
                <p className="text-2xl font-black text-slate-900">{fileStats.locsCount}</p>
              </div>
            </div>
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex items-center gap-4">
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm text-amber-600">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t.totalWorkers}</p>
                <p className="text-2xl font-black text-slate-900">{fileStats.totalWorkers}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 p-4 rounded-lg flex items-center gap-3 text-red-700 animate-in fade-in zoom-in-95 duration-200">
          <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          <p className="text-sm font-bold">{error}</p>
        </div>
      )}

      {rawWorkers && workerMapping && (
        <div className="bg-slate-900 text-white p-6 rounded-xl flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-indigo-600 text-white rounded-full flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div>
              <h4 className="font-bold text-xl">{isRtl ? 'بيانات الموظفين جاهزة' : 'Employee Data Ready'}</h4>
              <p className="text-slate-400 text-sm">{isRtl ? 'تم التحقق من جميع أعمدة البيانات المطلوبة.' : 'Verified all required data columns.'}</p>
            </div>
          </div>
          <button onClick={handleApply} className="w-full md:w-auto px-10 py-4 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 group shadow-lg shadow-indigo-600/20">
            {t.confirmBtn}
            <ArrowRight className={`w-5 h-5 group-hover:translate-x-1 transition-transform ${isRtl ? 'rotate-180 group-hover:-translate-x-1' : ''}`} />
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard title={t.statWorkers} value={workersCount} icon={Users} color="indigo" />
        <StatCard title={t.statInspectors} value={inspectorsCount} icon={ClipboardCheck} color="emerald" />
        <StatCard title={t.statStatus} value={t.statusOnline} icon={Info} color="slate" />
      </div>
    </div>
  );
};

const MappingRow = ({ label, value }: { label: string, value: string }) => (
  <div className="flex flex-col bg-white/40 p-2 rounded border border-indigo-100/30">
    <span className="text-[9px] text-slate-500 font-bold uppercase mb-0.5">{label}</span>
    <span className="text-xs font-black text-slate-800 truncate">{value || '---'}</span>
  </div>
);

const StatCard = ({ title, value, icon: Icon, color }: any) => (
  <div className="bg-white p-5 rounded-xl border border-slate-200 flex items-center gap-4 shadow-sm">
    <div className={`p-3 rounded-lg bg-${color}-50 text-${color}-600`}>
      <Icon className="w-6 h-6" />
    </div>
    <div>
      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{title}</p>
      <p className="text-2xl font-bold text-slate-800">{value}</p>
    </div>
  </div>
);

export default UploadScreen;
