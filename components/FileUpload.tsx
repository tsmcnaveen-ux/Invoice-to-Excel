import React, { useState, useCallback } from 'react';
import { UploadCloudIcon, XIcon, FileIcon } from './Icons';

interface FileUploadProps {
  onFileChange: (file: File | null) => void;
}

const FileUpload: React.FC<FileUploadProps> = ({ onFileChange }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileSelect = useCallback((file: File | null) => {
    if (file && (file.type.startsWith('image/') || file.type === 'application/pdf')) {
      setSelectedFile(file);
      onFileChange(file);
    } else if (file) {
      alert('Please upload a valid image or PDF file.');
    } else {
      setSelectedFile(null);
      onFileChange(null);
    }
  }, [onFileChange]);

  const handleDragEnter = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };

  const handleRemoveFile = () => {
      handleFileSelect(null);
  };

  return (
    <div>
      <label
        htmlFor="file-upload"
        className={`flex flex-col items-center justify-center w-full h-56 border-2 border-dashed rounded-lg cursor-pointer transition-colors duration-300 ${
          isDragging ? 'border-blue-500 bg-blue-50' : 'border-slate-300 bg-slate-50 hover:bg-slate-100'
        }`}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        {!selectedFile ? (
            <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center">
              <UploadCloudIcon className="w-10 h-10 mb-3 text-slate-400" />
              <p className="mb-2 text-sm text-slate-500">
                <span className="font-semibold text-blue-600">Click to upload</span> or drag and drop
              </p>
              <p className="text-xs text-slate-500">PDF, PNG, JPG (max. 10MB)</p>
            </div>
          ) : (
            <div className="relative flex flex-col items-center justify-center w-full h-full p-4">
               <div className="flex items-center bg-green-100 text-green-800 rounded-full px-4 py-2">
                 <FileIcon className="w-5 h-5 mr-2"/>
                 <span className="font-medium text-sm truncate">{selectedFile.name}</span>
               </div>
                <button
                  type="button"
                  onClick={handleRemoveFile}
                  className="absolute top-3 right-3 p-1 bg-white rounded-full text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
                  aria-label="Remove file"
                >
                  <XIcon className="w-5 h-5" />
                </button>
            </div>
          )}
        <input id="file-upload" type="file" className="hidden" accept="image/*,application/pdf" onChange={handleInputChange} />
      </label>
    </div>
  );
};

export default FileUpload;