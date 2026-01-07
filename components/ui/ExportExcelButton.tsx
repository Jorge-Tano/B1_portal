// components/ui/ExportExcelButton.tsx
'use client'

import React, { useState } from 'react';

export default function ExportExcelButton() {
  const [loading, setLoading] = useState(false);

  const handleExport = async () => {
    if (loading) return;
    
    setLoading(true);

    try {
      const response = await fetch('/encargado/api/excel?tipo=plantilla');
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Error ${response.status}: ${response.statusText} - ${errorText.substring(0, 100)}`);
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `FORMATOPAB_${new Date().toLocaleDateString('es-CO').replace(/\//g, '-')}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      alert('✅ Archivo FORMATOPAB generado exitosamente');
      
    } catch (err: any) {
      console.error('Error exportando:', err);
      alert(`❌ Error: ${err.message || 'Error al generar el archivo'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleExport}
      disabled={loading}
      className="px-4 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium hover:opacity-90 disabled:opacity-50 transition-opacity flex items-center gap-2"
    >
      {loading ? (
        <>
          <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
          Generando...
        </>
      ) : (
        <>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Descargar FORMATOPAB
        </>
      )}
    </button>
  );
}