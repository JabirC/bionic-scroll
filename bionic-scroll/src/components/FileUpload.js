// components/FileUpload.js
import React, { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { extractTextFromPDF } from "../utils/pdfExtractor";
import { Upload, FileText, Loader2 } from "lucide-react";

const FileUpload = ({ onTextExtracted, isLoading, setIsLoading }) => {
    // src/components/FileUpload.js - Update the onDrop function
    const onDrop = useCallback(
        async (acceptedFiles) => {
        const file = acceptedFiles[0];
        if (file && file.type === "application/pdf") {
            setIsLoading(true);
            try {
            // The extractTextFromPDF now uses server-side processing
            const text = await extractTextFromPDF(file);
            onTextExtracted(text, file.name);
            } catch (error) {
            console.error("Error extracting text:", error);
            
            // Show more specific error messages
            const errorMessage = error.message || "Error processing PDF. Please try another file.";
            alert(errorMessage);
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

  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Speed Reader
          </h1>
          <p className="text-gray-600">
            Transform your PDFs into an efficient reading experience
          </p>
        </div>

        <div
          {...getRootProps()}
          className={`
            border-2 border-dashed rounded-lg p-12 text-center cursor-pointer
            transition-all duration-200 ease-in-out
            ${
              isDragActive
                ? "border-blue-500 bg-blue-50"
                : "border-gray-300 hover:border-gray-400 bg-white"
            }
          `}
        >
          <input {...getInputProps()} />

          {isLoading ? (
            <div className="flex flex-col items-center">
              <Loader2 className="w-12 h-12 text-blue-500 animate-spin mb-4" />
              <p className="text-gray-600">Processing your PDF...</p>
            </div>
          ) : (
            <>
              <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              {isDragActive ? (
                <p className="text-gray-600">Drop your PDF here...</p>
              ) : (
                <>
                  <p className="text-gray-600 mb-2">
                    Drag & drop your PDF here, or click to select
                  </p>
                  <p className="text-sm text-gray-500">
                    Only PDF files are supported
                  </p>
                </>
              )}
            </>
          )}
        </div>

        <div className="mt-8 flex items-center justify-center space-x-8 text-sm text-gray-500">
          <div className="flex items-center">
            <FileText className="w-4 h-4 mr-1" />
            <span>PDF Support</span>
          </div>
          <div className="flex items-center">
            <span className="font-semibold">Bionic Reading™</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FileUpload;
