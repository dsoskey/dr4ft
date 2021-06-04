/*global BUILD_DATE*/
declare const BUILD_DATE: string;
import React from "react";
import "./Version.scss"
import { MTGJsonVersion } from "../app";

const getLink = (version: string) => (
  (/^v\d+\.\d+\.\d+$/.test(version)) ?
    `releases/tag/${version}` :
    `commit/${version}`
);

interface VersionProps {
  version: string;
  MTGJSONVersion: MTGJsonVersion;
  boosterRulesVersion: string;
}
export const Version = ({version, MTGJSONVersion, boosterRulesVersion}: VersionProps) => {
  return (
    <div className="Version">
      <div>
        drVft version:{" "}
        <a href={`https://github.com/dsoskey/dr4ft/${getLink(version)}`} className='code'>
          <code>{version}</code>
        </a> <span className='date'>({BUILD_DATE})</span>
      </div>

      <div>
        Card data: <a href="https://www.mtgjson.com">MTGJSON</a> {" "}
        <a href={`https://mtgjson.com/changelog/mtgjson-v5/#_${MTGJSONVersion.version.replace(/\./g, "-")}`} className='code'>
          <code>v{MTGJSONVersion.version}</code>
        </a> <span className='date'>({MTGJSONVersion.date})</span>
      </div>

      <div>
        Booster rules:{" "}
        <a href={"https://github.com/taw/magic-sealed-data"}>Magic Sealed Data</a> {" "}
        <a href={`https://github.com/taw/magic-sealed-data/commit/${boosterRulesVersion}`} className='code'>
          <code>{boosterRulesVersion.substring(0, 7)}</code>
        </a>
      </div>
    </div>
  );
};
