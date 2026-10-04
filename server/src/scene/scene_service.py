# -*- coding: UTF-8 -*-
from __future__ import annotations
from ..engine.engine import *
from ..helper import const
from ..config.scene_config import *
from .data.attribute_data import *
from .data.equip_data import *
from .data.scene_data import *
from .data.bag_data import *
from .data.task_data import *
from .scene_map_data import *
from .scene import *

async def load_or_create_player(_service:scene_service, gate_name:str, conn_id:str, client_info:dict):
    try:
        player_id = client_info.get("player_id", str(uuid.uuid4()))

        # 换设备/重连正常走的是 gate 的 Transfer：旧 gate 把这条连接上的实体
        # 用 TransferEntityControl 通知各个 hub，hub 再改绑 conn 并重下发实体。
        # 但旧连接在 gate 上已经不存在时（客户端断开后短时间内重登很常见），
        # gate 没有实体可转，只会回一个 TransferMsgEnd，场景服永远收不到通知，
        # 新客户端就拿不到自己的实体（登录后一直没反应）。
        # 所以这里按 player_id 兜一层：玩家还在场景里，就直接改绑到新连接并重下发实体。
        _exist = app().player_mgr.get_player(player_id)
        _scene = getattr(_exist, "scene", None) if _exist is not None else None
        if _exist is not None and _scene is not None and _scene.players.get(_exist.user_id) is _exist:
            if _exist.client_gate_name == gate_name and _exist.client_conn_id == conn_id:
                app().trace(f"load_or_create_player already bind! player_id:{player_id} gate_name:{gate_name} conn_id:{conn_id}")
                return
            app().trace(f"load_or_create_player rebind! player_id:{player_id} old:{_exist.client_gate_name}/{_exist.client_conn_id} new:{gate_name}/{conn_id}")
            # is_main=True / is_reconnect=False → 走 create_remote_entity，把实体重新下发给新连接；
            # 同时会刷新心跳时间（player.on_transfer_conn），不会被"玩家心跳超时"立刻踢出场景。
            app().player_mgr.update_player_conn(player_id, True, False, gate_name, conn_id)
            app().redis_proxy.set(const.PlayerGateInfoKey.format(player_id), json.dumps({"gate_name":gate_name, "conn_id":conn_id}))
            return

        # 玩家不在场景里（或已经被心跳摘掉过）：走原来的读档/建号流程，会重新 entry_scene
        query = {"player_id":player_id}
        await player_data.load_or_create_entity(query, "wasteland", "player_data",
            lambda:player_data.create(client_info["account_id"], player_id),
            lambda data: create_player(_service, gate_name, conn_id, player_id, query, client_info, data))
        app().redis_proxy.set(const.PlayerGateInfoKey.format(player_id), json.dumps({"gate_name":gate_name, "conn_id":conn_id}))
    except Exception as e:
        app().error(f"load_or_create_player Exception:{e}")

def create_player(_service:scene_service, gate_name:str, conn_id:str, player_id:str, query:dict, client_info:dict, info:dict):
    app().trace(f"create_player gate_name:{gate_name}, conn_id:{conn_id}, player_id:{player_id}")
    try:
        if "account_id" in client_info:
            info["account_id"] = client_info["account_id"]
            info["player_nick_name"] = client_info["player_nick_name"]
            info["gender"] = client_info["gender"]
            info["appearance"] = client_info["appearance"]

        if "scene_data" not in info:
            app().trace("init scene_data novice_village begin!")
            novice_village = _service.get_novice_village(client_info["novice_village"])
            app().trace(f"init scene_data novice_village:{novice_village} end!")
            if novice_village == None:
                app().error(f"Novice village not found for player={player_id} client_info={client_info}")
                return
            info["scene_data"] = novice_village
        #if "equip_data" not in info:
        #    info["equip_data"] = equip_create(client_info["gender"])

        player = player_data(_service.service_name, gate_name, conn_id, player_id, query, info)
        scene_name = player.scene_data.scene_name
        scene_line = _service.line
        _scene = _service.scenes.get(scene_name, None)
        if _scene != None:
            _scene.entry_scene(player)
            player.entry_scene(_scene)
            app().player_mgr.add_player(player)
            app().redis_proxy.set(const.PlayerZoneLineInfoKey.format(player_id), json.dumps({"zone":_service.area, "line":scene_line}))
        else:
            app().error(f"scene:{scene_name}_{scene_line} not found!")

        if "account_id" in client_info:
            player.set_dirty()
            player.save_entity()

    except Exception as e:
        app().error(f"create_player Exception:{e}")

class scene_service(service):
    def __init__(self, area:str, scene_line:int):
        super().__init__(f"{area}_{scene_line}")
        self.area = area
        self.line = scene_line

        self.scenes:dict[str, scene] = {}
        for s in SceneInfos:
            if s["area"] != area: continue
            scene_name = s["scene_name"]
            load_scene_map(scene_name)

            _scene = scene(area, scene_name, scene_line)
            _scene.novice_village = s["novice_villages"]
            _scene.spawn_point = s["spawn_point"]
            self.scenes[scene_name] = _scene

    def leave_scene(self, player:player_data):
        for _scene in self.scenes.values():
            if _scene.scene_name == player.scene_data.scene_name:
                _scene.leave_scene(player)
                break

    def update(self):
        for _scene in self.scenes.values():
            _scene.update()

    def get_novice_village(self, scene_name:str) -> scene_postion:
        _scene = self.scenes[scene_name]
        pos:postion = _scene.spawn_point
        novice_village:scene_postion = {
            "scene_name": scene_name,
            "scene_line": self.line,
            "pos": pos,
        }
        return novice_village

    def on_migrate(self, _entity:entity|player):
        if _entity.entity_type == "player_data":
            _player_data:player_data = _entity
            _scene = self.scenes[_player_data.scene_data.scene_name]
            _scene.entry_scene(_player_data)
            _player_data.entry_scene(_scene)

    def hub_query_service_entity(self, queryer_hub_name:str):
        pass

    def client_query_service_entity(self, queryer_gate_name:str, queryer_client_conn_id:str, queryer_client_info:dict):
        app().info(f"client_query_service_entity begin! gate_name:{queryer_gate_name} client_conn_id:{queryer_client_conn_id}")
        app().run_coroutine_async(load_or_create_player(self, queryer_gate_name, queryer_client_conn_id, queryer_client_info))

    def client_query_service_entity_ext(self, info:list[(str, str, dict)]):
        pass
