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

    def __rsp_err__(self, rsp, err_code:int):
        # 回错误码本身也可能失败（gate 连接已断），这里兜底，避免把上层异常盖掉
        try:
            rsp.err(err_code)
        except Exception as e:
            app().error(f"__rsp_err__ faild! {e}")

    def __on_create_character__(self, rsp:login_create_character_rsp, player_nick_name:str, gender:em_role_gender, appearance:str, novice_village:str):
        app().run_coroutine_async(self.__create_character_callback__(rsp, player_nick_name, gender, appearance, novice_village))

    async def __create_character_callback__(self, rsp:login_create_character_rsp, player_nick_name:str, gender:em_role_gender, appearance:str, novice_village:str):
        try:
            line = 1 #random.randint(1, const.WorldLineCount)
            service_name = f"yunmeng_marsh_{line}"
            gate_host = app().ctx.gate_host(self.GateName)
            argv = {
                "account_id": self.AccountID,
                "player_nick_name": player_nick_name,
                "gender": gender,
                "appearance": appearance,
                "novice_village": novice_village,
            }
            # 必须先确认目标场景 hub 真的存在，否则不能给客户端回“成功”
            if not await forward_client_query_service(service_name, self.GateName, gate_host, self.ConnID, argv):
                app().error(f"__on_create_character__ forward to {service_name} faild! account_id:{self.AccountID}")
                self.__rsp_err__(rsp, error_code.undefined_player_id)
                return
            app().player_mgr.del_player(self.AccountID)
        except Exception as e:
            import traceback
            app().error(f"__on_create_character__ EXCEPTION: {e}-{traceback.format_exc()}")
            self.__rsp_err__(rsp, error_code.undefined_player_id)
            return
        rsp.rsp()

    async def __select_character_callback__(self, rsp:login_select_character_rsp, player_id:str):
        try:
            isOnline = app().redis_proxy.get(const.PlayerIsOnlineKey.format(player_id))
            gate_info_str = app().redis_proxy.get(const.PlayerGateInfoKey.format(player_id))
            if isOnline and gate_info_str is not None and gate_info_str != "":
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
                if zone_info_str is None or zone_info_str == "":
                    app().error(f"__select_character_callback__ no zone line info! player_id:{player_id}")
                    self.__rsp_err__(rsp, error_code.undefined_player_id)
                    return
                zone_info = json.loads(zone_info_str)
                argv =  { "player_id":player_id }
                service_name = f"{zone_info['zone']}_{zone_info['line']}"
                # 目标场景 hub 没注册 / 连不上时，forward 会失败，必须给客户端回错误，
                # 否则客户端收到假的成功响应后会一直卡在选角界面。
                if not await forward_client_query_service(service_name, self.GateName, gate_host, self.ConnID, argv):
                    app().error(f"__select_character_callback__ forward to {service_name} faild! player_id:{player_id}")
                    self.__rsp_err__(rsp, error_code.undefined_player_id)
                    return
                app().trace(f"__select_character_callback__ {service_name} {self.GateName} {gate_host} {self.ConnID} {argv}")
            app().player_mgr.del_player(self.AccountID)
        except Exception as e:
            app().error(f"__select_character_callback__ faild! {e}")
            self.__rsp_err__(rsp, error_code.undefined_player_id)
            return
        app().redis_proxy.set(const.PlayerIsOnlineKey.format(player_id), str(True), ex=3)
        rsp.rsp()

    def __on_select_character__(self, rsp:login_select_character_rsp, player_id:str):
        app().run_coroutine_async(self.__select_character_callback__(rsp, player_id))
