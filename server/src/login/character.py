# -*- coding: UTF-8 -*-
import sys
from ..engine.engine import *
from ..engine.login_svr import *
from ..engine.common_svr import *
from ..helper import const

async def __get_object_one_callback_set_future__(future:asyncio.Future, data:dict):
    future.set_result(data)

class LoginCharacterCallback(player):
    def __init__(self, handle:login_event_handle, account_id:str, entity_id:str, gate_name:str, conn_id:str, is_replace: bool):
        player.__init__(self, "login", "LoginCharacterCallback", entity_id, gate_name, conn_id, False)
        
        self.handle = handle
        self.is_replace = is_replace
        
        self.AccountID = account_id
        self.DBproxy = app().dbproxy_mgr.get_dbproxy()
        
        self.GateName = gate_name
        self.ConnID = conn_id
        
        self.Character:list[dict] = []
        
        self.LoginModule = login_module(self)
        self.LoginModule.on_create_character.append(self.__on_create_character__)
        self.LoginModule.on_select_character.append(self.__on_select_character__)
    
    def __get_object_one_callback_data__(self, data_list:list):
        from .app import app
        app().trace(f"__get_object_one_callback_data__ data_list:{data_list}")
        self.Character.extend(data_list)
        
    async def init(self) -> list[dict]:
        from .app import app
        future = asyncio.Future()
        self.DBproxy.get_object_info("wasteland", "players", {"accound_id": self.AccountID}, 0, 100, "", False, 
            lambda _list: self.__get_object_one_callback_data__(_list),
            lambda : app().run_coroutine_async(__get_object_one_callback_set_future__(future, self.Character)))
        return await future
    
    def full_info(self) -> dict:
        return {"Characters":self.Character}

    def hub_info(self) -> dict:
        return {}
    
    def client_info(self) -> dict:
        return self.full_info()
    
    def on_migrate_to_other_hub(self, migrate_hub:str):
        pass
    
    def __on_create_character__(self, rsp:login_create_character_rsp, player_nick_name:str, gender:em_role_gender, appearance:em_player_appearance, area:str):
        line = random.randint(1, const.WorldLineCount)
        gate_host = app().ctx.gate_host(self.GateName)
        argv = {
            "player_id": self.PlayerID,
            "player_nick_name": player_nick_name,
            "gender": gender,
            "appearance": appearance,
        }
        forward_client_query_service(f"{area}_{line}", self.GateName, gate_host, self.ConnID, argv)
        rsp.rsp()
        
    async def __select_character_callback__(self, rsp:login_select_character_rsp, player_id:str):
        gate_info_str = await app().redis_proxy.get(const.PlayerGateInfoKey.format(player_id))
        if gate_info_str is not None and gate_info_str != "":
            gate_info = json.loads(gate_info_str)
            self.handle.__replace_client__(
                gate_info["gate"], 
                gate_info["conn_id"], 
                self.GateName, 
                self.ConnID, 
                self.is_replace, 
                "Login at other terminal device!")
        else:
            gate_host = app().ctx.gate_host(self.GateName)
            zone_info_str = await app().redis_proxy.get(const.PlayerZoneLineInfoKey.format(player_id))
            if zone_info_str is not None and zone_info_str != "":
                zone_info = json.loads(zone_info_str)
                argv =  {"player_id":player_id}
                forward_client_query_service(f"{zone_info['zone']}_{zone_info['line']}", self.GateName, gate_host, self.ConnID, argv)
            else:
                rsp.err(error_code.undefined_player_id)
                return
        rsp.rsp(self.Character[0])
        
    def __on_select_character__(self, rsp:login_select_character_rsp, player_id:str):
        app().run_coroutine_async(self.__select_character_callback__(rsp, player_id))