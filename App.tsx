
import React, { useState, useCallback } from 'react';
import { Status } from './types';
import { extractInvoiceData } from './services/geminiService';
import FileUpload from './components/FileUpload';
import ResultDisplay from './components/ResultDisplay';
import { DocumentIcon, SparklesIcon } from './components/Icons';

const App: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [csvData, setCsvData] = useState<string>('');
  const [status, setStatus] = useState<Status>(Status.Idle);
  const [error, setError] = useState<string>('');

  const handleFileChange = useCallback((selectedFile: File | null) => {
    setFile(selectedFile);
    setCsvData('');
    setError('');
    setStatus(Status.Idle);
  }, []);

  const handleExtract = useCallback(async () => {
    if (!file) {
      setError('Please select an invoice file first.');
      setStatus(Status.Error);
      return;
    }
    setStatus(Status.Processing);
    setError('');
    setCsvData('');
    try {
      const result = await extractInvoiceData(file);
      if (!result) {
        throw new Error("The API returned an empty response.");
      }
      setCsvData(result);
      setStatus(Status.Success);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      console.error('Extraction failed:', errorMessage);
      setError(`Failed to extract data. ${errorMessage}. Please try again.`);
      setStatus(Status.Error);
    }
  }, [file]);
  
  const handleCsvDataChange = useCallback((newCsvData: string) => {
    setCsvData(newCsvData);
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800">
      <main className="container mx-auto px-4 py-8 md:py-12">
        <header className="text-center mb-10">
          <div className="inline-flex items-center justify-center bg-blue-100 text-blue-600 rounded-full p-3 mb-4 shadow-sm">
             <DocumentIcon className="h-8 w-8" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 tracking-tight">
            GST Invoice Extractor
          </h1>
          <p className="mt-3 text-lg text-slate-600 max-w-2xl mx-auto">
            Upload an invoice image to automatically extract details into a structured CSV format using AI.
          </p>
        </header>

        <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-lg border border-slate-200 p-6 md:p-8">
          <FileUpload onFileChange={handleFileChange} />
          
          <div className="mt-6 text-center">
            <button
              onClick={handleExtract}
              disabled={!file || status === Status.Processing}
              className="inline-flex items-center justify-center px-8 py-3 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 disabled:bg-slate-400 disabled:cursor-not-allowed transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <SparklesIcon className="h-5 w-5 mr-2" />
              {status === Status.Processing ? 'Extracting Data...' : 'Extract Data'}
            </button>
          </div>
        </div>

        <ResultDisplay status={status} csvData={csvData} error={error} onCsvDataChange={handleCsvDataChange} />
      </main>
      <footer className="text-center py-6 text-sm text-slate-500">
        <p>&copy; {new Date().getFullYear()} GST Invoice Extractor. Powered by Gemini.</p>
      </footer>
    </div>
  );
};

export default App;
