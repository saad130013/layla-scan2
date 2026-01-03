
import React, { useState } from 'react';
import { AreaData, Inspector, Worker, Language, WEEKDAYS, TRANSLATIONS, INSPECTOR_COLORS } from '../types';
import { Users, UserPlus, MapPin, Hash, Zap, Search, Plus, Edit3, Save, X, ToggleLeft, ToggleRight, Trash2, Check, Printer } from 'lucide-react';

interface Props {
  language: Language;
  areas: AreaData[];
  inspectors: Inspector[];
  workers: Worker[];
  onUpdateInspectors: (inspectors: Inspector[]) => void;
}

const AssignmentScreen: React.FC<Props> = ({ language, areas, inspectors, onUpdateInspectors, workers }) => {
  const [selectedInspectorId, setSelectedInspectorId] = useState<string | null>(null);
  const [assignmentSearch, setAssignmentSearch] = useState('');
  const [isAddingInspector, setIsAddingInspector] = useState(false);
  const [editingInspectorId, setEditingInspectorId] = useState<string | null>(null);
  
  // Form State
  const [formName, setFormName] = useState('');
  const [formDay, setFormDay] = useState<any>('Sunday');
  const [formNotes, setFormNotes] = useState('');

  const isRtl = language === 'ar';
  const t = {
    en: {
      title: 'Inspector & Assignment Management',
      desc: 'Assign locations to inspectors. Note: Locations can be assigned to multiple inspectors.',
      auto: 'Auto-Balance (Active only)',
      sidebarTitle: 'Inspector Roster',
      sidebarDesc: 'Manage profile and assignments',
      locs: 'Locations',
      wrkrs: 'Workers',
      inv: 'Location Inventory',
      assignTo: (name: string) => `Assignments for ${name}`,
      filter: 'Filter locations...',
      assignedTo: 'Assigned to:',
      addInspector: 'Add Inspector',
      editInspector: 'Edit Inspector',
      save: 'Save Changes',
      cancel: 'Cancel',
      name: 'Full Name',
      day: 'Visit Day',
      notes: 'Notes',
      active: 'Active',
      inactive: 'Inactive',
      status: 'Status',
      duplicate: 'A duplicate name exists!',
      deleteConfirm: 'Are you sure you want to delete this inspector? Their locations will be unassigned.',
      multiNote: 'Multiple inspectors enabled',
      printSheet: 'Print Field Sheet'
    },
    ar: {
      title: 'إدارة المفتشين والتكاليف',
      desc: 'تعيين المواقع للمفتشين. ملاحظة: يمكن تعيين الموقع لأكثر من مفتش.',
      auto: 'توازن تلقائي (للنشطين فقط)',
      sidebarTitle: 'سجل المفتشين',
      sidebarDesc: 'إدارة الملف الشخصي والتكليفات',
      locs: 'مواقع',
      wrkrs: 'موظفين',
      inv: 'قائمة المواقع',
      assignTo: (name: string) => `تكليفات ${name}`,
      filter: 'تصفية المواقع...',
      assignedTo: 'مكلف لـ:',
      addInspector: 'إضافة مفتش',
      editInspector: 'تعديل بيانات المفتش',
      save: 'حفظ التغييرات',
      cancel: 'إلغاء',
      name: 'الاسم الكامل',
      day: 'يوم الزيارة',
      notes: 'ملاحظات',
      active: 'نشط',
      inactive: 'غير نشط',
      status: 'الحالة',
      duplicate: 'هذا الاسم موجود مسبقاً!',
      deleteConfirm: 'هل أنت متأكد من حذف هذا المفتش؟ سيتم إلغاء تكليف مواقعه.',
      multiNote: 'تعدد المفتشين مفعل',
      printSheet: 'طباعة كشف الميدان'
    }
  }[language];

  const allLocations = areas.flatMap(a => a.locations);

  const handleAssign = (inspectorId: string, locationId: string) => {
    onUpdateInspectors(inspectors.map(ins => {
      if (ins.Inspector_ID === inspectorId) {
        const isAlreadyAssigned = ins.LocationQueue.includes(locationId);
        if (isAlreadyAssigned) {
          return { ...ins, LocationQueue: ins.LocationQueue.filter(id => id !== locationId) };
        } else {
          return { ...ins, LocationQueue: [...ins.LocationQueue, locationId] };
        }
      }
      return ins;
    }));
  };

  const handleAddInspector = () => {
    if (!formName.trim()) return;
    const color = INSPECTOR_COLORS[inspectors.length % INSPECTOR_COLORS.length];
    const newInspector: Inspector = {
      Inspector_ID: 'INS-' + Math.random().toString(36).substr(2, 6).toUpperCase(),
      Inspector_Name: formName,
      Status: 'Active',
      PreferredDay: formDay,
      Notes: formNotes,
      MaxLocationsPerDay: 5,
      LocationQueue: [],
      Color: color
    };
    onUpdateInspectors([...inspectors, newInspector]);
    resetForm();
  };

  const handleUpdateInspector = () => {
    if (!editingInspectorId || !formName.trim()) return;
    onUpdateInspectors(inspectors.map(i => 
      i.Inspector_ID === editingInspectorId 
        ? { ...i, Inspector_Name: formName, PreferredDay: formDay, Notes: formNotes }
        : i
    ));
    resetForm();
  };

  const toggleStatus = (id: string) => {
    onUpdateInspectors(inspectors.map(i => 
      i.Inspector_ID === id ? { ...i, Status: i.Status === 'Active' ? 'Inactive' : 'Active' } : i
    ));
  };

  const deleteInspector = (id: string) => {
    if (window.confirm(t.deleteConfirm)) {
      onUpdateInspectors(inspectors.filter(i => i.Inspector_ID !== id));
      if (selectedInspectorId === id) setSelectedInspectorId(null);
    }
  };

  const resetForm = () => {
    setFormName('');
    setFormDay('Sunday');
    setFormNotes('');
    setIsAddingInspector(false);
    setEditingInspectorId(null);
  };

  const openEdit = (ins: Inspector) => {
    setFormName(ins.Inspector_Name);
    setFormDay(ins.PreferredDay);
    setFormNotes(ins.Notes || '');
    setEditingInspectorId(ins.Inspector_ID);
    setIsAddingInspector(false);
  };

  const selectedInspector = inspectors.find(i => i.Inspector_ID === selectedInspectorId);

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">{t.title}</h2>
          <p className="text-slate-500 mt-1">{t.desc}</p>
        </div>
        <div className="flex gap-2">
           <button onClick={() => { resetForm(); setIsAddingInspector(true); }} className="flex items-center gap-2 px-5 py-2.5 bg-indigo-50 text-indigo-700 rounded-lg font-bold hover:bg-indigo-100 transition-all">
            <Plus className="w-4 h-4" />
            {t.addInspector}
          </button>
          <button onClick={() => {
            const activeInspectors = inspectors.filter(i => i.Status === 'Active');
            if (activeInspectors.length === 0) return;
            const newInspectors = inspectors.map(i => ({ 
              ...i, 
              LocationQueue: i.Status === 'Active' ? [] as string[] : i.LocationQueue 
            }));
            allLocations.forEach((loc, idx) => {
              const target = newInspectors.find(i => i.Inspector_ID === activeInspectors[idx % activeInspectors.length].Inspector_ID);
              if (target) target.LocationQueue.push(loc.id);
            });
            onUpdateInspectors(newInspectors);
          }} className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20">
            <Zap className="w-4 h-4" />
            {t.auto}
          </button>
        </div>
      </header>

      {(isAddingInspector || editingInspectorId) && (
        <div className="bg-white p-6 rounded-xl border-2 border-indigo-200 shadow-xl animate-in fade-in zoom-in-95 duration-200">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-slate-900">{isAddingInspector ? t.addInspector : t.editInspector}</h3>
            <button onClick={resetForm} className="p-2 hover:bg-slate-100 rounded-full"><X className="w-5 h-5" /></button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase">{t.name}</label>
              <input value={formName} onChange={(e) => setFormName(e.target.value)} className={`w-full p-2.5 border rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 ${isRtl ? 'text-right' : 'text-left'}`} />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase">{t.day}</label>
              <select value={formDay} onChange={(e) => setFormDay(e.target.value as any)} className={`w-full p-2.5 border rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 ${isRtl ? 'text-right' : 'text-left'}`}>
                {WEEKDAYS.map(d => <option key={d} value={d}>{TRANSLATIONS[language][d]}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase">{t.notes}</label>
              <input value={formNotes} onChange={(e) => setFormNotes(e.target.value)} className={`w-full p-2.5 border rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 ${isRtl ? 'text-right' : 'text-left'}`} />
            </div>
          </div>
          <div className="mt-6 flex justify-end gap-3">
            <button onClick={resetForm} className="px-5 py-2 text-slate-600 font-bold">{t.cancel}</button>
            <button onClick={isAddingInspector ? handleAddInspector : handleUpdateInspector} className="px-8 py-2 bg-indigo-600 text-white rounded-lg font-bold flex items-center gap-2">
              <Save className="w-4 h-4" />
              {t.save}
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm flex flex-col h-[700px]">
          <div className="p-4 border-b border-slate-100 bg-slate-50/50">
            <h3 className="font-bold text-slate-800">{t.sidebarTitle}</h3>
            <p className="text-xs text-slate-500">{t.sidebarDesc}</p>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {inspectors.map(ins => (
              <div key={ins.Inspector_ID} className="group flex flex-col p-1">
                <div className={`flex items-center w-full rounded-lg transition-all ${selectedInspectorId === ins.Inspector_ID ? 'bg-indigo-50 border-indigo-200 ring-2 ring-indigo-500 ring-offset-1' : 'hover:bg-slate-50 border-transparent'} border`}>
                   <button
                    onClick={() => setSelectedInspectorId(ins.Inspector_ID)}
                    className={`flex-1 text-left p-4 flex items-center justify-between min-w-0`}
                  >
                    <div className={isRtl ? 'text-right' : 'text-left'}>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: ins.Color || '#94a3b8' }}></div>
                        <h4 className={`font-bold leading-none ${ins.Status === 'Inactive' ? 'text-slate-400 line-through' : 'text-slate-900'}`}>
                          {ins.Inspector_Name}
                        </h4>
                        <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded-full ${ins.Status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                          {ins.Status === 'Active' ? t.active : t.inactive}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1.5 font-medium uppercase tracking-tighter truncate">
                        {ins.LocationQueue.length} {t.locs} • {TRANSLATIONS[language][ins.PreferredDay]}
                      </p>
                    </div>
                  </button>
                  <div className="px-2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => openEdit(ins)} className="p-1.5 text-slate-400 hover:text-indigo-600"><Edit3 className="w-4 h-4" /></button>
                    <button onClick={() => toggleStatus(ins.Inspector_ID)} className="p-1.5 text-slate-400 hover:text-indigo-600">
                      {ins.Status === 'Active' ? <ToggleRight className="w-5 h-5 text-emerald-500" /> : <ToggleLeft className="w-5 h-5" />}
                    </button>
                    <button onClick={() => deleteInspector(ins.Inspector_ID)} className="p-1.5 text-slate-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div className={isRtl ? 'text-right' : 'text-left'}>
                <h3 className="text-xl font-bold text-slate-800">
                  {selectedInspector ? t.assignTo(selectedInspector.Inspector_Name) : t.inv}
                </h3>
                <div className="flex items-center gap-2">
                  <p className="text-[10px] text-indigo-500 font-bold uppercase">{t.multiNote}</p>
                </div>
              </div>
              <div className="relative">
                <Search className={`absolute ${isRtl ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4`} />
                <input 
                  type="text" 
                  placeholder={t.filter}
                  className={`py-1.5 border border-slate-200 rounded-lg text-sm w-64 ${isRtl ? 'pr-9 pl-4 text-right' : 'pl-9 pr-4 text-left'}`}
                  value={assignmentSearch}
                  onChange={(e) => setAssignmentSearch(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 overflow-y-auto max-h-[550px] pr-2">
              {allLocations
                .filter(l => l.name.toLowerCase().includes(assignmentSearch.toLowerCase()) || l.area.toLowerCase().includes(assignmentSearch.toLowerCase()))
                .map(loc => {
                  const assignedInspectors = inspectors.filter(i => i.LocationQueue.includes(loc.id));
                  const isAssignedToCurrent = selectedInspectorId && assignedInspectors.some(i => i.Inspector_ID === selectedInspectorId);
                  const isSelectable = selectedInspectorId && selectedInspector?.Status === 'Active';
                  
                  return (
                    <div 
                      key={loc.id} 
                      className={`
                        p-4 rounded-xl border transition-all flex items-start justify-between gap-3
                        ${isAssignedToCurrent 
                          ? 'border-indigo-400 bg-indigo-50/50 shadow-sm' 
                          : assignedInspectors.length > 0 
                            ? 'border-slate-200 bg-slate-50/50' 
                            : 'border-slate-200 bg-white hover:border-indigo-300'}
                      `}
                    >
                      <div className={`min-w-0 ${isRtl ? 'text-right' : 'text-left'}`}>
                        <div className="flex items-center gap-1.5 mb-1">
                          <MapPin className={`w-3 h-3 ${isAssignedToCurrent ? 'text-indigo-600' : 'text-slate-400'}`} />
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider truncate">{loc.area}</span>
                        </div>
                        <h5 className="font-bold text-slate-800 truncate">{loc.name}</h5>
                        <p className="text-xs text-slate-500 font-medium">{loc.workerIds.length} {t.wrkrs}</p>
                        
                        {assignedInspectors.length > 0 && (
                          <div className={`mt-3 flex flex-wrap gap-1 ${isRtl ? 'justify-end' : 'justify-start'}`}>
                            {assignedInspectors.map(ins => (
                              <div 
                                key={ins.Inspector_ID} 
                                className="w-3 h-3 rounded-full border border-white shadow-sm"
                                style={{ backgroundColor: ins.Color || '#94a3b8' }}
                                title={ins.Inspector_Name}
                              />
                            ))}
                          </div>
                        )}
                      </div>

                      {isSelectable && (
                        <button
                          onClick={() => handleAssign(selectedInspectorId!, loc.id)}
                          className={`w-10 h-10 rounded-lg transition-all flex items-center justify-center flex-shrink-0 border-2
                            ${isAssignedToCurrent 
                              ? 'bg-emerald-600 border-emerald-600 text-white shadow-lg shadow-emerald-500/20' 
                              : 'bg-white border-slate-200 text-slate-400 hover:border-indigo-500 hover:text-indigo-600'}`}
                        >
                          {isAssignedToCurrent ? <Check className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                        </button>
                      )}
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssignmentScreen;
