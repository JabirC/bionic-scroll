// src/components/ModernFileUpload.js
import React, { useCallback, useState, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import { extractTextFromPDF } from "../utils/pdfExtractor";
import { 
  Upload, 
  FileText, 
  Loader2, 
  Sparkles, 
  Zap, 
  Eye,
  Moon,
  Sun
} from "lucide-react";

const ModernFileUpload = ({ onTextExtracted, isLoading, setIsLoading }) => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isClient, setIsClient] = useState(false);

  // Handle hydration
  useEffect(() => {
    setIsClient(true);
    const savedTheme = localStorage.getItem('bioniScroll-theme');
    if (savedTheme) {
      setIsDarkMode(savedTheme === 'dark');
    }
  }, []);

  // Save theme preference
  useEffect(() => {
    if (isClient) {
      localStorage.setItem('bioniScroll-theme', isDarkMode ? 'dark' : 'light');
    }
  }, [isDarkMode, isClient]);

  const onDrop = useCallback(
    async (acceptedFiles) => {
      const file = acceptedFiles[0];
      if (file && file.type === "application/pdf") {
        setIsLoading(true);
        try {
          const text = await extractTextFromPDF(file);
          onTextExtracted(text, file.name);
        } catch (error) {
          console.error("Error extracting text:", error);
          alert(error.message || "Error processing PDF. Please try another file.");
        } finally {
          setIsLoading(false);
        }
      }
    },
    [onTextExtracted, setIsLoading]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
    },
    multiple: false,
  });

  // Prevent hydration mismatch by not rendering until client
  if (!isClient) {
    return (
      <div className="modern-upload light">
        <div className="upload-container">
          <div className="upload-header">
            <div className="logo">
              <Sparkles className="logo-icon" />
              <h1>BioniScroll</h1>
            </div>
            <p className="tagline">Transform PDFs into speed-reading experiences</p>
          </div>
          <div className="upload-area">
            <div className="loading-content">
              <Loader2 className="loading-icon" />
              <h3>Loading...</h3>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`modern-upload ${isDarkMode ? 'dark' : 'light'}`}>
      {/* Theme Toggle */}
      <button
        className="theme-toggle"
        onClick={() => setIsDarkMode(!isDarkMode)}
        aria-label="Toggle theme"
      >
        {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
      </button>

      <div className="upload-container">
        {/* Header */}
        <div className="upload-header">
          <div className="logo">
            <Sparkles className="logo-icon" />
            <h1>BioniScroll</h1>
          </div>
          <p className="tagline">Transform PDFs into speed-reading experiences</p>
        </div>

        {/* Features */}
        <div className="features">
          <div className="feature">
            <Zap className="feature-icon" />
            <span>Bionic Reading</span>
          </div>
          <div className="feature">
            <Eye className="feature-icon" />
            <span>Speed Reading</span>
          </div>
          <div className="feature">
            <FileText className="feature-icon" />
            <span>PDF Support</span>
          </div>
        </div>

        {/* Upload Area */}
        <div
          {...getRootProps()}
          className={`upload-area ${isDragActive ? 'drag-active' : ''} ${isLoading ? 'loading' : ''}`}
        >
          <input {...getInputProps()} />

          {isLoading ? (
            <div className="loading-content">
              <Loader2 className="loading-icon" />
              <div className="loading-text">
                <h3>Processing your PDF...</h3>
                <p>Extracting text and preparing for speed reading</p>
              </div>
            </div>
          ) : (
            <div className="upload-content">
              <div className="upload-icon-container">
                <Upload className="upload-icon" />
              </div>
              
              {isDragActive ? (
                <div className="upload-text">
                  <h3>Drop your PDF here</h3>
                  <p>Release to start processing</p>
                </div>
              ) : (
                <div className="upload-text">
                  <h3>Drag & drop your PDF</h3>
                  <p>or click to browse files</p>
                  <div className="upload-specs">
                    <span>PDF files only • Max 50MB</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="upload-footer">
          <p>Your files are processed locally and never stored</p>
        </div>
      </div>
    </div>
  );
};

export default ModernFileUpload;