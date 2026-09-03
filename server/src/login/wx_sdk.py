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
    url = WXSdkUrl.format(appid=appid, secret=secret, code=code)
    async with aiohttp.ClientSession() as session:
        async with session.get(url) as response:
            result:WXSessionInfo = await response.json()
            if result != None:
                return result
    return None