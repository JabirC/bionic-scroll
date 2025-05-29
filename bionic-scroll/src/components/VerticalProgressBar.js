// src/components/VerticalProgressBar.js
import React from "react";

const VerticalProgressBar = ({ progress }) => {
  return (
    <div className="vertical-progress-container">
      <div
        className="vertical-progress-bar"
        style={{ height: `${Math.min(progress, 100)}%` }}
        title={`${Math.round(progress)}% complete`}
      />
    </div>
  );
};

export default VerticalProgressBar;