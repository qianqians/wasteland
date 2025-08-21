# -*- coding: UTF-8 -*-
import sys
from __future__ import annotations
from ..engine.engine import *
from .player_data import *
from .scene import *

class PlayerEventHandle(player_event_handle):
    def player_offline(self, _player:player) -> dict:
        return _player.full_info()
    
def main(cfg_file:str):
    _app = app()
    _app.build(cfg_file)
    _app.build_player_service(PlayerEventHandle())
    _app.service_mgr.reg_service(SceneService("wasteland", 1))
    _app.service_mgr.reg_service(SceneService("wasteland", 2))
    _app.run()
    
if __name__ == '__main__':
    main(sys.argv[1])
