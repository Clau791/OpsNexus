# 🚀 Deploying OpsNexus to Vercel



## Prerequisites
- A [GitHub](https://github.com/) account.
- A [Vercel](https://vercel.com/) account.
- The OpsNexus repository cloned or forked to your GitHub.

## Option 1: Deploy via Vercel Dashboard (Recommended)

1.  **Log in** to your Vercel Dashboard.
2.  Click **"Add New..."** -> **"Project"**.
3.  **Import** the `OpsNexus` repository from your GitHub.
4.  **Configure Project**:
    *   **Framework Preset**: Vercel usually detects `Vite` or `Other`. You can leave it as default or select `Vite`.
    *   **Root Directory**: Leave as `./` (the root of the repo).
    *   *Note:* The `vercel.json` file in the repository will override most build settings to ensure the Python backend and React frontend are built correctly.
5.  Click **Deploy**.

Vercel will build the frontend and set up the serverless functions for the backend. Once finished, you will get a live URL (e.g., `https://opsnexus.vercel.app`).

## Option 2: Deploy via CLI

1.  **Install Vercel CLI**:
    ```bash
    npm i -g vercel
    ```
2.  **Login**:
    ```bash
    vercel login
    ```
3.  **Deploy**:
    Run this command from the root of the project:
    ```bash
    vercel
    ```
4.  Follow the prompts. Use default settings for most questions. The `vercel.json` will guide the build process.

## ⚙️ Configuration Details
The project uses a `vercel.json` file to route traffic:
-   `/api/*` -> Requests are routed to the Python Backend (`backend/main.py`).
-   `/*` -> All other requests serves the React Frontend (`frontend/`).

**Troubleshooting:**
-   If the backend API returns 404, check the **Functions** tab in Vercel to see if `backend/main.py` was built successfully.
-   If you see CORS errors, ensure the backend allows the Vercel domain (currently set to `*` to allow all).
