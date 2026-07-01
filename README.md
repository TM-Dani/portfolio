# Daniel Schumacher Portfolio

A modern static personal portfolio website for Daniel Schumacher, an aspiring software developer from Switzerland.

The site is built for internship and job applications and highlights Daniel's web development skills, project work, and self-hosted homelab infrastructure.

## Features

- Responsive dark theme with glassmorphism cards
- Hero section with custom homelab/developer visual
- About, skills, projects, homelab preview, CV, and contact sections
- Static homelab status preview for future live dashboard work
- Clean HTML, CSS, and JavaScript with no frameworks

## Tech Stack

- HTML
- CSS
- JavaScript

## Self-Hosting

This portfolio is intended to be self-hosted on a Proxmox homelab using Docker, Nginx Proxy Manager, and Cloudflare.

Typical deployment flow:

1. Serve the static files with a lightweight web server or Docker container.
2. Route traffic through Nginx Proxy Manager.
3. Connect the public domain through Cloudflare.

## Project Structure

```text
index.html
assets/
  css/
    main.css
  js/
    main.js
  images/
    hero-homelab.png
  documents/
    cv.pdf
```

## CV

Place the CV PDF at:

```text
assets/documents/cv.pdf
```

The website buttons already link to that path.
