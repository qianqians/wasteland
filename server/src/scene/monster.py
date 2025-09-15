# -*- coding: UTF-8 -*-
from __future__ import annotations
import importlib.util
import inspect
from ..engine.engine import *
from ..engine.common_svr import *
from ..helper import const
from .scene import scene
from .player_data import *

class monster(entity):
    def __init__(self, service_name:str, entity_id:str, mob_table_id:int, pos:position):
        super().__init__(service_name, "monster", entity_id, False)
        self.mob_table_id = mob_table_id
        self.pos = pos
        
        with open('../../excel/Monster.json') as f:
            data = json.load(f)
            self.config = data[str(self.mob_table_id)]
        
        self.hp = self.config["hp"]
        self.mp = self.config["mp"]
        self.speed = self.config["speed"]
        self.attack = self.config["attack"]
            
        self.skill:list[skill_info] = []
        skills = json.loads(self.config["skill"])
        for skill_id in skills:
            with open('../../excel/Skill.json') as f:
                skill_data = json.load(f)
                skill = skill_data[str(skill_id)]
                info = skill_info()
                info.skill_id = skill_id
                info.attack = skill["attack"]
                info.attack_range = skill["attack_range"]
                info.cd_time = skill["cd"]
                self.skill.append(info)
        
        spec = importlib.util.spec_from_file_location(
            "battle_control", f"{const.ai_script_dir}/{self.config["battle_script"]}")
        self.module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(self.module)
        
        self.hurt_list:list[tuple[str, int]] = []
        
        self.update_timestamp = time.time() * 1000
        
    def update(self, _scene:scene):
        self.module.Update(self, _scene)

    def attack(self, p:player_data):
        p.attribute_data.hp -= self.attack