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
  FileText,
  Loader2,
  Plus,
  Sparkles
} from 'lucide-react';

const CleanHomepage = ({ onTextExtracted, isLoading, setIsLoading }) => {
  const [showLibrary, setShowLibrary] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [library, setLibrary] = useState([]);
  const fileLibrary = new FileLibrary();

  useEffect(() => {
    setIsClient(true);
    const savedTheme = localStorage.getItem('bioniScroll-theme');
    if (savedTheme) {
      setIsDarkMode(savedTheme === 'dark');
    }
    loadLibrary();
  }, []);

  useEffect(() => {
    if (isClient) {
      localStorage.setItem('bioniScroll-theme', isDarkMode ? 'dark' : 'light');
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

  if (!isClient) {
    return (
      <div className="clean-homepage loading">
        <div className="loading-container">
          <Loader2 size={32} className="animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className={`clean-homepage ${isDarkMode ? 'dark' : 'light'}`}>
      {/* Header */}
      <header className="homepage-header">
        <div className="header-left">
          <div className="logo">
            <Sparkles size={32} />
            <span>BioniScroll</span>
          </div>
        </div>
        
        <div className="header-right">
          {library.length > 0 && (
            <button
              onClick={() => setShowLibrary(!showLibrary)}
              className="header-btn"
              title={showLibrary ? 'Upload new file' : 'View library'}
            >
              {showLibrary ? <Plus size={20} /> : <Library size={20} />}
              <span className="btn-text">
                {showLibrary ? 'Add New' : `Library (${library.length})`}
              </span>
            </button>
          )}
          
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="header-btn theme-btn"
            title="Toggle theme"
          >
            {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="homepage-main">
        {showLibrary && library.length > 0 ? (
          <LibrarySection 
            library={library}
            onFileOpen={handleLibraryFileOpen}
            onFileDelete={handleFileDelete}
            isDarkMode={isDarkMode}
          />
        ) : (
          <UploadSection
            onDrop={handleDrop}
            onFileSelect={handleFileSelect}
            isLoading={isLoading}
            isDarkMode={isDarkMode}
          />
        )}
      </main>
    </div>
  );
};

// Upload Section Component
const UploadSection = ({ onDrop, onFileSelect, isLoading, isDarkMode }) => {
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
    <div className="upload-section">
      <div className="upload-intro">
        <h1>Speed Read Anything</h1>
        <p>Drop your PDF or EPUB file to start reading with bionic enhancement</p>
      </div>

      <div
        className={`upload-area ${isDragOver ? 'drag-over' : ''} ${isLoading ? 'loading' : ''}`}
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

        <div className="upload-content">
          {isLoading ? (
            <>
              <Loader2 size={48} className="upload-icon spinning" />
              <h3>Processing your book...</h3>
              <p>This may take a moment</p>
            </>
          ) : isDragOver ? (
            <>
              <Upload size={48} className="upload-icon drop-ready" />
              <h3>Drop to upload</h3>
              <p>Release your file here</p>
            </>
          ) : (
            <>
              <div className="file-icons">
                <FileText size={40} />
                <BookOpen size={40} />
              </div>
              <h3>Click or drag to upload</h3>
              <p>PDF and EPUB files supported • Max 50MB</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// Library Section Component
const LibrarySection = ({ library, onFileOpen, onFileDelete, isDarkMode }) => {
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'Today';
    if (diffDays === 2) return 'Yesterday';
    if (diffDays <= 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getFileIcon = (type) => {
    return type === 'application/epub+zip' ? '📚' : '📄';
  };

  return (
    <div className="library-section">
      <div className="library-header">
        <h2>Your Library</h2>
        <p>{library.length} book{library.length !== 1 ? 's' : ''}</p>
      </div>

      <div className="books-grid">
        {library.map((file) => (
          <div key={file.id} className="book-item">
            <div 
              className="book-main"
              onClick={() => onFileOpen(file.id)}
            >
              <div className="book-icon">
                {getFileIcon(file.type)}
              </div>
              
              <div className="book-details">
                <h3 className="book-title">
                  {file.name.replace(/\.(pdf|epub)$/i, '')}
                </h3>
                <div className="book-meta">
                  <span>{formatDate(file.lastRead || file.dateAdded)}</span>
                  {file.readingProgress > 0 && (
                    <span className="progress">{Math.round(file.readingProgress)}% read</span>
                  )}
                </div>
              </div>
            </div>
            
            <button
              onClick={(e) => {
                e.stopPropagation();
                onFileDelete(file.id);
              }}
              className="delete-btn"
              title="Remove from library"
            >
              ×
            </button>

            {file.readingProgress > 0 && (
              <div className="progress-bar">
                <div 
                  className="progress-fill"
                  style={{ width: `${file.readingProgress}%` }}
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default CleanHomepage;