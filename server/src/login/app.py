import sys
from ..engine.engine import *
import wx_sdk

class LoginEventHandle(login_event_handle):
    def __init__(self, db:str, collection:str):
        super().__init__(db, collection)
        
        self.__get_guid_handle__ = get_guid("wasteland", "account_uuid")

    async def __get_client_account_id__(self, sdk_uuid:str):
        app().trace("LoginEventHandle __get_client_account_id__!")
        uuid_obj = await self.__get_dbproxy__().get_object_one(self.__db__, self.__collection__, {"SDK_UUID":sdk_uuid})
        if not uuid_obj:
            return await self.__get_guid_handle__.gen()
        else:
            return uuid_obj["GUID"]
        
    async def on_login(self, new_gate_name:str, new_conn_id:str, sdk_uuid:str, argvs:dict):
        app().trace("LoginEventHandle on_login!")
        device = await wx_sdk.code2Session("wx51eede0c2706005d", "354d0270312354fe3b00d7d6513acdb8", sdk_uuid)
        accound_id = await self.__get_client_account_id__(device["openid"])
        info_str = await app().redis_proxy.get("wasteland:player_hub_info:{}".format(accound_id))
        if info_str is not None and info_str != "":
            info = json.loads(info_str)
            self.__replace_client__(info["gate"], info["conn_id"], new_gate_name, new_conn_id, False, "其他位置登录!")
        else:
            gate_host = app().ctx.gate_host(new_gate_name)
            forward_client_query_service("wasteland_player_hub_{}".format(argvs["zone"]), new_gate_name, gate_host, new_conn_id, accound_id)
        app().redis_proxy.set("wasteland:player_hub_info:{}".format(accound_id), json.dumps({"gate":new_gate_name, "conn_id":new_conn_id, "device":device}))
    
    async def on_reconnect(self, new_gate_name:str, new_conn_id:str, sdk_uuid:str, argvs:dict):
        app().trace("LoginEventHandle on_reconnect!")
        device = await wx_sdk.code2Session("wx51eede0c2706005d", "354d0270312354fe3b00d7d6513acdb8", sdk_uuid)
        accound_id = await self.__get_client_account_id__(device["openid"])
        info_str = await app().redis_proxy.get("wasteland:player_hub_info:{}".format(accound_id))
        if info_str is not None and info_str != "":
            info = json.loads(info_str)
            self.__replace_client__(info["gate"], info["conn_id"], new_gate_name, new_conn_id, True, "其他位置登录!")
        else:
            gate_host = app().ctx.gate_host(new_gate_name)
            forward_client_query_service("wasteland_player_hub_{}".format(argvs["zone"]), new_gate_name, gate_host, new_conn_id, accound_id)
        app().redis_proxy.set("wasteland:player_hub_info:{}".format(accound_id), json.dumps({"gate":new_gate_name, "conn_id":new_conn_id, "device":device}))
    
def main(cfg_file:str):
    _app = app()
    _app.build(cfg_file)
    _app.build_login_service(LoginEventHandle("wasteland", "account"))
    _app.register_service("login")
    _app.run()
    
if __name__ == '__main__':
    main(sys.argv[1])