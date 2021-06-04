import React from "react";

import { STRINGS } from "../config";
import { Spaced } from "../components/Spaced";
import { app } from "../router";

const Header = () => (
  <header>
    <h1 className="lobby-header">
      {STRINGS.BRANDING.SITE_NAME}
    </h1>
    <ApplicationError />
  </header>
);

const ApplicationError = () => (
  <p dangerouslySetInnerHTML={{__html: app.err}} className='error' />
);

export default Header;
