import React from "react";

export const STRINGS = {
  BRANDING: {
    SITE_TITLE: ["drVft", "info"].join("."),
    SITE_NAME: <span>dr<span className='branding-v'>V</span>ft</span>,
    DEFAULT_USERNAME: "drVfter",
    PAYPAL: "",
  },

  PAGE_SECTIONS: {
    MOTD: <p>Tip of the day: Griselbrand doesn't cost too much mana. You just aren't dedicated enough.</p>,

    FOOTER:
      <div style={{ padding: 10 }}>
        Contributions welcome! &nbsp;
        <a href='https://github.com/dsoskey/dr4ft'>
          <img
            src='https://upload.wikimedia.org/wikipedia/commons/9/91/Octicons-mark-github.svg'
            alt='GitHub' title='GitHub Repository' height='18'
            style={{ marginRight: 5 }}
          />
          dsoskey/dr4ft
        </a>
      </div>
  }
};
