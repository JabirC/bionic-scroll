// src/app/page.js - Add ErrorBoundary wrapper
'use client';

import { useState } from "react";
import FileUpload from "@/components/FileUpload";
import Reader from "@/components/Reader";
import ErrorBoundary from "@/components/ErrorBoundary";
import "@/styles/styles.css";

function App() {
  const [extractedText, setExtractedText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [fileName, setFileName] = useState("");

  const handleTextExtracted = (text, name) => {
    setExtractedText(text);
    setFileName(name);
  };

  const handleReset = () => {
    setExtractedText("");
    setFileName("");
  };

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gray-50">
        {!extractedText ? (
          <FileUpload
            onTextExtracted={handleTextExtracted}
            isLoading={isLoading}
            setIsLoading={setIsLoading}
          />
        ) : (
          <Reader
            text={extractedText}
            fileName={fileName}
            onReset={handleReset}
          />
        )}
      </div>
    </ErrorBoundary>
  );
}

export default App;