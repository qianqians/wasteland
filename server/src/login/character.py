# -*- coding: UTF-8 -*-
import sys
from ..engine.engine import *
from ..engine.login_svr import *
from ..engine.common_svr import * # type: ignore
from ..helper import const

async def __get_object_one_callback_set_future__(future:asyncio.Future, data:list):
    if not future.done():
        future.set_result(data)

class LoginCharacterCallback(player):
    def __init__(self, handle:login_event_handle, account_id:str, gate_name:str, conn_id:str, is_replace: bool):
        player.__init__(self, "login", "LoginCharacterCallback", account_id, gate_name, conn_id, False)

        self.handle = handle
        self.is_replace = is_replace

        self.user_id = account_id
        self.AccountID = account_id
        self.DBproxy = app().dbproxy_mgr.get_dbproxy()

        self.GateName = gate_name
        self.ConnID = conn_id

        self.Character:list[dict] = []

        self.LoginModule = login_module(self)
        self.LoginModule.on_create_character.append(self.__on_create_character__)
        self.LoginModule.on_select_character.append(self.__on_select_character__)

    def __get_object_one_callback_data__(self, data_list:list[dict]):
        from .app import app
        app().trace(f"__get_object_one_callback_data__ data_list:{data_list}")
        _list:list[dict] = []
        for d in data_list:
            del d['_id']
            _list.append(d)
        self.Character.extend(_list)

    def __get_object_one_callback_end__(self, future:asyncio.Future):
        from .app import app
        try:
            app().trace("__get_object_one_callback_end__!")
            app().run_coroutine_async(__get_object_one_callback_set_future__(future, self.Character))
            app().trace("__get_object_one_callback_end__! future.set_result")
        except Exception as e:
            app().trace(f"__get_object_one_callback_end__ faild! {e}")

    async def init(self) -> list[dict]:
        future = asyncio.Future()
        self.DBproxy.get_object_info("wasteland", "player_data", {"account_id": self.AccountID}, 0, 100, "", False,
            lambda _list: self.__get_object_one_callback_data__(_list),
            lambda : self.__get_object_one_callback_end__(future))
        return await future

    def full_info(self) -> dict:
        return {"Characters":self.Character}

    def hub_info(self) -> dict:
        return {}

    def client_info(self) -> dict:
        return self.full_info()

    def __on_create_character__(self, rsp:login_create_character_rsp, player_nick_name:str, gender:em_role_gender, appearance:str, novice_village:str):
        try:
            line = 1 #random.randint(1, const.WorldLineCount)
            gate_host = app().ctx.gate_host(self.GateName)
            argv = {
                "account_id": self.AccountID,
                "player_nick_name": player_nick_name,
                "gender": gender,
                "appearance": appearance,
                "novice_village": novice_village,
            }
            coro = forward_client_query_service(f"yunmeng_marsh_{line}", self.GateName, gate_host, self.ConnID, argv)
            app().run_coroutine_async(coro)

        except Exception as e:
            import traceback
            app().error(f"__on_create_character__ EXCEPTION: {e}-{traceback.format_exc()}")
        rsp.rsp()

    async def __select_character_callback__(self, rsp:login_select_character_rsp, player_id:str):
        try:
            gate_info_str = app().redis_proxy.get(const.PlayerGateInfoKey.format(player_id))
            if gate_info_str is not None and gate_info_str != "":
                gate_info = json.loads(gate_info_str)
                old_gate_name = gate_info.get("gate_name") or gate_info.get("gate") or ""
                old_conn_id = gate_info.get("conn_id") or ""
                if old_gate_name and old_conn_id:
                    self.handle.__replace_client__(
                        old_gate_name,
                        old_conn_id,
                        self.GateName,
                        self.ConnID,
                        self.AccountID, # sdk_uuid
                        {},           # argvs
                        self.is_replace,
                        "Login at other terminal device!")
                else:
                    app().warn(f"__select_character_callback__ invalid gate_info: {gate_info}")
                app().trace(f"__select_character_callback__ gate_info:{gate_info} {self.GateName} {self.ConnID}")
            else:
                gate_host = app().ctx.gate_host(self.GateName)
                zone_info_str = app().redis_proxy.get(const.PlayerZoneLineInfoKey.format(player_id))
                if zone_info_str is not None and zone_info_str != "":
                    zone_info = json.loads(zone_info_str)
                    argv =  { "player_id":player_id }
                    await forward_client_query_service(f"{zone_info['zone']}_{zone_info['line']}", self.GateName, gate_host, self.ConnID, argv)
                    app().trace(f"__select_character_callback__ {zone_info['zone']}_{zone_info['line']} {self.GateName} {gate_host} {self.ConnID} {argv}")
                else:
                    rsp.err(error_code.undefined_player_id)
                    return
        except Exception as e:
            app().error(f"__select_character_callback__ faild! {e}")
        rsp.rsp()

    def __on_select_character__(self, rsp:login_select_character_rsp, player_id:str):
        app().run_coroutine_async(self.__select_character_callback__(rsp, player_id))
