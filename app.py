"""Local development server — serves the same static site as GitHub Pages."""

from pathlib import Path

from flask import Flask, send_from_directory

BASE_DIR = Path(__file__).resolve().parent
DOCS_DIR = BASE_DIR / "docs"

app = Flask(__name__, static_folder=None)


@app.route("/")
def index():
    return send_from_directory(DOCS_DIR, "index.html")


@app.route("/<path:filename>")
def docs_files(filename):
    return send_from_directory(DOCS_DIR, filename)


if __name__ == "__main__":
    app.run(debug=True, port=5000, use_reloader=False)
