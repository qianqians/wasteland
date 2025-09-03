# -*- coding: UTF-8 -*-
import sys
from __future__ import annotations
from ..engine.engine import *
from .player_data import *
from .scene import *
from .scene_service import *
from ..config.config import *

class PlayerEventHandle(player_event_handle):
    def player_offline(self, _player:player) -> dict:
        return _player.full_info()
    
def main(cfg_file:str):
    load_task_config()
    load_cond_config()
    load_pkg_config()
    load_item_config()
    load_talk_config

    _scene_service1 = SceneService("wasteland", 1)
    _scene_service2 = SceneService("wasteland", 2)
    _app = app()
    _app.build(cfg_file)
    _app.build_player_service(PlayerEventHandle())
    _app.service_mgr.reg_service(_scene_service1)
    _app.service_mgr.reg_service(_scene_service2)
    _app.run(lambda: [s.update() for s in (_scene_service1, _scene_service2)])
    
if __name__ == '__main__':
    main(sys.argv[1])
