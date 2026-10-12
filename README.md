# Chatbot Deployment with Flask and JavaScript

In this tutorial we deploy the chatbot I created in [this](https://github.com/python-engineer/pytorch-chatbot) tutorial with Flask and JavaScript.

This gives 2 deployment options:
- Deploy within Flask app with jinja2 template
- Serve only the Flask prediction API. The used html and javascript files can be included in any Frontend application (with only a slight modification) and can run completely separate from the Flask App then.

## Setup

```bash
python3 -m venv venv && . venv/bin/activate
pip install -r requirements.txt
```

Optional but recommended (better tokenizing; the bot falls back to a data-free tokenizer if it is missing):

```bash
python -c "import nltk; nltk.download('punkt_tab')"
```

Edit `intents.json` with your own intents and responses, then train and chat:

```bash
python train.py     # writes data.pth
python chat.py      # console chat
```

## Run the web app

```bash
python app.py       # http://127.0.0.1:5000  (jinja2 template + /predict API)
```

`POST /predict` with `{"message": "hello"}` returns `{"answer": "..."}`. If `data.pth` does not exist yet it answers `503` with a hint to run `train.py`.

### Standalone frontend

`standalone-frontend/` can be hosted anywhere. Set `window.CHATBOT_API = "https://your-server"` before loading `app.js` (default `http://127.0.0.1:5000`), and start the server with `CHATBOT_CORS_ORIGINS="https://your-frontend"` so the browser is allowed to call it.

## Tests

```bash
pip install -r requirements-dev.txt && pytest          # Python
npm install && npm run test:js                         # chat widget
```

## Watch the Tutorial
[![Alt text](https://img.youtube.com/vi/a37BL0stIuM/hqdefault.jpg)](https://youtu.be/a37BL0stIuM)  
[https://youtu.be/a37BL0stIuM](https://youtu.be/a37BL0stIuM)

## Note
In the video we implement the first approach using jinja2 templates within our Flask app. Only slight modifications are needed to run the frontend separately. I put the final frontend code for a standalone frontend application in the [standalone-frontend](/standalone-frontend) folder.

## Credits:
This repo was used for the frontend code:
https://github.com/hitchcliff/front-end-chatjs
