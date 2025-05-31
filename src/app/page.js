// src/app/page.js
'use client';

import { useState } from "react";
import CleanHomepage from "@/components/CleanHomepage";
import TikTokReader from "@/components/TikTokReader";
import { FileLibrary } from "@/utils/fileLibrary";
import "@/styles/styles.css";

function App() {
  const [extractedText, setExtractedText] = useState("");
  const [extractedContent, setExtractedContent] = useState([]);
  const [extractedImages, setExtractedImages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [fileName, setFileName] = useState("");
  const [currentFileId, setCurrentFileId] = useState(null);
  const fileLibrary = new FileLibrary();

  const handleTextExtracted = (text, name, fileId = null, content = [], images = []) => {
    setExtractedText(text);
    setExtractedContent(content);
    setExtractedImages(images);
    setFileName(name);
    setCurrentFileId(fileId);
  };

  const handleReset = () => {
    setExtractedText("");
    setExtractedContent([]);
    setExtractedImages([]);
    setFileName("");
    setCurrentFileId(null);
  };

  const handleProgressUpdate = (progress, sectionIndex) => {
    if (currentFileId) {
      fileLibrary.updateReadingProgress(currentFileId, progress, sectionIndex);
    }
  };

  return (
    <>
      {!extractedText && extractedContent.length === 0 ? (
        <CleanHomepage
          onTextExtracted={handleTextExtracted}
          isLoading={isLoading}
          setIsLoading={setIsLoading}
        />
      ) : (
        <TikTokReader
          text={extractedText}
          content={extractedContent}
          images={extractedImages}
          fileName={fileName}
          onReset={handleReset}
          onProgressUpdate={handleProgressUpdate}
          fileId={currentFileId}
        />
      )}
    </>
  );
}

export default App;