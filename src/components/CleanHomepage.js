// src/components/CleanHomepage.js
import React, { useState, useEffect } from 'react';
import { FileLibrary } from '../utils/fileLibrary';
import { 
  BookOpen, 
  Home,
  Library,
  Sun, 
  Moon,
  Upload,
  Loader2,
  Plus,
  Trash2,
  Zap
} from 'lucide-react';

const CleanHomepage = ({ onTextExtracted, isLoading, setIsLoading }) => {
  const [showLibrary, setShowLibrary] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [library, setLibrary] = useState([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const fileLibrary = new FileLibrary();

  useEffect(() => {
    setIsClient(true);
    const savedTheme = localStorage.getItem('omniReader-theme');
    if (savedTheme) {
      setIsDarkMode(savedTheme === 'dark');
    }
    loadLibrary();
    setTimeout(() => setIsInitialized(true), 100);
  }, []);

  useEffect(() => {
    if (isClient) {
      localStorage.setItem('omniReader-theme', isDarkMode ? 'dark' : 'light');
    }
  }, [isDarkMode, isClient]);

  const loadLibrary = () => {
    const libraryFiles = fileLibrary.getLibrary();
    setLibrary(libraryFiles);
  };

  const handleFileProcessed = async (text, fileInfo, metadata) => {
    try {
      const fileId = fileLibrary.saveFile({
        name: fileInfo.name,
        size: fileInfo.size,
        type: fileInfo.type,
        metadata
      }, text);
      
      onTextExtracted(text, fileInfo.name, fileId);
      loadLibrary();
    } catch (error) {
      console.error('Error saving file:', error);
      onTextExtracted(text, fileInfo.name, null);
    }
  };

  const handleLibraryFileOpen = (fileId) => {
    const file = fileLibrary.getFile(fileId);
    const text = fileLibrary.getText(fileId);
    
    if (file && text) {
      onTextExtracted(text, file.name, fileId);
    }
  };

  const handleFileDelete = (fileId) => {
    fileLibrary.deleteFile(fileId);
    loadLibrary();
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    const file = files[0];
    
    if (file && (file.type === 'application/pdf' || file.type === 'application/epub+zip')) {
      await processFile(file);
    }
  };

  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (file) {
      await processFile(file);
    }
  };

  const processFile = async (file) => {
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

      handleFileProcessed(result.text, file, result.metadata);
    } catch (error) {
      console.error('Error processing file:', error);
      alert(error.message || 'Error processing file. Please try another file.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isClient || !isInitialized) {
    return (
      <div className="minimal-homepage loading">
        <div className="loading-container">
          <Loader2 size={24} className="animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className={`minimal-homepage ${isDarkMode ? 'dark' : 'light'}`}>
      {/* Header */}
      <nav className="top-nav">
        <div className="nav-brand">
          <div className="brand-logo">
            <Zap className="brand-icon" size={24} />
            <span className="brand-text">Omni Reader</span>
            <div className="brand-accent"></div>
          </div>
        </div>
        
        <div className="nav-actions">
          {library.length > 0 && (
            <button
              onClick={() => setShowLibrary(!showLibrary)}
              className="nav-button"
              title={showLibrary ? 'Upload' : 'Library'}
            >
              {showLibrary ? <Plus size={18} /> : <Library size={18} />}
            </button>
          )}
          
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="nav-button"
            title="Toggle theme"
          >
            {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>
      </nav>

      {/* Main */}
      <main className={`main-content ${showLibrary ? 'library-view' : 'upload-view'}`}>
        {showLibrary && library.length > 0 ? (
          <LibraryGrid 
            library={library}
            onFileOpen={handleLibraryFileOpen}
            onFileDelete={handleFileDelete}
          />
        ) : (
          <UploadZone
            onDrop={handleDrop}
            onFileSelect={handleFileSelect}
            isLoading={isLoading}
          />
        )}
      </main>
    </div>
  );
};

// Upload Zone Component
const UploadZone = ({ onDrop, onFileSelect, isLoading }) => {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDropInternal = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    onDrop(e);
  };

  return (
    <div className="upload-zone">
      <div className="upload-header">
        <h1>Read Faster</h1>
        <p>Upload PDF or EPUB files for enhanced reading</p>
      </div>

      <div
        className={`drop-area ${isDragOver ? 'drag-active' : ''} ${isLoading ? 'processing' : ''}`}
        onDrop={handleDropInternal}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => !isLoading && document.getElementById('file-input').click()}
      >
        <input
          id="file-input"
          type="file"
          accept=".pdf,.epub"
          onChange={onFileSelect}
          style={{ display: 'none' }}
          disabled={isLoading}
        />

        <div className="drop-content">
          {isLoading ? (
            <>
              <Loader2 size={32} className="icon animate-spin" />
              <span className="status">Processing...</span>
            </>
          ) : (
            <>
              <Upload size={32} className="icon" />
              <span className="status">{isDragOver ? 'Drop file' : 'Drop or click'}</span>
              <span className="format">PDF, EPUB up to 200MB</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// Library Grid Component
const LibraryGrid = ({ library, onFileOpen, onFileDelete }) => {
  const formatRelativeTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffHours = Math.abs(now - date) / 36e5;
    
    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${Math.floor(diffHours)}h ago`;
    if (diffHours < 168) return `${Math.floor(diffHours / 24)}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="library-grid">
      <div className="grid-header">
        <h2>Library</h2>
        <span className="count">{library.length}</span>
      </div>

      <div className="books">
        {library.map((file) => (
          <div key={file.id} className="book-row">
            <div 
              className="book-main"
              onClick={() => onFileOpen(file.id)}
            >
              <div className="book-indicator">
                <div className="indicator-dot" />
                {file.readingPosition && file.readingPosition.percentage > 0 && (
                  <div 
                    className="progress-arc"
                    style={{ 
                      background: `conic-gradient(#059669 0deg ${file.readingPosition.percentage * 3.6}deg, transparent ${file.readingPosition.percentage * 3.6}deg 360deg)` 
                    }}
                  />
                )}
              </div>
              
              <div className="book-info">
                <div className="book-title">
                  {file.name.replace(/\.(pdf|epub)$/i, '')}
                </div>
                <div className="book-time">
                  {formatRelativeTime(file.lastRead || file.dateAdded)}
                  {file.readingPosition && file.readingPosition.percentage > 0 && (
                    <span className="progress-text">
                      • {Math.round(file.readingPosition.percentage)}% read
                    </span>
                  )}
                </div>
              </div>
            </div>
            
            <button
              onClick={(e) => {
                e.stopPropagation();
                onFileDelete(file.id);
              }}
              className="delete-button"
              title="Delete file"
            >
              <Trash2 size={18} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CleanHomepage;