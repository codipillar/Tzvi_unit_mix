# Tzvi Project

Client review demo: upload a rent roll Excel file and display the **Unit Mix** table (Proforma `E1:N28` logic from `analysis - template.xlsx`).

The live demo runs entirely in the browser (no server required on GitHub Pages). Files are parsed locally and never uploaded to a server.

## Live demo (GitHub Pages)

After deployment, the app is available at:

`https://<your-github-username>.github.io/<repo-name>/`

Example: `https://codipillar.github.io/Tzvi_unit_mix/`

## Local development
### Option A — open static files (quickest)

Open `docs/index.html` in a browser, or use any static file server:

```bash
cd docs
python -m http.server 8080
```

Open [http://127.0.0.1:8080](http://127.0.0.1:8080)

### Option B — Flask (optional)

```bash
python -m venv venv

# Windows
venv\Scripts\activate

pip install -r requirements.txt
python app.py
```

Open [http://127.0.0.1:5000](http://127.0.0.1:5000)

## Usage

1. Click the upload button (bottom left).
2. Select a rent roll `.xlsx` file (same format as `rent_roll_4.xlsx`).
3. The Unit Mix table appears in the main area.

## Project structure

| Path | Purpose |
|------|---------|
| `docs/` | Static site deployed to GitHub Pages |
| `docs/js/unit_mix.js` | Rent roll parsing and Unit Mix calculations (browser) |
| `docs/js/app.js` | UI and table rendering |
| `unit_mix.py` | Same calculation logic in Python (for reference/testing) |
| `app.py` | Local static file server |
| `.github/workflows/pages.yml` | GitHub Pages deployment workflow |

## Rent roll format

The parser expects the same layout as `rent_roll_4.xlsx`:

- Data rows **8–67**
- Column **C** — Sq Ft
- Column **E** — Resident name / status (`VACANT`, `DOWN`, or tenant name)
- Column **F** — Market rent
- Column **G** — Actual rent
