import os
import sys

from dotenv import load_dotenv
from flask import Flask, jsonify, render_template, request

import excel_io

load_dotenv()

EXCEL_PATH = os.environ.get("EXCEL_FILE_PATH")
if not EXCEL_PATH:
    sys.exit("EXCEL_FILE_PATH not set. Add it to lead-dashboard/.env before running the app.")
if not os.path.isfile(EXCEL_PATH):
    sys.exit(f"Excel file not found: {EXCEL_PATH}")

app = Flask(__name__)


@app.route("/")
def index():
    return render_template(
        "index.html",
        status_options=excel_io.STATUS_OPTIONS,
        assigned_to_options=excel_io.ASSIGNED_TO_OPTIONS,
    )


@app.route("/api/leads")
def api_list_leads():
    try:
        leads = excel_io.read_leads(EXCEL_PATH)
    except excel_io.ExcelIOError as exc:
        return jsonify({"error": str(exc)}), 500
    return jsonify(leads)


@app.route("/api/leads/<lead_id>", methods=["PATCH"])
def api_update_lead(lead_id):
    fields = request.get_json(silent=True) or {}
    if not fields:
        return jsonify({"error": "No fields provided"}), 400
    try:
        updated = excel_io.update_lead(EXCEL_PATH, lead_id, fields)
    except excel_io.ExcelIOError as exc:
        return jsonify({"error": str(exc)}), 400
    return jsonify(updated)


if __name__ == "__main__":
    print(f"Reading/writing: {EXCEL_PATH}")
    # debug=False on purpose: this binds to 0.0.0.0 so devices on the same wifi can
    # reach it, and Flask's interactive debugger must never be exposed off localhost.
    app.run(host="0.0.0.0", port=5001, debug=False, threaded=True)
