
import React, { useState } from 'react';
import { AreaData, Worker, Language } from '../types';
import { ChevronRight, ChevronDown, MapPin, Users, Search, FileSpreadsheet } from 'lucide-react';
import * as XLSX from 'xlsx';

interface Props {
  language: Language;
  areas: AreaData[];
  workers: Worker[];
}

const LocationMapScreen: React.FC<Props> = ({ language, areas, workers }) => {
  const [expandedAreas, setExpandedAreas] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');

  const isRtl = language === 'ar';
  const t = {
    en: {
      title: 'Location Map',
      desc: 'Visualizing workforce distribution across areas and sub-locations.',
      search: 'Search Area or Location...',
      locs: 'Locations',
      wrkrs: 'Workers',
      export: 'Export Master List'
    },
    ar: {
      title: 'خريطة المواقع',
      desc: 'عرض توزيع القوى العاملة عبر المناطق والمواقع الفرعية.',
      search: 'بحث عن منطقة أو موقع...',
      locs: 'مواقع',
      wrkrs: 'موظفين',
      export: 'تصدير القائمة الشاملة'
    }
  }[language];

  const toggleArea = (name: string) => {
    const next = new Set(expandedAreas);
    if (next.has(name)) next.delete(name);
    else next.add(name);
    setExpandedAreas(next);
  };

  const handleExportExcel = () => {
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
            [isRtl ? 'عدد العمال' : 'Worker Count']: loc.workerIds.length
          });
        }
      });
    });

    const data = Array.from(uniqueMap.values());
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Unique_Locations");
    XLSX.writeFile(wb, `OpsCheck_Locations_Distinct_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const filteredAreas = areas.filter(a => 
    a.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.locations.some(l => l.name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">{t.title}</h2>
          <p className="text-slate-500 mt-1">{t.desc}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className={`absolute ${isRtl ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5`} />
            <input 
              type="text" 
              placeholder={t.search}
              className={`w-full md:w-64 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none ${isRtl ? 'pr-10 pl-4 text-right' : 'pl-10 pr-4 text-left'}`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button 
            onClick={handleExportExcel}
            className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 rounded-lg text-slate-700 font-bold hover:bg-slate-50 transition-colors shadow-sm"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            {t.export}
          </button>
        </div>
      </header>

      <div className="space-y-4">
        {filteredAreas.map(area => (
          <div key={area.name} className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            <button 
              onClick={() => toggleArea(area.name)}
              className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-600">
                  <MapPin className="w-6 h-6" />
                </div>
                <div className={isRtl ? 'text-right' : 'text-left'}>
                  <h4 className="font-bold text-slate-800">{area.name}</h4>
                  <p className="text-xs text-slate-500 uppercase tracking-widest font-semibold">
                    {area.locations.length} {t.locs} • {area.locations.reduce((acc, l) => acc + l.workerIds.length, 0)} {t.wrkrs}
                  </p>
                </div>
              </div>
              {expandedAreas.has(area.name) ? <ChevronDown className="text-slate-400" /> : (isRtl ? <ChevronRight className="text-slate-400 rotate-180" /> : <ChevronRight className="text-slate-400" />)}
            </button>

            {expandedAreas.has(area.name) && (
              <div className="border-t border-slate-100 bg-slate-50/50 p-4 space-y-3">
                {area.locations.map(loc => (
                  <div key={loc.id} className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                        <h5 className="font-semibold text-slate-800">{loc.name}</h5>
                      </div>
                      <div className="flex items-center gap-1.5 px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-full text-xs font-bold">
                        <Users className="w-3 h-3" />
                        {loc.workerIds.length} {t.wrkrs}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                      {loc.workerIds.map(wid => {
                        const worker = workers.find(w => w.Worker_ID === wid);
                        return (
                          <div key={wid} className="flex items-center gap-2 px-3 py-2 bg-slate-50 border border-slate-100 rounded text-sm group">
                            <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center text-[10px] font-bold text-slate-400 border border-slate-100">
                              {worker?.Worker_Name.charAt(0)}
                            </div>
                            <div className="flex-1 truncate">
                              <p className="text-slate-700 font-medium truncate">{worker?.Worker_Name}</p>
                              <p className="text-[10px] text-slate-400">ID: {wid}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default LocationMapScreen;
