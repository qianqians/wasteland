# -*- coding: UTF-8 -*-
from __future__ import annotations
import importlib.util
import inspect
from ..engine.engine.msgpack import *
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
        self.pos.dir = direction.none
        
        self.scene_caller = scene_ntf_client_caller(self)
        self.battle_caller = battle_ntf_client_caller(self)
        
        with open('../../excel/Monster.json') as f:
            data = json.load(f)
            self.config = data[str(self.mob_table_id)]
        
        self.hp = self.config["hp"]
        self.mp = self.config["mp"]
        self.speed = self.config["speed"]
        self.base_attack = self.config["attack"]
            
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
                info.cd_ready = time.time() + info.cd_time
                self.skill.append(info)
        
        spec = importlib.util.spec_from_file_location(
            "battle_control", f"{const.ai_script_dir}/{self.config["battle_script"]}")
        self.module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(self.module)
        
        self.use_skill_cast_spells = float(0)
        self.use_skill_timer:Timer = None
        
        self.hurt_list:list[tuple[str, int]] = []
        self.update_timestamp = time.time()
        
    def update(self, _scene:scene):
        self.module.Update(self, _scene)

    def attack(self, p:player_data, skill_info:skill_info):
        p.be_harm(self.entity_id, skill_info.skill_id, em_harm_type.melee_attack, skill_info.attack+self.base_attack)

    def be_harm(self, attack_entity_id:str, skill_id:int, harm_type:em_harm_type, harm_value:int):
        self.hp -= harm_value
        self.battle_caller.harm(
            attack_entity_id, skill_id, self.pos, harm_type, harm_value)
        
    def is_use_skill(self) -> bool:
        return self.use_skill_cast_spells > time.time()
    
    def use_skill_reset(self):
        self.use_skill_cast_spells = float(0)
        
    def use_skill(self, attack_player:list[player_data], skill_info:skill_info):
        for p in attack_player:
            self.attack(p, skill_info)
        self.battle_caller.use_skill(skill_info.skill_id, self.pos)
        skill_info.cd_ready =  time.time() + skill_info.cd_time
        self.use_skill_cast_spells = time.time() + skill_info.cast_spells
        
    def move(self):
        self.scene_caller.move(self.pos.dir, self.pos) 
        
    def refresh(self):
        self.scene_caller.entity_refresh(dumps(self.client_info()))
        
    @abstractmethod
    def full_info(self) -> dict:
        pass
        
    @abstractmethod
    def hub_info(self) -> dict:
        pass

    @abstractmethod
    def client_info(self) -> dict:
        return {
            "hp": self.hp,
            "mp": self.mp,
            "speed": self.speed,
            "attack": self.base_attack,
            "mob_table_id": self.mob_table_id,
            "use_skill_cast_spells": self.use_skill_cast_spells,
            "postion": position_to_protcol(self.pos) 
        }