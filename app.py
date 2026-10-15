import os

from flask import Flask, jsonify, render_template, request

import chat

MAX_MESSAGE_LENGTH = 500

app = Flask(__name__)

# Optional CORS so the standalone-frontend can be served from another origin.
# Example: CHATBOT_CORS_ORIGINS="http://localhost:8000,https://my-site.example"
_origins = [o.strip() for o in os.environ.get("CHATBOT_CORS_ORIGINS", "").split(",") if o.strip()]
if _origins:
    from flask_cors import CORS
    CORS(app, resources={r"/predict": {"origins": _origins}})


@app.get("/")
def index_get():
    return render_template("base.html")


@app.post("/predict")
def predict():
    payload = request.get_json(silent=True)
    text = payload.get("message") if isinstance(payload, dict) else None
    if not isinstance(text, str) or not text.strip():
        return jsonify(error='Send JSON like {"message": "hello"}.'), 400
    if len(text) > MAX_MESSAGE_LENGTH:
        return jsonify(error=f"Message must be at most {MAX_MESSAGE_LENGTH} characters."), 400
    try:
        answer = chat.get_response(text.strip())
    except chat.ModelNotTrained as exc:
        return jsonify(error=str(exc)), 503
    return jsonify(answer=answer)


if __name__ == "__main__":
    # The Werkzeug debugger allows remote code execution; enable it only on purpose: FLASK_DEBUG=1 python app.py
    app.run(debug=os.environ.get("FLASK_DEBUG") == "1")
