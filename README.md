# Daniel Schumacher Portfolio

A premium static developer portfolio for Daniel Schumacher, an aspiring software developer from Switzerland.

The website is built for internship and job applications. It presents Daniel's skills, projects, learning timeline, contact details, and self-hosted Proxmox homelab.

## Tech Stack

- HTML
- CSS
- JavaScript
- No frameworks
- No Bootstrap

## Project Structure

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
- Glassmorphism cards and subtle glowing effects
- Responsive mobile-first layout
- Sticky navigation with smooth scrolling
- Typing hero subtitle
- Floating terminal card
- Scroll reveal animations
- Cursor glow
- Button ripple effects
- Premium project cards with "What I built" and "What I learned"
- Static homelab dashboard prepared for future live status data
- Hosting architecture section
- Download CV callout

## Hosting Architecture

This website is self-hosted on a Proxmox homelab and deployed automatically from GitHub.

```text
GitHub
  -> Automatic Deploy Script
  -> Docker Container
  -> Nginx Proxy Manager
  -> Cloudflare DNS
  -> daniel-schumacher.net
```

Hosting technologies:

- Proxmox
- Docker
- Portainer
- Nginx Proxy Manager
- Cloudflare
- GitHub
- Let's Encrypt
- Linux

## Deployment Workflow

```text
CodeX
  -> GitHub
  -> automatic deploy script
  -> Docker
  -> live website
```

Typical deployment flow:

1. Make and test static site changes locally.
2. Push the portfolio code to GitHub.
3. Let the automatic deploy script pull the latest version.
4. Serve the site from a Docker container.
5. Route traffic through Nginx Proxy Manager.
6. Use Cloudflare DNS and HTTPS for the public domain.

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
