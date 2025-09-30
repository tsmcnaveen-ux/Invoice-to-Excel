
import React, { useState, useMemo, useEffect } from 'react';
import { Status } from '../types';
import Spinner from './Spinner';
import { CheckIcon, ClipboardIcon, DownloadIcon, AlertTriangleIcon } from './Icons';
import EditableCell from './EditableCell';

interface ResultDisplayProps {
  status: Status;
  csvData: string;
  error: string;
  onCsvDataChange: (newCsvData: string) => void;
}

/**
 * A robust CSV line parser that correctly handles quoted fields.
 * This prevents errors when a field value itself contains a comma.
 * @param line A single line from a CSV file.
 * @returns An array of strings representing the cells in the row.
 */
const parseCsvLine = (line: string): string[] => {
  const cells: string[] = [];
  let inQuote = false;
  let cell = '';
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (inQuote) {
      if (char === '"') {
        // Check for an escaped quote ("")
        if (i + 1 < line.length && line[i + 1] === '"') {
          cell += '"';
          i++; // Skip the next quote
        } else {
          // End of quoted section
          inQuote = false;
        }
      } else {
        cell += char;
      }
    } else {
      if (char === '"') {
        inQuote = true;
      } else if (char === ',') {
        cells.push(cell);
        cell = '';
      } else {
        cell += char;
      }
    }
  }
  cells.push(cell);
  return cells;
};


const ResultDisplay: React.FC<ResultDisplayProps> = ({ status, csvData, error, onCsvDataChange }) => {
  const [copied, setCopied] = useState(false);
  const [tableHeader, setTableHeader] = useState<string[]>([]);
  const [tableRows, setTableRows] = useState<string[][]>([]);

  useEffect(() => {
    if (!csvData) {
      setTableHeader([]);
      setTableRows([]);
      return;
    }

    const lines = csvData.trim().split('\n');
    if (lines.length === 0 || lines[0].trim() === '') {
      setTableHeader([]);
      setTableRows([]);
      return;
    }

    const header = lines[0].split(',');
    const headerLength = header.length;

    const rows = lines.slice(1)
      .filter(line => line.trim() !== '')
      .map(line => {
        const parsedRow = parseCsvLine(line);
        // Ensure row length matches header length to prevent render errors
        if (parsedRow.length > headerLength) {
          return parsedRow.slice(0, headerLength); // Truncate
        }
        while (parsedRow.length < headerLength) {
          parsedRow.push(''); // Pad
        }
        return parsedRow;
      });
    
    setTableHeader(header);
    setTableRows(rows);
  }, [csvData]);


  const handleCellSave = (rowIndex: number, colIndex: number, newValue: string) => {
    const updatedRows = tableRows.map((row, rIdx) => {
        if (rIdx === rowIndex) {
            return row.map((cell, cIdx) => (cIdx === colIndex ? newValue : cell));
        }
        return row;
    });
    setTableRows(updatedRows);

    // Reconstruct CSV and notify parent
    const updatedCsvData = [
      tableHeader.join(','),
      ...updatedRows.map(row => {
        // Handle quotes for cells containing commas
        return row.map(cell => (cell.includes(',') ? `"${cell}"` : cell)).join(',');
      })
    ].join('\n');
    onCsvDataChange(updatedCsvData);
  };

  const totals = useMemo(() => {
    if (!tableHeader.length || !tableRows.length) return null;

    const columnsToSum = [
      'Quantity',
      'Taxable Amount',
      'SGST',
      'CGST',
      'IGST Amount',
      'Total Amount'
    ];

    const indicesToSum = new Map<string, number>(
      columnsToSum.map(colName => [colName, tableHeader.findIndex(h => h.trim() === colName)])
    );

    const initialTotals: { [key: string]: number } = Object.fromEntries(columnsToSum.map(name => [name, 0]));

    return tableRows.reduce((acc, row) => {
      for (const [colName, colIndex] of indicesToSum.entries()) {
        if (colIndex !== -1 && row[colIndex]) {
          const value = parseFloat(row[colIndex]);
          if (!isNaN(value)) {
            acc[colName] += value;
          }
        }
      }
      return acc;
    }, initialTotals);
  }, [tableHeader, tableRows]);

  const handleCopy = () => {
    navigator.clipboard.writeText(csvData);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.href) {
      URL.revokeObjectURL(link.href);
    }
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.setAttribute('download', 'invoice_data.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (status === Status.Idle) {
    return null;
  }

  return (
    <div className="mt-10">
      {status === Status.Processing && (
        <div className="flex flex-col items-center justify-center p-8 bg-white rounded-xl shadow-lg border border-slate-200">
          <Spinner />
          <p className="mt-4 text-lg font-semibold text-slate-700">Analyzing your invoice...</p>
          <p className="text-slate-500">This may take a few moments.</p>
        </div>
      )}

      {status === Status.Error && (
        <div className="p-6 bg-red-50 border-l-4 border-red-500 rounded-r-lg text-red-800 shadow-md">
           <div className="flex">
            <div className="py-1"><AlertTriangleIcon className="h-6 w-6 text-red-500 mr-3"/></div>
            <div>
              <p className="font-bold">Extraction Failed</p>
              <p className="text-sm">{error}</p>
            </div>
           </div>
        </div>
      )}

      {status === Status.Success && csvData && (
        <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
          <div className="p-4 sm:p-6 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-xl font-bold text-slate-800">Extracted Data</h2>
              <p className="text-sm text-slate-500 mt-1">Review and edit the extracted information below. Click any cell to modify its value.</p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={handleCopy}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors"
              >
                {copied ? <CheckIcon className="h-5 w-5 text-green-500" /> : <ClipboardIcon className="h-5 w-5" />}
                {copied ? 'Copied!' : 'Copy CSV'}
              </button>
              <button
                onClick={handleDownload}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
              >
                <DownloadIcon className="h-5 w-5" />
                Download
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  {tableHeader.map((col, index) => (
                    <th
                      key={index}
                      scope="col"
                      className={`py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider ${
                        col.toLowerCase() === 'sr. no.' ? 'px-4 text-center w-16' : 'px-6'
                      }`}
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {tableRows.map((row, rowIndex) => (
                  <tr key={rowIndex} className="hover:bg-slate-50">
                    {row.map((cell, cellIndex) => (
                      <EditableCell
                        key={cellIndex}
                        initialValue={cell}
                        onSave={(newValue) => handleCellSave(rowIndex, cellIndex, newValue)}
                        className={`py-4 whitespace-nowrap text-slate-700 ${
                          tableHeader[cellIndex]?.toLowerCase() === 'sr. no.' ? 'px-4 text-center font-medium text-slate-500' : 'px-6'
                        }`}
                      />
                    ))}
                  </tr>
                ))}
              </tbody>
              {totals && (
                <tfoot className="bg-slate-100 border-t-2 border-slate-300">
                  <tr>
                    {(() => {
                      const firstTotalColIndex = tableHeader.findIndex(h => totals.hasOwnProperty(h.trim()));
                      return tableHeader.map((col, index) => {
                        const colName = col.trim();
                        const totalValue = totals[colName];

                        if (index === firstTotalColIndex - 1) {
                          return <td key={index} className="px-6 py-3 text-right font-bold text-slate-800">Grand Total</td>;
                        }
                        if (index < firstTotalColIndex - 1) {
                          return <td key={index}></td>;
                        }
                        return (
                          <td key={index} className={`py-3 whitespace-nowrap font-semibold text-slate-900 ${
                            totalValue !== undefined ? 'px-6 text-right' : 'px-6'
                          }`}>
                            {totalValue !== undefined ? totalValue.toFixed(2) : ''}
                          </td>
                        );
                      });
                    })()}
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResultDisplay;