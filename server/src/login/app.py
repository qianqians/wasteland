# -*- coding: UTF-8 -*-
import sys

from login import wx_sdk
from ..engine.engine import *
from ..engine import login_svr
from .character import *
import google_sdk
import steam_sdk

class LoginErrorCallback(player):
    def __init__(self, entity_id: str, gate_name: str, conn_id: str, prompt:str):
        player.__init__(self, "login", "LoginErrorCallback", entity_id, gate_name, conn_id, False)
        self.Prompt = prompt
        
    def full_info(self) -> dict:
        return {"Prompt":self.Prompt}

    def hub_info(self) -> dict:
        return {}
    
    def client_info(self) -> dict:
        return self.full_info()
    
    def on_migrate_to_other_hub(self, migrate_hub:str):
        pass
    
class LoginEventHandle(login_event_handle):
    def __init__(self, appid:str, secret:str, db:str, collection:str):
        super().__init__(db, collection)
        
        self.AppID = appid
        self.Secret = secret

        self.__get_guid_handle__ = get_guid("wasteland", "account_uuid")

    async def __get_client_account_id__(self, sdk_uuid:str) -> str:
        app().trace("LoginEventHandle __get_client_account_id__!")
        uuid_obj = await self.__get_dbproxy__().get_object_one(self.__db__, self.__collection__, {"SDK_UUID":sdk_uuid})
        if not uuid_obj:
            return await self.__get_guid_handle__.gen()
        else:
            return uuid_obj["GUID"]

    async def __login_wx__(self, new_gate_name:str, new_conn_id:str, sdk_uuid:str, is_replace: bool):
        app().trace("LoginEventHandle on_login!")
        response = await wx_sdk.code2Session(self.AppID, self.Secret, sdk_uuid)
        if response == None:
            _p = LoginErrorCallback(str(uuid.uuid4()), new_gate_name, new_conn_id, "network error")
            _p.create_main_remote_entity()
            return

        if response["errcode"] != None:
            _p = LoginErrorCallback(str(uuid.uuid4()), new_gate_name, new_conn_id, response["errmsg"])
            _p.create_main_remote_entity()
            return

        player_id = await self.__get_client_account_id__(response["openid"])
        _character = LoginCharacterCallback(self, 
            player_id, str(uuid.uuid4()), new_gate_name, new_conn_id, is_replace)
        await _character.init()
        app().player_mgr.add_player(_character)
        _character.create_main_remote_entity()

    async def __login_google__(self, new_gate_name:str, new_conn_id:str, sdk_uuid:str, is_replace: bool):
        app().trace("LoginEventHandle on_login!")
        response = await google_sdk.verify_google_play_player(self.AppID, self.Secret, sdk_uuid)
        if response == None:
            _p = LoginErrorCallback(str(uuid.uuid4()), new_gate_name, new_conn_id, "network error")
            _p.create_main_remote_entity()
            return

        player_id = await self.__get_client_account_id__(response["player_id"])
        _character = LoginCharacterCallback(self, 
            player_id, str(uuid.uuid4()), new_gate_name, new_conn_id, is_replace)
        await _character.init()
        app().player_mgr.add_player(_character)
        _character.create_main_remote_entity()

    async def __login_steam__(self, new_gate_name:str, new_conn_id:str, sdk_uuid:str, is_replace: bool):
        response = await steam_sdk.code2Session(self.AppID, self.Secret, sdk_uuid)
        error = None
        steamid = None
        while True:
            if response == None:
                error = "network error"
                break

            response = response.get("response")
            if response == None:
                error = "invalid steam ticket"
                break

            err = response.get("error")
            if err != None:
                error = f"steam check errorcode:{err.get('errorcode')} errordesc:{err.get('errordesc')}"
                break

            params = response.get("params")
            if params == None:
                error = "invalid steam ISteamUserAuth"
                break

            result = params.get("result")
            if result != "OK":
                error = "steam ISteamUserAuth failed"
                break

            vacbanned = params.get("vacbanned")
            if vacbanned:
                error = "player is be vacbanned"
                break

            publisherbanned = params.get("publisherbanned")
            if publisherbanned:
                error = "player is be publisherbanned"
                break
            
            steamid = params.get("steamid")
            if steamid == None:
                error = "steamid is none"
            
            break

        if error != None:
            _p = LoginErrorCallback(str(uuid.uuid4()), new_gate_name, new_conn_id, error)
            _p.create_main_remote_entity()
            return

        accound_id = await self.__get_client_account_id__(steamid)
        _character = LoginCharacterCallback(self, 
            accound_id, str(uuid.uuid4()), new_gate_name, new_conn_id, is_replace)
        await _character.init()
        app().player_mgr.add_player(_character)
        _character.create_main_remote_entity()
        
    async def __login__(self, new_gate_name:str, new_conn_id:str, sdk_uuid:str, is_replace: bool, platform :login_svr.em_platform):
        if platform == login_svr.em_platform.EPlatformGoogle:
            self.__login_google__(new_gate_name, new_conn_id, sdk_uuid, is_replace)
        elif platform == login_svr.em_platform.EPlatformSteam:
            self.__login_steam__(new_gate_name, new_conn_id, sdk_uuid, is_replace)
        elif platform == login_svr.em_platform.EPlatformWXMiniGame:
            self.__login_wx__(new_gate_name, new_conn_id, sdk_uuid, is_replace)
                
    async def on_login(self, new_gate_name:str, new_conn_id:str, sdk_uuid:str, argvs:dict):
        app().trace("LoginEventHandle on_login!")
        self.__login__(new_gate_name, new_conn_id, sdk_uuid, False, argvs["em_platform"])
    
    async def on_reconnect(self, new_gate_name:str, new_conn_id:str, sdk_uuid:str, argvs:dict):
        app().trace("LoginEventHandle on_reconnect!")
        self.__login__(new_gate_name, new_conn_id, sdk_uuid, True, argvs["em_platform"])
    
def main(cfg_file:str):
    _app = app()
    _app.build(cfg_file)
    _app.build_login_service(LoginEventHandle("89726211606-14i9eofkndg6bmkm5s0jud47lv4r862c.apps.googleusercontent.com", "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", "wasteland", "account"))
    _app.register_service("login")
    _app.run()
    
if __name__ == '__main__':
    main(sys.argv[1])