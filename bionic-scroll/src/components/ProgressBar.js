//src/components/ProgressBar.js
import React from "react";
import { Clock, BookOpen } from "lucide-react";

const ProgressBar = ({ progress, wordsRead, totalWords }) => {
  const remainingWords = totalWords - wordsRead;
  const remainingMinutes = Math.ceil(remainingWords / 200);

  return (
    <div className="bg-white border-b border-gray-200">
      <div className="max-w-4xl mx-auto px-4 py-2">
        <div className="relative">
          <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
            <div className="flex items-center space-x-4">
              <span className="flex items-center">
                <BookOpen className="w-4 h-4 mr-1" />
                {wordsRead.toLocaleString()} / {totalWords.toLocaleString()}{" "}
                words
              </span>
              <span className="flex items-center">
                <Clock className="w-4 h-4 mr-1" />~{remainingMinutes} min left
              </span>
            </div>
            <span className="font-medium">{Math.round(progress)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
            <div
              className="bg-gradient-to-r from-blue-500 to-purple-500 h-full rounded-full transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProgressBar;
