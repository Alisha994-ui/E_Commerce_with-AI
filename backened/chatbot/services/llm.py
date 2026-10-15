"""
Small LLM client used by the chatbot.

Providers (set CHATBOT_LLM_PROVIDER in .env):
    openai  -> OpenAI Chat Completions API (default, needs OPENAI_API_KEY)
    none    -> no AI; the chatbot runs on its built-in rule engine only

If OPENAI_API_KEY is empty, the chatbot automatically uses the rule
engine only.

The chatbot never depends on the LLM to answer. If the LLM is down,
slow or returns garbage, the rule engine answers instead.
"""

import json
import logging
import re

import requests
from django.conf import settings
from django.core.cache import cache

logger = logging.getLogger(__name__)

UNAVAILABLE_CACHE_KEY = "chatbot:llm-unavailable"


class LLMError(Exception):
    pass


def _setting(name, default=None):
    return getattr(settings, name, default)


def get_provider():
    return str(_setting("CHATBOT_LLM_PROVIDER", "openai")).strip().lower()


def is_enabled():
    return get_provider() == "openai" and bool(_setting("OPENAI_API_KEY", ""))


def is_available():
    """False when disabled or when a recent call failed (circuit breaker)."""
    return is_enabled() and not cache.get(UNAVAILABLE_CACHE_KEY)


def _mark_unavailable():
    seconds = int(_setting("CHATBOT_LLM_RETRY_AFTER", 60))
    cache.set(UNAVAILABLE_CACHE_KEY, True, seconds)


def chat(messages, json_mode=False, max_tokens=300, temperature=0.2):
    """
    Send chat messages ([{"role": ..., "content": ...}]) and return text.
    Raises LLMError on any failure.
    """
    if not is_available():
        raise LLMError("LLM is disabled or temporarily unavailable.")

    try:
        return _chat_openai(messages, json_mode, max_tokens, temperature)

    except requests.exceptions.RequestException as error:
        logger.warning("Chatbot LLM request failed: %s", error)
        _mark_unavailable()
        raise LLMError(str(error)) from error

    except (KeyError, IndexError, ValueError, TypeError) as error:
        logger.warning("Chatbot LLM returned an unexpected response: %s", error)
        raise LLMError(str(error)) from error


def chat_json(messages, max_tokens=200):
    """Same as chat(), but parses and returns a dict."""
    text = chat(messages, json_mode=True, max_tokens=max_tokens, temperature=0)
    data = parse_json(text)

    if not isinstance(data, dict):
        raise LLMError("LLM did not return a JSON object.")

    return data


def parse_json(text):
    text = (text or "").strip()
    text = text.replace("```json", "").replace("```", "").strip()

    try:
        return json.loads(text)
    except json.JSONDecodeError:
        match = re.search(r"\{.*\}", text, re.DOTALL)
        if match:
            try:
                return json.loads(match.group(0))
            except json.JSONDecodeError:
                pass

    raise LLMError("LLM returned invalid JSON.")


# ---------------------------------------------------------------------
# Provider
# ---------------------------------------------------------------------

def _chat_openai(messages, json_mode, max_tokens, temperature):
    payload = {
        "model": _setting("OPENAI_MODEL", "gpt-4o-mini"),
        "messages": messages,
        "max_tokens": max_tokens,
        "temperature": temperature,
    }

    if json_mode:
        payload["response_format"] = {"type": "json_object"}

    response = requests.post(
        "https://api.openai.com/v1/chat/completions",
        headers={
            "Authorization": f"Bearer {_setting('OPENAI_API_KEY', '')}",
            "Content-Type": "application/json",
        },
        json=payload,
        timeout=int(_setting("CHATBOT_LLM_TIMEOUT", 60)),
    )
    response.raise_for_status()

    return response.json()["choices"][0]["message"]["content"].strip()
