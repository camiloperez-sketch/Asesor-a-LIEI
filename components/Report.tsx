import React from 'react';
import { StudentProgress, Suggestion } from '../types';
import html2pdf from 'html2pdf.js';

interface ReportProps {
  progress: StudentProgress;
  suggestions: Suggestion[];
  gratuidadBundle: Suggestion[];
  containerId?: string; // Prop for unique identification in batch mode
}

const SuggestionTable: React.FC<{ suggestions: Suggestion[] }> = ({ suggestions }) => {
  if (suggestions.length === 0) {
    return <p className="text-gray-500 italic border border-gray-200 rounded p-4 bg-gray-50">No hay cursos sugeridos para este criterio.</p>;
  }

  return (
    <div className="overflow-hidden border border-gray-200 rounded-lg mb-6 shadow-sm">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th scope="col" className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider border-b">Prioridad</th>
            <th scope="col" className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider border-b">Código</th>
            <th scope="col" className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider border-b">Curso</th>
            <th scope="col" className="px-4 py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider border-b">Créditos</th>
            <th scope="col" className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider border-b">Justificación</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {suggestions.map((s, idx) => (
            <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
              <td className="px-4 py-3 text-sm">
                <span className={`px-2 py-1 rounded text-xs font-bold ${
                  s.priority === 'ALTA' ? 'bg-red-100 text-red-800' : 
                  s.priority === 'MEDIA' ? 'bg-yellow-100 text-yellow-800' : 
                  'bg-green-100 text-green-800'
                }`}>
                  {s.priority}
                </span>
              </td>
              <td className="px-4 py-3 text-sm text-gray-900 font-mono">{s.course.code}</td>
              <td className="px-4 py-3 text-sm text-gray-900 font-medium">{s.course.name}</td>
              <td className="px-4 py-3 text-sm text-gray-900 text-center font-bold">{s.course.credits}</td>
              <td className="px-4 py-3 text-xs text-gray-500 italic">{s.justification}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const Report: React.FC<ReportProps> = ({ progress, suggestions, gratuidadBundle, containerId = 'printable-report' }) => {
  const totalSuggested = suggestions.reduce((acc, s) => acc + s.course.credits, 0);
  const totalGratuidad = gratuidadBundle.reduce((acc, s) => acc + s.course.credits, 0);

  const handlePrint = () => {
    const element = document.getElementById(containerId);
    if (!element) return;
    
    const opt = {
      margin:       [0.3, 0.3, 0.3, 0.3],
      filename:     `Reporte_Transicion_${progress.studentId || 'UNAD'}.pdf`,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2, useCORS: true },
      jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' },
      pagebreak:    { mode: ['avoid-all', 'css', 'legacy'] }
    };

    // @ts-ignore
    html2pdf().set(opt).from(element).save();
  };

  return (
    <div className="flex flex-col h-full">
       {/* Toolbar - Only visible if it's the main view, usually hidden in batch hidden rendering */}
       <div className="mb-4 flex justify-end no-print">
        <button
          onClick={handlePrint}
          className="px-4 py-2 bg-unad-blue text-white rounded hover:bg-blue-800 transition font-bold flex items-center gap-2 shadow-sm"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
          </svg>
          Descargar PDF
        </button>
      </div>

      {/* Report Content */}
      <div id={containerId} className="bg-white p-8 border rounded-lg shadow-sm max-w-4xl mx-auto w-full">
        
        {/* Header */}
        <div className="border-b-2 border-unad-blue pb-4 mb-6">
          <div className="flex justify-between items-start">
            <div>
                <h1 className="text-2xl font-bold text-unad-blue uppercase tracking-tight">Asesoría Académica y Sugerencia de Matrícula</h1>
                <p className="text-sm text-gray-500">Licenciatura en Educación Infantil (Resolución 10239)</p>
            </div>
            <div className="text-right">
                <div className="w-12 h-12 bg-unad-orange text-white font-bold rounded-full flex items-center justify-center text-xl ml-auto">UN</div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 text-sm bg-gray-50 p-3 rounded border border-gray-100">
            <div><span className="font-bold text-gray-700 block">Estudiante:</span> {progress.studentName || 'No detectado'}</div>
            <div><span className="font-bold text-gray-700 block">Documento:</span> {progress.studentId || 'No detectado'}</div>
            <div><span className="font-bold text-gray-700 block">Fecha Análisis:</span> {new Date().toLocaleDateString()}</div>
          </div>
        </div>

        {/* Section 1: Status */}
        <div className="mb-8">
          <h2 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
            <span className="w-1 h-6 bg-unad-orange rounded-full"></span>
            1. ESTADO ACADÉMICO (Plan Nuevo - 156 Créditos)
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-white border border-gray-200 p-4 rounded-lg shadow-sm">
            <div className="text-center p-2">
               <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Aprobados</p>
               <p className="text-2xl font-extrabold text-green-600">{progress.approvedCredits}</p>
            </div>
            <div className="text-center p-2 border-l border-gray-100">
               <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">En Curso</p>
               <p className="text-2xl font-extrabold text-blue-600">{progress.history.filter(c => c.state === 'EN_CURSO').length} <span className="text-sm font-normal text-gray-400">materias</span></p>
            </div>
            <div className="text-center p-2 border-l border-gray-100">
               <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Pendientes</p>
               <p className="text-2xl font-extrabold text-orange-600">{progress.pendingCredits}</p>
            </div>
            <div className="text-center p-2 border-l border-gray-100">
               <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Avance</p>
               <p className="text-2xl font-extrabold text-unad-blue">{progress.percentage.toFixed(1)}%</p>
            </div>
          </div>
        </div>

        {/* Section 2: Main Suggestions */}
        <div className="mb-8 page-break-inside-avoid">
          <div className="flex justify-between items-end mb-3">
            <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <span className="w-1 h-6 bg-unad-blue rounded-full"></span>
                2. SUGERENCIA DE MATRÍCULA (Próximo Periodo)
            </h2>
            <span className="text-xs font-bold bg-blue-50 text-unad-blue px-2 py-1 rounded border border-blue-100">
                Total: {totalSuggested} Créditos
            </span>
          </div>
          
          <div className="bg-blue-50 border border-blue-100 rounded p-3 mb-4 text-sm text-blue-900 flex gap-2 items-start">
             <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 flex-shrink-0 mt-0.5">
               <path fillRule="evenodd" d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Zm-7-4a1 1 0 1 1-2 0 1 1 0 0 1 2 0ZM9 9a.75.75 0 0 0 0 1.5h.253a.25.25 0 0 1 .244.304l-.459 2.066A1.75 1.75 0 0 0 10.747 15H11a.75.75 0 0 0 0-1.5h-.253a.25.25 0 0 1-.244-.304l.459-2.066A1.75 1.75 0 0 0 9.253 9H9Z" clipRule="evenodd" />
             </svg>
             <p>Esta sugerencia asume que los cursos que se encuentran actualmente <strong>EN CURSO</strong> serán aprobados. Si reprueba alguno, la sugerencia podría variar.</p>
          </div>
          
          <SuggestionTable suggestions={suggestions} />
        </div>

        {/* Section 3: Gratuidad */}
        <div className="mb-8 page-break-inside-avoid">
          <h2 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
            <span className="w-1 h-6 bg-unad-yellow rounded-full"></span>
            3. INFORMACIÓN PARA ESTUDIANTES DE GRATUIDAD
          </h2>
          
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-5 text-sm text-yellow-900 flex gap-3">
             <div className="flex-shrink-0 pt-1">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-yellow-600">
                    <path fillRule="evenodd" d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Zm-7-4a1 1 0 1 1-2 0 1 1 0 0 1 2 0ZM9 9a.75.75 0 0 0 0 1.5h.253a.25.25 0 0 1 .244.304l-.459 2.066A1.75 1.75 0 0 0 10.747 15H11a.75.75 0 0 0 0-1.5h-.253a.25.25 0 0 1-.244-.304l.459-2.066A1.75 1.75 0 0 0 9.253 9H9Z" clipRule="evenodd" />
                </svg>
             </div>
             <div>
                <p className="font-bold mb-1">Beneficiarios de Política de Gratuidad, Generación E o Matrícula Cero:</p>
                <p>
                  El beneficio cubre un máximo de <strong>14 créditos académicos</strong>. Si usted decide matricular la carga completa sugerida arriba ({totalSuggested} créditos), 
                  deberá pagar los créditos adicionales con recursos propios.
                </p>
             </div>
          </div>

          <div className="flex justify-between items-end mb-2">
            <p className="text-sm font-bold text-gray-700 pl-1">Carga sugerida exclusiva para Gratuidad:</p>
            <span className="text-xs font-bold bg-yellow-50 text-yellow-800 px-2 py-1 rounded border border-yellow-100">
                Total: {totalGratuidad} Créditos
            </span>
          </div>
          <SuggestionTable suggestions={gratuidadBundle} />
        </div>

        {/* Section 4: Notes */}
        <div className="text-xs text-gray-500 border-t border-gray-200 pt-4 mt-8">
          <h3 className="font-bold text-gray-700 mb-2 uppercase tracking-wider">Notas del Asesor</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <ul className="list-disc list-inside space-y-1">
                <li><strong>Transición:</strong> Proyección basada en el Acuerdo 038.</li>
                <li><strong>En Curso:</strong> Las materias matriculadas actualmente no se sugieren.</li>
              </ul>
              <ul className="list-disc list-inside space-y-1">
                <li><strong>Prácticas:</strong> Verifique cumplimiento de prerrequisitos antes de matricular.</li>
                <li><strong>Electivos:</strong> Asegure cumplir con los créditos de cada tipología.</li>
              </ul>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Report;