import React from "react";

interface SpacedProps {
  elements: React.ReactNode[];
}
export const Spaced = ({elements}: SpacedProps) => <>{(
  elements
    .map((x, index) => <span key={index}>{x}</span>)
    // @ts-ignore
    .reduce((prev, curr) => [prev, <span key={`dot-${curr.key}`} className = 'spacer-dot' />, curr])
)}</>;
