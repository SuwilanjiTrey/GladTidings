// FlagIcon.jsx
import React from 'react';

const FlagIcon = ({ language, size = 24 }) => {
  return (
    <img 
      src={`/flags/${language}.svg`}
      alt={`${language} flag`}
      style={{
        width: size,
        height: size,
        objectFit: 'cover',
        borderRadius: '2px',
        verticalAlign: 'middle'
      }}
    />
  );
};

export default FlagIcon;