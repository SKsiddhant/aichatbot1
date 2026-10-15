import json
import os
import sys

import pytest

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, ROOT)

torch = pytest.importorskip("torch")

import chat  # noqa: E402
import nltk_utils  # noqa: E402
import train as train_mod  # noqa: E402
import app as app_module  # noqa: E402


@pytest.fixture(scope="module")
def trained(tmp_path_factory):
    out = tmp_path_factory.mktemp("model") / "data.pth"
    train_mod.train(os.path.join(ROOT, "intents.json"), str(out), num_epochs=400, verbose=False)
    return str(out)


def test_tokenize_works_without_nltk_data():
    assert nltk_utils.tokenize("Hello, how are you?")[:2] == ["Hello", ","]


def test_bag_of_words_marks_stems():
    bag = nltk_utils.bag_of_words(["Organizing", "stuff"], ["organ", "stuff", "other"])
    assert bag.tolist() == [1, 1, 0]


def test_missing_model_is_a_clear_error(tmp_path):
    with pytest.raises(chat.ModelNotTrained):
        chat.Chatbot(model_path=str(tmp_path / "nope.pth"))


def test_trained_bot_answers_known_and_rejects_gibberish(trained):
    bot = chat.Chatbot(model_path=trained)
    intents = json.load(open(os.path.join(ROOT, "intents.json"), encoding="utf-8"))
    greeting = next(i for i in intents["intents"] if i["tag"] == "greeting")
    assert bot.get_response("Hello") in greeting["responses"]
    assert bot.get_response("zxqv wlkj") == chat.FALLBACK


def test_flask_predict(trained, monkeypatch):
    monkeypatch.setattr(chat, "_bot", chat.Chatbot(model_path=trained))
    client = app_module.app.test_client()
    ok = client.post("/predict", json={"message": "Hi"})
    assert ok.status_code == 200 and ok.get_json()["answer"]
    assert client.post("/predict", json={"message": "  "}).status_code == 400
    assert client.post("/predict", json={"nope": 1}).status_code == 400
    assert client.post("/predict", data="not json").status_code == 400
    assert client.post("/predict", json={"message": "x" * 501}).status_code == 400
    assert client.get("/").status_code == 200


def test_predict_without_model_is_503(monkeypatch, tmp_path):
    monkeypatch.setattr(chat, "_bot", None)
    monkeypatch.setattr(chat, "HERE", str(tmp_path))
    r = app_module.app.test_client().post("/predict", json={"message": "hi"})
    assert r.status_code == 503 and "train.py" in r.get_json()["error"]
