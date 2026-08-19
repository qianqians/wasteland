# -*- coding: UTF-8 -*-
from __future__ import annotations
from threading import Timer
import bisect
from ..engine.engine import *
from ..engine.battle_ntf_client_svr import *
from ..config import *
from .player_data import *
from .scene import *

class em_victory_team(Enum):
    em_victory_battle_keep_going = 0
    em_victory_team_self = 1
    em_victory_team_enemy = -1

class battle:
    def __init__(self, _scene:scene, self_handle:player_data, enemy_handle:player_data, self_info:battle_info, enemy_info:battle_info):
        self.scene = _scene

        if self_handle is not None: self.self_caller = battle_ntf_client_caller(self_handle)
        if enemy_handle is not None: self.enemy_caller = battle_ntf_client_caller(enemy_handle)

        self.self_info = self_info
        self.enemy_info = enemy_info
        self.__ntf_battle_info__()

        self.auto_battle_info:dict[str, int] = {}
        self.round_battle_info:dict[str, tuple[str, int]] = {}
        self.__not_action__:dict[str, int] = {}

        self.__timer_round__ = Timer(29.99, self.__battle_one_round_timer__)
        self.__timer_round__.start()

    def __ntf_battle_info__(self):
        if self.self_caller is not None: self.self_caller.start_battle(self.self_info, self.enemy_info)
        if self.enemy_caller is not None: self.enemy_caller.start_battle(self.enemy_info, self.self_info)

    #
    # 一个队伍的所有角色倒下即战斗结束
    # self  胜利返回 1
    # enemy 胜利返回 -1
    # 战斗未结束返回 0
    #
    def __check_battle_end__(self) -> int:
        is_failed = True
        for d in self.self_info.battle_team:
            if d.abonus.hp > 0:
                is_failed = False
                break
        if is_failed:
            return em_victory_team.em_victory_team_enemy

        is_failed = True
        for d in self.enemy_info.battle_team:
            if d.abonus.hp > 0:
                is_failed = False
                break
        if is_failed:
            return em_victory_team.em_victory_team_self
        return em_victory_team.em_victory_battle_keep_going

    def __check_entity_complete_setting__(self, entity_id:str) -> bool:
        if entity_id in self.auto_battle_info:
            return True
        if entity_id in self.round_battle_info:
            return True
        return False

    def __check_complete_round__(self) -> bool:
        for d in self.self_info.battle_team:
            if not self.__check_entity_complete_setting__(d.entity_id):
                return False
        for d in self.enemy_info.battle_team:
            if not self.__check_entity_complete_setting__(d.entity_id):
                return False
        return True

    def __sort_battle_entity__(self) -> list[battle_entity]:
        l:list[battle_entity] = []
        for d in self.self_info.battle_team:
            bisect.insort(l, d, key=lambda p: p.speed)
        for d in self.enemy_info.battle_team:
            bisect.insort(l, d, key=lambda p: p.speed)
        return l

    def __get_target__(self, target:str) -> battle_entity:
        for t in self.self_info.battle_team:
            if t.entity_id == target: return t
        for t in self.enemy_info.battle_team:
            if t.entity_id == target: return t
        return None

    def __use_skill__(self, e:battle_entity, skill_id:int, target:str):
        skc:skill_config = None
        tg:list[battle_entity] = []
        if target != "": tg:list[battle_entity] = [self.__get_target__(target)]
        for skillc in configs.skill_list:
            if skillc["id"] == skill_id:
                skc = skillc
                team:list[battle_entity] = []
                if skillc["skill_type"] == em_skill_type.em_skill_attack: team = self.enemy_info.battle_team
                elif skillc["skill_type"] == em_skill_type.em_skill_revive: team = self.self_info.battle_team
                num = skc["attack_range"]-len(tg)
                if num > 0: tg.extend(random.choices(team, k=num))
                break
        for t in tg:
            if skillc["skill_type"] == em_skill_type.em_skill_attack:
                t.abonus.hp -= skillc["attack"]
            elif skillc["skill_type"] == em_skill_type.em_skill_revive:
                t.abonus.hp += skillc["attack"]

    def __battle__(self, sort_entity:list[battle_entity]):
        for e in sort_entity:
            skill_id = -1
            target = ""
            if e.entity_id in self.auto_battle_info:
                skill_id = self.auto_battle_info[e.entity_id]
            elif e.entity_id in self.round_battle_info:
                (target, skill_id) = self.round_battle_info[e.entity_id]
            self.__use_skill__(e, skill_id, target)

    def __battle_one_round__(self):
        if self.__check_complete_round__():
            return
        self.__timer_round__.cancel()
        self.__battle__(self.__sort_battle_entity__())
        result = self.__check_battle_end__()
        if result:
            if result == em_victory_team.em_victory_team_enemy:
                if self.self_caller is not None: self.self_caller.battle_failed()
                if self.enemy_caller is not None: self.enemy_caller.battle_victory()
            elif result == em_victory_team.em_victory_team_self:
                if self.self_caller is not None: self.self_caller.battle_victory()
                if self.enemy_caller is not None: self.enemy_caller.battle_failed()
        else:
            self.round_battle_info.clear()
            if self.self_caller is not None: self.self_caller.battle_continue()
            if self.enemy_caller is not None: self.enemy_caller.battle_continue()
            if self.__check_complete_round__():
                Timer(3.99, self.__battle_one_round__).start()

    def __check_no_action_auto_battle__(self, entity_id:str):
        action = self.__not_action__.get(entity_id, default=0) + 1
        self.__not_action__[entity_id] = action
        if action >= 3:
            self.auto_battle_info[entity_id] = AutoAttackSkillId

    def __battle_one_round_timer__(self):
        for d in self.self_info.battle_team:
            if not self.__check_entity_complete_setting__(d.entity_id):
                self.round_battle_info[d.entity_id] = ("", AutoAttackSkillId)
                self.__check_no_action_auto_battle__(d.entity_id)
        for d in self.enemy_info.battle_team:
            if not self.__check_entity_complete_setting__(d.entity_id):
                self.round_battle_info[d.entity_id] = ("", AutoAttackSkillId)
                self.__check_no_action_auto_battle__(d.entity_id)
        self.__battle__(self.__sort_battle_entity__())
        result = self.__check_battle_end__()
        if result:
            if result == em_victory_team.em_victory_team_enemy:
                if self.self_caller is not None: self.self_caller.battle_failed()
                if self.enemy_caller is not None: self.enemy_caller.battle_victory()
            elif result == em_victory_team.em_victory_team_self:
                if self.self_caller is not None: self.self_caller.battle_victory()
                if self.enemy_caller is not None: self.enemy_caller.battle_failed()
        else:
            self.round_battle_info.clear()
            if self.self_caller is not None: self.self_caller.battle_continue()
            if self.enemy_caller is not None: self.enemy_caller.battle_continue()
            if self.__check_complete_round__():
                Timer(3.99, self.__battle_one_round__).start()
        
        self.__timer_round__ = Timer(29.99, self.__battle_one_round_timer__)
        self.__timer_round__.start()

    def on_auto_battle(self, entity_id:str, skill_id:int):
        self.auto_battle_info[entity_id] = skill_id

    def on_use_skill(self, entity_id:str, skill_id: int, target:str):
        self.round_battle_info[entity_id] = (target, skill_id)
        if self.__check_complete_round__():
            Timer(3.99, self.__battle_one_round__).start()