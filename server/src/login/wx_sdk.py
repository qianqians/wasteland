import sys
import aiohttp
import asyncio
import json

async def code2Session(appid:str, secret:str, code:str):
    url = f"https://api.weixin.qq.com/sns/jscode2session?appid={appid}&secret={secret}&js_code={code}&grant_type=authorization_code"
    async with aiohttp.ClientSession() as session:
        async with session.get(url) as response:
            result = await response.text()
            if result != None:
                return json.loads(result)
    return None