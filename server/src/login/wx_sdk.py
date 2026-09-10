# -*- coding: UTF-8 -*-
from typing import TypedDict
import aiohttp
import asyncio
import json

WXSdkUrl = "https://api.weixin.qq.com/sns/jscode2session?appid={appid}&secret={secret}&js_code={code}&grant_type=authorization_code"

class WXSessionInfo(TypedDict):
    openid:str = ""
    session_key:str = ""
    unionid:str = ""
    errcode:int = 0
    errmsg:str = ""

async def code2Session(appid:str, secret:str, code:str) -> WXSessionInfo:
    from .app import app
    import traceback

    url = WXSdkUrl.format(appid=appid, secret=secret, code=code)
    result = None

    try:
        async with aiohttp.ClientSession() as session:
            async with session.get(url) as response:
                raw = await response.read()
                text = raw.decode("utf-8", errors="replace")
                result = json.loads(text)
    except Exception as e:
        app().error("wx code2Session exception type:{} value:{}".format(type(e).__name__, repr(e)))
        app().error("wx code2Session traceback:{}".format(traceback.format_exc()))

    return result