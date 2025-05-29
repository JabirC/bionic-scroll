// src/components/FileUploadArea.js
import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, Loader2, AlertCircle } from 'lucide-react';

const FileUploadArea = ({ onFileProcessed, isLoading, setIsLoading, isDarkMode }) => {
  const onDrop = useCallback(async (acceptedFiles) => {
    const file = acceptedFiles[0];
    if (file && (file.type === 'application/pdf' || file.type === 'application/epub+zip')) {
      setIsLoading(true);
      try {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch('/api/extract-text', {
          method: 'POST',
          body: formData,
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || 'Failed to process file');
        }

        onFileProcessed(result.text, file, result.metadata);
      } catch (error) {
        console.error('Error processing file:', error);
        alert(error.message || 'Error processing file. Please try another file.');
      } finally {
        setIsLoading(false);
      }
    }
  }, [onFileProcessed, setIsLoading]);

  const { getRootProps, getInputProps, isDragActive, fileRejections } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/epub+zip': ['.epub']
    },
    multiple: false,
    maxSize: 50 * 1024 * 1024, // 50MB
  });

  return (
    <div className="upload-section">
      <div className="upload-container">
        <div
          {...getRootProps()}
          className={`upload-dropzone ${isDragActive ? 'dragover' : ''} ${isLoading ? 'loading' : ''}`}
        >
          <input {...getInputProps()} />

          {isLoading ? (
            <div className="upload-state loading-state">
              <div className="state-icon">
                <Loader2 size={48} className="animate-spin" />
              </div>
              <h3>Processing your book...</h3>
              <p>Extracting text and preparing for speed reading</p>
            </div>
          ) : isDragActive ? (
            <div className="upload-state drop-state">
              <div className="state-icon drop-glow">
                <Upload size={48} />
              </div>
              <h3>Drop your book here</h3>
              <p>Release to start processing</p>
            </div>
          ) : (
            <div className="upload-state default-state">
              <div className="state-icon">
                <div className="icon-stack">
                  <FileText size={40} className="icon-base" />
                  <Upload size={24} className="icon-overlay" />
                </div>
              </div>
              <h3>Drop or click to upload</h3>
              <p>Choose your PDF or EPUB file to get started</p>
              <div className="upload-specs">
                <span>Supports PDF & EPUB</span>
                <span>•</span>
                <span>Max 50MB</span>
              </div>
            </div>
          )}
        </div>

        {fileRejections.length > 0 && (
          <div className="upload-errors">
            {fileRejections.map(({ file, errors }) => (
              <div key={file.path} className="error-message">
                <AlertCircle size={16} />
                <span>{errors.map(e => e.message).join(', ')}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default FileUploadArea;