# -*- coding: UTF-8 -*-
import sys
import requests
import json
from typing import Optional, Dict, Any

GoogleTokenUrl = "https://oauth2.googleapis.com/token"
GoogleGamesPlayerUrl = "https://games.googleapis.com/games/v1/players/me"

def exchange_auth_code_for_token(client_id:str, secret:str, auth_code: str) -> Optional[Dict[str, Any]]:
    payload = {
        "code": auth_code,
        "client_id": client_id,
        "client_secret": secret,
        "grant_type": "authorization_code",
        "redirect_uri": "",
    }

    response = requests.post(GoogleTokenUrl, data=payload, timeout=10)
    if response.status_code != 200:
        from .app import app
        app().error(f"[Error] Failed to exchange code: {response.status_code}, {response.text}")
        return None

    return response.json()


def get_player_profile(access_token: str) -> Optional[Dict[str, Any]]:
    headers = {
        "Authorization": f"Bearer {access_token}"
    }

    response = requests.get(GoogleGamesPlayerUrl, headers=headers, timeout=10)
    if response.status_code != 200:
        from .app import app
        app().error(f"[Error] Failed to fetch player profile: {response.status_code}, {response.text}")
        return None

    return response.json()


def verify_google_play_player(client_id:str, secret:str, server_auth_code: str):
    token_data = exchange_auth_code_for_token(client_id, secret, server_auth_code)
    if not token_data:
        from .app import app
        app().error("Invalid auth code or token exchange failed")
        return None

    access_token = token_data.get("access_token")

    player_data = get_player_profile(access_token)
    if not player_data:
        from .app import app
        app().error("Failed to retrieve Google Play player profile")
        return None

    player_id = player_data.get("playerId")
    display_name = player_data.get("displayName")
    avatar_url = player_data.get("avatarImageUrl")

    return {
        "player_id": player_id,
        "display_name": display_name,
        "avatar_url": avatar_url,
    }