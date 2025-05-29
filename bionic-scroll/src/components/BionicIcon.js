// src/components/BionicIcon.js
import React from 'react';

const BionicIcon = ({ size = 18, className = "" }) => {
  return (
    <div className={`bionic-icon ${className}`} style={{ fontSize: `${size}px` }}>
      <span className="bionic-b">B</span>
      <span className="bionic-r">R</span>
    </div>
  );
};

export default BionicIcon;