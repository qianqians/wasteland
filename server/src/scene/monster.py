# -*- coding: UTF-8 -*-
from __future__ import annotations
import importlib.util
import inspect
from ..engine.engine import *
from ..engine.common_svr import *
from ..helper import const
from .scene import scene

class monster(entity):
    def __init__(self, service_name:str, entity_id:str, mob_table_id:int, pos:position):
        super().__init__(service_name, "monster", entity_id, False)
        self.mob_table_id = mob_table_id
        self.pos = pos
        
        with open('../../excel/Monster.json') as f:
            data = json.load(f)
            self.config = data[str(self.mob_table_id)]
        self.skill:list[int] = json.loads(self.config["skill"])
        
        spec = importlib.util.spec_from_file_location(
            "battle_control", f"{const.ai_script_dir}/{self.config["battle_script"]}")
        self.module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(self.module)
        
    def update(self, _scene:scene):
        self.module.Update(self, _scene)