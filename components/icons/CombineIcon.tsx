
import React from 'react';

const CombineIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="m5 8 6 6" />
    <path d="m4 14 6-6 2-3" />
    <path d="m11 11 4.5 4.5" />
    <path d="m14 4 6 6" />
    <path d="M19 10c-3 3-6 6-9 9" />
  </svg>
);

export default CombineIcon;
