
import React, { useState } from 'react';
import { Inspector, VisitRecord, AreaData, Worker, Language, TRANSLATIONS } from '../types';
import { FileSpreadsheet, Printer, CheckCircle2, Clock, AlertCircle, TrendingUp, Download, Loader2 } from 'lucide-react';
import * as XLSX from 'xlsx';
// @ts-ignore
import html2pdf from 'html2pdf.js';

interface Props {
  language: Language;
  inspectors: Inspector[];
  visits: VisitRecord[];
  areas: AreaData[];
  workers: Worker[];
}

const ReportingScreen: React.FC<Props> = ({ language, inspectors, visits, areas, workers }) => {
  const [isGenerating, setIsGenerating] = useState<string | null>(null);
  const isRtl = language === 'ar';

  const t = {
    en: {
      title: 'Management Reports',
      desc: 'High-level coverage analysis and field inspection documents.',
      export: 'Export Excel',
      print: 'Print Dashboard',
      cov: 'Weekly Coverage',
      comp: 'Visits Completed',
      overdue: 'Overdue Locs',
      activeIns: 'Active Inspectors',
      log: 'Recent Visit Log',
      loc: 'Location',
      ins: 'Inspector',
      var: 'Variance',
      date: 'Date',
      audit: 'Audit Trail',
      noVisits: 'No visits recorded yet.',
      prioOverdue: 'Overdue Priority Locations',
      actionReq: 'Action Required',
      never: 'NEVER VISITED',
      fieldSheets: 'Inspector Field Sheets',
      downloadPDF: 'Download PDF for Email',
      generating: 'Generating PDF...',
      sheetSubtitle: 'Download worker lists for site visits to send via email.',
      workerId: 'ID#',
      workerName: 'EMP Name',
      nationality: 'Nationality',
      company: 'Company',
      position: 'Position',
      signature: 'Signature/Sig',
      totalLocs: 'Total Locations',
      totalWrks: 'Total Workers',
      officialTitle: 'FIELD INSPECTION RECORD',
      reportDate: 'Report Date',
      footerText: 'البرنامج لإدارة الخدمات البيئية - ليلى العتيبي'
    },
    ar: {
      title: 'تقارير الإدارة',
      desc: 'تحليل مستوى التغطية ومستندات التفتيش الميداني.',
      export: 'تصدير إكسل',
      print: 'طباعة الملخص',
      cov: 'التغطية الأسبوعية',
      comp: 'الزيارات المكتملة',
      overdue: 'مواقع متأخرة',
      activeIns: 'المفتشين النشطين',
      log: 'سجل الزيارات الأخير',
      loc: 'الموقع',
      ins: 'المفتش',
      var: 'الانحراف',
      date: 'التاريخ',
      audit: 'سجل المراجعة',
      noVisits: 'لا توجد زيارات مسجلة بعد.',
      prioOverdue: 'مواقع متأخرة ذات أولوية',
      actionReq: 'مطلوب إجراء',
      never: 'لم تتم زيارته قط',
      fieldSheets: 'كشوف التفتيش الميداني',
      downloadPDF: 'تحميل ملف PDF للإرسال',
      generating: 'جاري إنتاج الملف...',
      sheetSubtitle: 'تحميل قائمة مفصلة بأسماء العمال لكل موقع لإرسالها للمفتش.',
      workerId: 'رقم الهوية',
      workerName: 'اسم الموظف',
      nationality: 'الجنسية',
      company: 'الشركة',
      position: 'المسمى الوظيفي',
      signature: 'التوقيع',
      totalLocs: 'إجمالي المواقع',
      totalWrks: 'إجمالي العمالة',
      officialTitle: 'سجل التفتيش الميداني المعتمد',
      reportDate: 'تاريخ التقرير',
      footerText: 'البرنامج لإدارة الخدمات البيئية - ليلى العتيبي'
    }
  }[language];

  const allLocations = areas.flatMap(a => a.locations);
  const totalLocations = allLocations.length;
  const visitedThisWeek = new Set(visits.filter(v => v.visited).map(v => v.locationId)).size;
  const coveragePercent = totalLocations > 0 ? Math.round((visitedThisWeek / totalLocations) * 100) : 0;
  
  const overdueLocations = allLocations.filter(loc => {
    const lastVisit = [...visits].reverse().find(v => v.locationId === loc.id);
    if (!lastVisit) return true;
    const daysSince = (new Date().getTime() - new Date(lastVisit.date).getTime()) / (1000 * 3600 * 24);
    return daysSince > 14;
  });

  const handleDownloadPDF = async (inspector: Inspector) => {
    setIsGenerating(inspector.Inspector_ID);
    
    const element = document.createElement('div');
    element.dir = isRtl ? 'rtl' : 'ltr';
    element.style.padding = '10px';
    element.className = 'pdf-container';

    const totalLocsCount = inspector.LocationQueue.length;
    const totalWrksCount = inspector.LocationQueue.reduce((acc, locId) => {
      const loc = allLocations.find(l => l.id === locId);
      return acc + (loc?.workerIds.length || 0);
    }, 0);
    
    let htmlContent = `
      <style>
        .pdf-container { font-family: 'Inter', sans-serif; color: #0f172a; }
        .official-header { border-bottom: 3px solid #1e293b; padding-bottom: 15px; margin-bottom: 25px; }
        .header-grid { display: flex; justify-content: space-between; align-items: flex-start; }
        .branding { flex: 1; }
        .report-title { flex: 1; text-align: center; }
        .report-meta { flex: 1; text-align: ${isRtl ? 'left' : 'right'}; font-size: 8pt; }
        
        .summary-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 12px; margin-bottom: 25px; display: flex; gap: 20px; }
        .summary-item { flex: 1; border-right: 1px solid #e2e8f0; }
        .summary-item:last-child { border-right: none; }
        .summary-label { font-size: 7pt; color: #64748b; font-weight: bold; text-transform: uppercase; margin-bottom: 2px; }
        .summary-value { font-size: 11pt; font-weight: 800; }

        .location-block { 
          page-break-inside: avoid; 
          margin-bottom: 30px; 
          border: 1px solid #cbd5e1; 
          border-radius: 4px; 
          overflow: hidden;
          break-inside: avoid;
        }
        .block-header { 
          background: #1e293b; 
          color: #fff; 
          padding: 8px 12px; 
          display: flex; 
          justify-content: space-between; 
          font-weight: 800; 
          font-size: 10pt;
        }
        .worker-table { width: 100%; border-collapse: collapse; }
        .worker-table th, .worker-table td { 
          border: 1px solid #e2e8f0; 
          padding: 6px 8px; 
          font-size: 8pt; 
          text-align: ${isRtl ? 'right' : 'left'}; 
        }
        .worker-table th { background: #f1f5f9; color: #475569; font-weight: 800; }
        .observations { 
          padding: 10px; 
          border-top: 1px solid #e2e8f0; 
          font-size: 8pt; 
          color: #64748b; 
          background: #fff;
        }
        .footer { 
          text-align: center; 
          font-size: 8pt; 
          color: #94a3b8; 
          margin-top: 20px; 
          padding-top: 10px; 
          border-top: 1px solid #f1f5f9; 
        }
      </style>

      <div class="official-header">
        <div class="header-grid">
          <div class="branding">
            <div style="font-weight: 900; font-size: 16pt; color: #4f46e5; line-height: 1.1;">SERVICES INSPECTOR</div>
            <div style="font-size: 8pt; color: #64748b; font-weight: 800; letter-spacing: 0.5px;">ENVIRONMENTAL SERVICES</div>
            <div style="font-size: 7pt; color: #94a3b8; font-weight: 500;">SUPPORT SERVICES DIVISION</div>
          </div>
          <div class="report-title">
            <h1 style="font-size: 14pt; margin: 0; font-weight: 800;">${t.officialTitle}</h1>
            <div style="font-size: 8.5pt; color: #475569; margin-top: 4px;">${t.sheetSubtitle}</div>
          </div>
          <div class="report-meta">
            <div style="font-weight: bold;">${t.reportDate}:</div>
            <div style="font-size: 9pt;">${new Date().toLocaleDateString()}</div>
          </div>
        </div>
      </div>

      <div class="summary-box">
        <div class="summary-item">
          <div class="summary-label">${t.ins}</div>
          <div class="summary-value">${inspector.Inspector_Name}</div>
        </div>
        <div class="summary-item">
          <div class="summary-label">${t.totalLocs}</div>
          <div class="summary-value" style="color: #4f46e5;">${totalLocsCount}</div>
        </div>
        <div class="summary-item">
          <div class="summary-label">${t.totalWrks}</div>
          <div class="summary-value" style="color: #059669;">${totalWrksCount}</div>
        </div>
      </div>

      <div class="content-body">
    `;

    for (const locId of inspector.LocationQueue) {
      const loc = allLocations.find(l => l.id === locId);
      if (!loc) continue;
      
      htmlContent += `
        <div class="location-block">
          <div class="block-header">
             <div><span style="opacity: 0.7; font-weight: normal;">${t.loc}:</span> ${loc.name}</div>
             <div>${isRtl ? 'المنطقة' : 'Area'}: ${loc.area}</div>
          </div>
          
          <table class="worker-table">
            <thead>
              <tr>
                <th style="width: 30px; text-align: center;">#</th>
                <th style="width: 80px;">${t.workerId}</th>
                <th>${t.workerName}</th>
                <th>${t.nationality}</th>
                <th>${t.company}</th>
                <th style="width: 80px; text-align: center;">${t.signature}</th>
              </tr>
            </thead>
            <tbody>
      `;

      loc.workerIds.forEach((wid, idx) => {
        const worker = workers.find(w => w.Worker_ID === wid);
        htmlContent += `
          <tr>
            <td style="text-align: center; color: #94a3b8;">${idx + 1}</td>
            <td style="font-weight: 800;">${wid}</td>
            <td style="font-weight: 800;">${worker?.Worker_Name || ''}</td>
            <td>${worker?.Nationality || '-'}</td>
            <td>${worker?.Company || '-'}</td>
            <td style="background: #fafafa;"></td>
          </tr>
        `;
      });

      htmlContent += `
            </tbody>
          </table>
          <div class="observations">
            ${isRtl ? 'ملاحظات المعاينة الميدانية:' : 'Field Observations:'} _________________________________________________________________________
          </div>
        </div>
      `;
    }

    htmlContent += `
      </div>
      <div class="footer">
        ${t.footerText} • ${new Date().getFullYear()}
      </div>
    `;
    
    element.innerHTML = htmlContent;

    const opt = {
      margin: [15, 12, 15, 12],
      filename: `Report_${inspector.Inspector_Name.replace(/\s+/g, '_')}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { 
        scale: 2, 
        useCORS: true, 
        letterRendering: true,
        logging: false
      },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      pagebreak: { 
        mode: ['avoid-all', 'css', 'legacy'],
        before: '.location-block' 
      }
    };

    try {
      // @ts-ignore
      await html2pdf().set(opt).from(element).save();
    } catch (error) {
      console.error("PDF Generation failed:", error);
    } finally {
      setIsGenerating(null);
    }
  };

  const exportToExcel = () => {
    const data = visits.map(v => {
      const loc = allLocations.find(l => l.id === v.locationId);
      const ins = inspectors.find(i => i.Inspector_ID === v.inspectorId);
      return {
        'Date': new Date(v.date).toLocaleDateString(),
        'Inspector': ins?.Inspector_Name || 'Unknown',
        'Area': loc?.area || 'Unknown',
        'Location': loc?.name || 'Unknown',
        'Expected Workers': loc?.workerIds.length || 0,
        'Actual Workers': v.actualCount || 0,
        'Status': v.visited ? 'Visited' : 'Unvisited',
        'Notes': v.notes || ''
      };
    });
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Visits");
    XLSX.writeFile(wb, `OpsCheck_Report_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <div className="space-y-8">
      <header className="no-print flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className={isRtl ? 'text-right' : 'text-left'}>
          <h2 className="text-3xl font-bold text-slate-900">{t.title}</h2>
          <p className="text-slate-500 mt-1">{t.desc}</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={exportToExcel} className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 rounded-lg text-slate-700 font-bold hover:bg-slate-50 transition-colors">
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" /> 
            {t.export}
          </button>
          <button onClick={() => window.print()} className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white rounded-lg font-bold hover:bg-slate-800 transition-colors">
            <Printer className="w-4 h-4" /> 
            {t.print}
          </button>
        </div>
      </header>

      <div className="no-print grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard title={t.cov} value={`${coveragePercent}%`} icon={TrendingUp} color="indigo" />
        <StatCard title={t.comp} value={visits.filter(v => v.visited).length} icon={CheckCircle2} color="emerald" />
        <StatCard title={t.overdue} value={overdueLocations.length} icon={AlertCircle} color="amber" />
        <StatCard title={t.activeIns} value={inspectors.length} icon={Clock} color="slate" />
      </div>

      <div className="no-print grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
          <div className="p-6 border-b border-slate-100 bg-indigo-50/30">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-bold text-slate-800 text-lg">{t.fieldSheets}</h4>
                <p className="text-sm text-slate-500">{t.sheetSubtitle}</p>
              </div>
              <div className="w-12 h-12 bg-indigo-600 rounded-full flex items-center justify-center text-white shadow-lg shadow-indigo-200">
                <Download className="w-6 h-6" />
              </div>
            </div>
          </div>
          <div className="p-2 space-y-1">
            {inspectors.map(ins => (
              <div key={ins.Inspector_ID} className="flex items-center justify-between p-4 hover:bg-slate-50 rounded-xl transition-all group">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full border-2 border-white shadow-sm flex items-center justify-center font-bold text-white text-xs" style={{backgroundColor: ins.Color}}>
                    {ins.Inspector_Name.charAt(0)}
                  </div>
                  <div className={isRtl ? 'text-right' : 'text-left'}>
                    <h5 className="font-bold text-slate-800">{ins.Inspector_Name}</h5>
                    <p className="text-xs text-slate-500">{ins.LocationQueue.length} {t.loc} • {TRANSLATIONS[language][ins.PreferredDay]}</p>
                  </div>
                </div>
                <button 
                  disabled={isGenerating !== null}
                  onClick={() => handleDownloadPDF(ins)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all shadow-sm
                    ${isGenerating === ins.Inspector_ID 
                      ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
                      : 'bg-white border border-indigo-200 text-indigo-700 hover:bg-indigo-600 hover:text-white'}`}
                >
                  {isGenerating === ins.Inspector_ID ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Download className="w-4 h-4" />
                  )}
                  {isGenerating === ins.Inspector_ID ? t.generating : t.downloadPDF}
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm flex flex-col">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-amber-50/50">
            <div className="flex items-center gap-2 text-amber-600">
              <AlertCircle className="w-5 h-5" />
              <h4 className="font-bold text-amber-900">{t.prioOverdue}</h4>
            </div>
            <span className="text-[10px] font-bold text-amber-600 uppercase tracking-widest">{t.actionReq}</span>
          </div>
          <div className="flex-1 p-4 space-y-3 overflow-y-auto max-h-[400px]">
            {overdueLocations.map(loc => {
              const lastVisit = [...visits].reverse().find(v => v.locationId === loc.id);
              return (
                <div key={loc.id} className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                  <div className={isRtl ? 'text-right' : 'text-left'}>
                    <h5 className="font-bold text-slate-800">{loc.name}</h5>
                    <p className="text-[10px] text-slate-500 font-bold uppercase">{loc.area}</p>
                  </div>
                  <div className={isRtl ? 'text-left' : 'text-right'}>
                    <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">{t.date}</p>
                    <p className="text-xs font-black text-amber-600">{lastVisit ? new Date(lastVisit.date).toLocaleDateString() : t.never}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="no-print bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <h4 className="font-bold text-slate-800">{t.log}</h4>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t.audit}</span>
        </div>
        <div className="overflow-x-auto">
          <table className={`w-full text-sm ${isRtl ? 'text-right' : 'text-left'}`}>
            <thead className="bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              <tr>
                <th className="px-6 py-3">{t.loc}</th>
                <th className="px-6 py-3">{t.ins}</th>
                <th className="px-6 py-3 text-center">{t.var}</th>
                <th className="px-6 py-3 text-right">{t.date}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {visits.length === 0 ? (
                <tr><td colSpan={4} className="py-20 text-center text-slate-400">{t.noVisits}</td></tr>
              ) : (
                [...visits].reverse().map(v => {
                  const loc = allLocations.find(l => l.id === v.locationId);
                  const ins = inspectors.find(i => i.Inspector_ID === v.inspectorId);
                  const variance = (v.actualCount || 0) - (loc?.workerIds.length || 0);
                  return (
                    <tr key={v.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4">
                        <p className="font-bold text-slate-800">{loc?.name}</p>
                        <p className="text-[10px] text-slate-400 uppercase">{loc?.area}</p>
                      </td>
                      <td className="px-6 py-4">{ins?.Inspector_Name}</td>
                      <td className="px-6 py-4 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-black ${variance === 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                          {variance > 0 ? `+${variance}` : variance}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right text-slate-400">{new Date(v.date).toLocaleDateString()}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, icon: Icon, color }: any) => (
  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
    <div className={`w-10 h-10 bg-${color}-50 text-${color}-600 rounded-lg flex items-center justify-center mb-4`}>
      <Icon className="w-6 h-6" />
    </div>
    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">{title}</p>
    <h3 className="text-4xl font-black text-slate-900">{value}</h3>
  </div>
);

export default ReportingScreen;
