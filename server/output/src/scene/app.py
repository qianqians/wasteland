# -*- coding: UTF-8 -*-
from __future__ import annotations
import sys
from ..engine.engine import *
from .player_data import *
from .scene import *
from .scene_service import *
from ..config.config import *
from .scene_map_data import *

class PlayerEventHandle(player_event_handle):
    def player_offline(self, _player:player) -> dict:
        return _player.full_info()
    
def main(cfg_file:str):
    load_task_config()
    load_cond_config()
    load_pkg_config()
    load_item_config()
    load_talk_config()
    load_monster_config()
    load_skill_config()
    
    #load_scene_spawn_point()

    _app = app()
    _app.build(cfg_file)
    _app.build_player_service(PlayerEventHandle())

    _scene_service1 = scene_service("wasteland", 1)
    _scene_service2 = scene_service("wasteland", 2)
    _app.service_mgr.reg_service(_scene_service1)
    _app.service_mgr.reg_service(_scene_service2)

    _app.register_migrate("player_data", lambda entity_id, main_gate_name, main_conn_id, gates, hubs, argvs : 
        migrate_player(main_gate_name, main_conn_id, entity_id, gates, hubs, argvs))
    
    _app.run(lambda: [s.update() for s in (_scene_service1, _scene_service2)])
    
if __name__ == '__main__':
    main(sys.argv[1])
