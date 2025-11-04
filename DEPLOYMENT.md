# Deployment Guide

This repository contains a Node/Express backend (`/backend`) and a Vite React frontend (`/project`). Below are instructions and pre-built artifacts to deploy locally (Docker) and guidance for cloud deployments.

Local (recommended for quick testing)

Prerequisites:
- Docker & Docker Compose installed

Steps:
1. From the repository root, build and start everything:

   docker-compose up --build

   This will:
   - start a MongoDB instance on host port 27017
   - build and run the backend on host port 5000
   - build and run the frontend and map nginx to host port 5173 (so the backend CORS allows it by default)

2. Verify:
- Backend health: http://localhost:5000/api/health
- Frontend: http://localhost:5173/

Environment variables:
- The backend reads `MONGO_URI` and `PORT` from the environment. The compose file sets `MONGO_URI=mongodb://mongo:27017/kosg` for local testing.

Cloud deployment options (high-level)

1) Render / DigitalOcean App Platform / Railway
- Use the provided Dockerfiles: `backend/Dockerfile` and `project/Dockerfile`.
- Configure service for backend to expose port 5000 and set the `MONGO_URI` environment variable to a managed MongoDB (Atlas or provider).
- Configure frontend as a static site or Docker image; point the frontend to the backend API via an env var in production or by updating the frontend to use a runtime API URL.

2) Heroku (legacy, not recommended for Docker images)
- You can deploy the backend using a Heroku Node buildpack (Procfile: `web: node server.js`) and connect to MongoDB Atlas.

3) Vercel / Netlify (frontend)
- Build the `project` folder with Vite and deploy as a static site. Configure the frontend to call your backend's public URL.

CI / CD
- A GitHub Actions template was added at `.github/workflows/deploy.yml`. It builds and pushes Docker images to Docker Hub. You must set the secrets `DOCKERHUB_USERNAME` and `DOCKERHUB_TOKEN` in your repo settings.

Notes & next steps
- The backend's CORS config currently allows `http://localhost:5173`. If you serve the frontend from a different host in production, update CORS or add a `FRONTEND_URL` env var and allow it.
- For production, point the backend to a managed MongoDB (MongoDB Atlas) and do not expose MongoDB to the public internet without authentication and firewall rules.
- Add monitoring, logging (e.g., Papertrail, LogDNA), and proper secrets management for production.
