import sys
from ..engine.engine import *

class LoginEventHandle(login_event_handle):
    def __init__(self, db:str, collection:str):
        super().__init__(db, collection)
        
        self.__get_guid_handle__ = get_guid("wasteland", "account_uuid")

    async def __get_client_account_id__(self, sdk_uuid:str):
        app().trace("LoginEventHandle __get_client_account_id__!")
        uuidObj = await self.__get_dbproxy__().get_object_one(self.__db__, self.__collection__, {"SDK_UUID":sdk_uuid})
        if not uuidObj:
            return await self.__get_guid_handle__.gen()
        else:
            return uuidObj["GUID"]
        
    async def on_login(self, new_gate_name:str, new_conn_id:str, sdk_uuid:str, argvs:dict):
        app().trace("LoginEventHandle on_login!")
        accound_id = await self.__get_client_account_id__(sdk_uuid)
        info_str = app().redis_proxy.get("wasteland:player_hub_info:{}".format(accound_id))
        if info_str is not None and info_str != "":
            info = json.loads(info_str)
            self.__replace_client__(info["gate"], info["conn_id"], new_gate_name, new_conn_id, False, "其他位置登录!")
        else:
            gate_host = app().ctx.gate_host(new_gate_name)
            forward_client_query_service("wasteland_player_hub_{}".format(argvs["zone"]), new_gate_name, gate_host, new_conn_id, accound_id)
        app().redis_proxy.set("wasteland:player_hub_info:{}".format(accound_id), json.dumps({"gate":new_gate_name, "conn_id":new_conn_id}))
    
    async def on_reconnect(self, new_gate_name:str, new_conn_id:str, sdk_uuid:str, argvs:dict):
        app().trace("LoginEventHandle on_reconnect!")
        accound_id = await self.__get_client_account_id__(sdk_uuid)
        info_str = app().redis_proxy.get("wasteland:player_hub_info:{}".format(accound_id))
        if info_str is not None and info_str != "":
            info = json.loads(info_str)
            self.__replace_client__(info["gate"], info["conn_id"], new_gate_name, new_conn_id, True, "其他位置登录!")
            app().redis_proxy.set("wasteland:player_hub_info:{}".format(accound_id), json.dumps({"gate":new_gate_name, "conn_id":new_conn_id}))
        else:
            gate_host = app().ctx.gate_host(new_gate_name)
            forward_client_query_service("wasteland_player_hub_{}".format(argvs["zone"]), new_gate_name, gate_host, new_conn_id, accound_id)
    
def main(cfg_file:str):
    _app = app()
    _app.build(cfg_file)
    _app.build_login_service(LoginEventHandle("wasteland", "account"))
    _app.register_service("login")
    _app.run()
    
if __name__ == '__main__':
    main(sys.argv[1])