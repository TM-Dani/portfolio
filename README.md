# Daniel Schumacher Portfolio

A premium static developer portfolio for Daniel Schumacher, an aspiring software developer from Switzerland.

The portfolio is designed for internship and job applications and presents Daniel's skills, projects, learning timeline and self-hosted homelab.

## Tech Stack

- HTML
- CSS
- JavaScript
- No frameworks
- No Bootstrap

## Structure

```text
index.html
assets/
  css/
    reset.css
    variables.css
    main.css
    animations.css
    responsive.css
  js/
    main.js
    typing.js
    animations.js
  images/
    hero-homelab.png
  icons/
  documents/
    cv.pdf
```

## Features

- Dark navy theme with purple and blue accents
- Glassmorphism cards and soft gradient glow
- Responsive mobile-first layout
- Sticky navigation with smooth scrolling
- Typing hero subtitle
- Floating terminal card
- Scroll reveal animations
- Cursor glow
- Button ripple effects
- Premium project card layout
- Static homelab dashboard prepared for future live status data

## Self-Hosting

This portfolio is intended to be self-hosted on a Proxmox homelab using Docker, Nginx Proxy Manager and Cloudflare.

Typical deployment flow:

1. Serve the static files with a lightweight Docker web server.
2. Route traffic through Nginx Proxy Manager.
3. Connect the public domain and DNS through Cloudflare.

## Future API Integration

The project and homelab cards include `data-*` attributes so future JavaScript can connect to:

- GitHub API
- Docker API
- Homelab status endpoints
- Cloudflare status endpoints

The layout is already prepared for those values to be updated dynamically later.

## CV

Place the CV PDF at:

```text
assets/documents/cv.pdf
```

The website buttons already link to that path.
