import React from "react";

interface NewsPanelProps {
  motd: React.ReactNode;
}

export const NewsPanel = ({motd}: NewsPanelProps) => (
  <fieldset className='fieldset'>
    <legend className='legend'>News</legend>
    {motd}
  </fieldset>
);
