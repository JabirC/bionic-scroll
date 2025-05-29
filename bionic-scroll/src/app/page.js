// src/app/page.js
'use client';

import { useState } from "react";
import FileUpload from "@/components/FileUpload";
import TikTokReader from "@/components/TikTokReader";
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
    <div className="min-h-screen">
      {!extractedText ? (
        <FileUpload
          onTextExtracted={handleTextExtracted}
          isLoading={isLoading}
          setIsLoading={setIsLoading}
        />
      ) : (
        <TikTokReader
          text={extractedText}
          fileName={fileName}
          onReset={handleReset}
        />
      )}
    </div>
  );
}

export default App;