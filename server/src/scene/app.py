# -*- coding: UTF-8 -*-
from __future__ import annotations
import sys
from ..engine.engine import *
from .player_data import *
from .scene import *
from .scene_service import *
from .scene_map_data import *

class PlayerEventHandle(player_event_handle):
    def __init__(self) -> None:
        super().__init__()
        self.__app__ = app()

    def player_offline(self, _player:player) -> dict:
        self.__app__.trace(f"player_offline {_player.entity_id}")
        _scene_yunmeng_marsh_1 = self.__app__.service_mgr.get_service("yunmeng_marsh_1")
        _scene_yunmeng_marsh_1.leave_scene(_player)
        return _player.full_info()

def main(cfg_file:str):
    _app = app()
    _app.build(cfg_file)
    _app.build_player_service(PlayerEventHandle())

    _app.service_mgr.reg_service(scene_service("yunmeng_marsh", 1))

    _app.register_migrate("player_data", lambda entity_id, main_gate_name, main_conn_id, gates, hubs, argvs :
        migrate_player(main_gate_name, main_conn_id, entity_id, gates, hubs, argvs))

    _app.run(_scene_yunmeng_marsh_1.update)

if __name__ == '__main__':
    main(sys.argv[1])
