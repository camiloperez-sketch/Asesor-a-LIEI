import React, { useState, useRef } from 'react';
import { analyzeTranscript, AnalysisInput } from './services/geminiService';
import { processStudentData } from './utils/logic';
import { AnalysisResult } from './types';
import CourseList from './components/CourseList';
import Report from './components/Report';
import html2pdf from 'html2pdf.js';

interface BatchItem {
  id: number;
  file: { data: string, name: string } | null;
  status: 'idle' | 'analyzing' | 'success' | 'error';
  data: AnalysisResult | null;
  error: string | null;
}

const App: React.FC = () => {
  // Initialize 10 slots
  const [items, setItems] = useState<BatchItem[]>(
    Array.from({ length: 10 }, (_, i) => ({
      id: i,
      file: null,
      status: 'idle',
      data: null,
      error: null
    }))
  );

  const [previewItem, setPreviewItem] = useState<BatchItem | null>(null);

  const handleFileChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Validar PDF
    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    if (!isPdf) {
      updateItem(index, { error: "Archivo no válido (solo PDF)" });
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      const base64Data = base64String.split(',')[1];
      
      updateItem(index, { 
        file: { data: base64Data, name: file.name },
        status: 'idle',
        error: null,
        data: null
      });
    };
    reader.readAsDataURL(file);
  };

  const updateItem = (index: number, updates: Partial<BatchItem>) => {
    setItems(prev => prev.map(item => item.id === index ? { ...item, ...updates } : item));
  };

  const handleAnalyze = async (index: number) => {
    const item = items[index];
    if (!item.file) return;

    updateItem(index, { status: 'analyzing', error: null });

    try {
      const files: AnalysisInput[] = [{ mimeType: 'application/pdf', data: item.file.data }];
      const extractedData = await analyzeTranscript(files);
      const processed = processStudentData(extractedData.courses, extractedData.studentName, extractedData.studentId);
      
      updateItem(index, { status: 'success', data: processed });
    } catch (err) {
      console.error(err);
      updateItem(index, { status: 'error', error: "Error al analizar" });
    }
  };

  const handleDownloadPDF = (index: number) => {
    const item = items[index];
    if (!item.data) return;

    const elementId = `hidden-report-${index}`;
    const element = document.getElementById(elementId);
    
    if (!element) {
      alert("Error: Reporte no generado en DOM.");
      return;
    }

    const opt = {
      margin:       [0.3, 0.3, 0.3, 0.3],
      filename:     `Reporte_Transicion_${item.data.progress.studentId || 'UNAD'}.pdf`,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2, useCORS: true },
      jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' },
      pagebreak:    { mode: ['avoid-all', 'css', 'legacy'] }
    };

    // @ts-ignore
    html2pdf().set(opt).from(element).save();
  };

  const UploadIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
    </svg>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans text-gray-800">
      {/* Header */}
      <header className="bg-unad-blue text-white shadow-md sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 bg-unad-orange rounded-full flex items-center justify-center font-bold text-xl text-white">UN</div>
             <div>
               <h1 className="text-xl font-bold leading-tight">Asesor de Transición UNAD</h1>
               <p className="text-xs text-unad-light opacity-80">Procesamiento por Lotes (10 Slots)</p>
             </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-100 bg-gray-50">
             <h2 className="text-xl font-bold text-gray-800">Panel de Carga Masiva</h2>
             <p className="text-sm text-gray-500">Suba hasta 10 Registros Académicos Individuales (PDF) para generar reportes simultáneamente.</p>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-gray-100 text-gray-600 uppercase font-bold">
                <tr>
                  <th className="px-6 py-4 w-16 text-center">#</th>
                  <th className="px-6 py-4">Registro Académico (PDF)</th>
                  <th className="px-6 py-4 w-32 text-center">Estado</th>
                  <th className="px-6 py-4 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {items.map((item, idx) => (
                  <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-center font-bold text-gray-400">{idx + 1}</td>
                    
                    {/* File Upload / Name */}
                    <td className="px-6 py-4">
                      {item.file ? (
                        <div className="flex items-center justify-between bg-blue-50 text-blue-800 px-3 py-2 rounded border border-blue-100">
                          <span className="font-medium truncate max-w-xs" title={item.file.name}>{item.file.name}</span>
                          <button 
                             onClick={() => updateItem(idx, { file: null, status: 'idle', data: null, error: null })}
                             className="text-blue-400 hover:text-red-500 ml-2"
                             title="Quitar archivo"
                          >
                            ✕
                          </button>
                        </div>
                      ) : (
                        <div className="relative group w-full">
                          <label className="flex items-center justify-center w-full px-4 py-2 border-2 border-dashed border-gray-300 rounded cursor-pointer hover:border-unad-blue hover:bg-blue-50 transition">
                            <UploadIcon />
                            <span className="ml-2 font-medium text-gray-500 group-hover:text-unad-blue">Subir PDF</span>
                            <input type="file" accept=".pdf" className="hidden" onChange={(e) => handleFileChange(idx, e)} />
                          </label>
                        </div>
                      )}
                      {item.error && <p className="text-xs text-red-500 mt-1">{item.error}</p>}
                    </td>

                    {/* Status */}
                    <td className="px-6 py-4 text-center">
                      {item.status === 'idle' && <span className="text-gray-400">-</span>}
                      {item.status === 'analyzing' && <span className="text-unad-blue font-bold animate-pulse">Analizando...</span>}
                      {item.status === 'success' && <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-bold">Completado</span>}
                      {item.status === 'error' && <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-xs font-bold">Error</span>}
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        {/* Analyze Button */}
                        <button
                          onClick={() => handleAnalyze(idx)}
                          disabled={!item.file || item.status === 'analyzing' || item.status === 'success'}
                          className={`px-3 py-1.5 rounded text-xs font-bold transition
                             ${!item.file || item.status === 'analyzing' || item.status === 'success' 
                               ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
                               : 'bg-unad-blue text-white hover:bg-blue-800'}
                          `}
                        >
                          Analizar
                        </button>

                        {/* Preview Button */}
                        <button
                          onClick={() => setPreviewItem(item)}
                          disabled={item.status !== 'success'}
                          className={`px-3 py-1.5 rounded text-xs font-bold transition border
                             ${item.status !== 'success'
                               ? 'border-gray-200 text-gray-300 cursor-not-allowed'
                               : 'border-gray-300 text-gray-700 hover:bg-gray-100'}
                          `}
                        >
                          Ver
                        </button>

                         {/* Download Button */}
                         <button
                          onClick={() => handleDownloadPDF(idx)}
                          disabled={item.status !== 'success'}
                          className={`px-3 py-1.5 rounded text-xs font-bold transition flex items-center gap-1
                             ${item.status !== 'success'
                               ? 'bg-gray-100 text-gray-300 cursor-not-allowed'
                               : 'bg-green-600 text-white hover:bg-green-700'}
                          `}
                        >
                          PDF
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Hidden Reports Container for PDF Generation */}
      {/* These are rendered off-screen but strictly accessible by ID for html2pdf */}
      <div style={{ position: 'absolute', top: 0, left: '-9999px', width: '900px' }}>
        {items.map(item => (
          item.status === 'success' && item.data ? (
            <div key={`hidden-${item.id}`} id={`hidden-report-${item.id}`}>
               <Report 
                 progress={item.data.progress} 
                 suggestions={item.data.suggestions} 
                 gratuidadBundle={item.data.gratuidadBundle}
                 containerId={`report-content-${item.id}`} // not strictly used by hidden, but good for props
               />
            </div>
          ) : null
        ))}
      </div>

      {/* Preview Modal */}
      {previewItem && previewItem.data && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-5xl max-h-[90vh] overflow-y-auto relative shadow-2xl">
             <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center z-10">
               <h3 className="font-bold text-lg text-gray-800">Vista Previa - Slot #{previewItem.id + 1}</h3>
               <button onClick={() => setPreviewItem(null)} className="text-gray-500 hover:text-red-500 text-2xl font-bold">&times;</button>
             </div>
             <div className="p-6">
                <Report 
                  progress={previewItem.data.progress} 
                  suggestions={previewItem.data.suggestions} 
                  gratuidadBundle={previewItem.data.gratuidadBundle}
                  containerId={`preview-report-${previewItem.id}`}
                />
             </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default App;