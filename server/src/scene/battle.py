# -*- coding: UTF-8 -*-
from __future__ import annotations
from threading import Timer
import bisect
from ..engine.engine import *
from ..engine.battle_ntf_client_svr import *
from ..config import *
from .player_data import *
from .scene import *
from ..config.skill_config import *
from .battle_impl.action import *
from .battle_impl.buff_data import *
from .battle_impl.effect import *
from ..config.buff_config import *

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

        self.round_battle_info:list[Action] = []
        self.auto_battle_info:dict[str, int] = {}

        self.buffer_info:dict[str, buff_data] = {}
        for t in self.__battle_team__(self.self_info):
            self.buffer_info[t.entity_id] = buff_data(t.entity_id)
        for t in self.__battle_team__(self.enemy_info):
            self.buffer_info[t.entity_id] = buff_data(t.entity_id)

        self.__timer_round__ = Timer(29.99, self.__battle_one_round_timer__)
        self.__timer_round__.start()

    def __ntf_battle_info__(self):
        if self.self_caller is not None: self.self_caller.start_battle(self.self_info, self.enemy_info)
        if self.enemy_caller is not None: self.enemy_caller.start_battle(self.enemy_info, self.self_info)

    def __battle_team__(self, _battle_info:battle_info) -> list[ActionEntity]:
        return [_battle_info.battle_team0, _battle_info.battle_team1, _battle_info.curr_bbs0, _battle_info.curr_bbs1, _battle_info.player]

    #
    # 一个队伍的所有角色倒下即战斗结束
    # self  胜利返回 1
    # enemy 胜利返回 -1
    # 战斗未结束返回 0
    #
    def __check_battle_end__(self) -> int:
        is_failed = True
        for d in self.__battle_team__(self.self_info):
            if d.abonus.hp > 0:
                is_failed = False
                break
        if is_failed:
            return em_victory_team.em_victory_team_enemy

        is_failed = True
        for d in self.__battle_team__(self.enemy_info):
            if d.abonus.hp > 0:
                is_failed = False
                break
        if is_failed:
            return em_victory_team.em_victory_team_self
        return em_victory_team.em_victory_battle_keep_going

    def __check_entity_complete_setting__(self, entity_id:str) -> bool:
        for ac in self.round_battle_info:
            if ac["entity_id"] == entity_id:
                return True
        if entity_id in self.auto_battle_info:
            return True
        return False

    def __check_complete_round__(self) -> bool:
        for d in self.__battle_team__(self.self_info):
            if not self.__check_entity_complete_setting__(d.entity_id):
                return False
        for d in self.__battle_team__(self.enemy_info):
            if not self.__check_entity_complete_setting__(d.entity_id):
                return False
        return True

    def __sort_battle_entity__(self) -> list[Action]:
        l:list[Action] = []
        for d in self.round_battle_info:
            bisect.insort(l, d, key=lambda p: p["entity"].speed)
        return l

    def __get_target__(self, target:str) -> ActionEntity:
        for t in self.__battle_team__(self.self_info):
            if t.entity_id == target: return t
        for t in self.__battle_team__(self.enemy_info):
            if t.entity_id == target: return t
        return None

    def __use_skill__(self, entity_id:str, skill_id:int, target:str):
        for t in self.__battle_team__(self.self_info):
            if t.entity_id == entity_id:
                self.round_battle_info.append(action(entity=t, skill_id=skill_id, target=target))
                return
        for t in self.__battle_team__(self.enemy_info):
            if t.entity_id == entity_id:
                self.round_battle_info.append(action(entity=t, skill_id=skill_id, target=target))
                return

    def __check_self_or_enemy__(self, _target:ActionEntity) -> list[ActionEntity]:
        l = self.__battle_team__(self.self_info)
        for t in l:
            if t.entity_id == _target.entity_id:
                return l
        return self.__battle_team__(self.enemy_info)

    def __action_skill__(self, skill_id:int, _entity:ActionEntity, _target:ActionEntity):
        skill = Skills[skill_id]
        if _entity.abonus.mp < skill.cast_mp:
            return
        _entity.abonus.mp -= skill.cast_mp

        target:list[ActionEntity] = [_target]
        target_list:list[ActionEntity] = self.__check_self_or_enemy__(_target).remove(_target)
        for _ in range(skill.range - 1):
            t = random.choice(target_list)
            target.append(t)
            target_list.remove(t)
        if skill._type == skill_type.skill_change_abonus_attack:
            for t in target:
                damage(_entity.abonus.attack+skill.ratio*_entity.level+skill.value0, t)
                if skill.value1 > 0:
                    damage_mp(skill.value1, t)
        elif skill._type == skill_type.skill_change_abonus_magic:
            for t in target:
                damage_matk(_entity.abonus.matk+skill.ratio*_entity.level+skill.value0, t)
                if skill.value1 > 0:
                    damage_mp(skill.value1, t)
        elif skill._type == skill_type.skill_add_buffer:
            for t in target:
                buffer_id = skill.value0
                buf = Buffers[buffer_id]
                tmp_buf = buf.copy()
                tmp_buf["level"] = _entity.level
                buf_data = self.buffer_info[t.entity_id]
                buf_data.add_buff(buf)
        elif skill._type == skill_type.skill_dispel_buffer:
            pass

    def __action__(self, _action:Action):
        self.__action_skill__(_action["skill_id"], _action["entity"], self.__get_target__(_action["target"]))

    def __battle__(self, l:list[Action]):
        for _, b in self.buffer_info.items():
            _target = self.__get_target__(b.entity_id)
            b.check_effect_buff(_target)

        for _action in l:
            if _action["entity"].abonus.hp <= 0:
                continue
            buf = self.buffer_info[_action["entity"]]
            _action = buf.check_action(_action, self.self_info, self.enemy_info)
            self.__action__(_action)

        for _, b in self.buffer_info.items():
            b.check_expired_buff()

    def __battle_one_round__(self):
        if self.__check_complete_round__():
            return

        self.__timer_round__.cancel()
        self.__battle_update_timer__.cancel()

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
                self.__battle_update_timer__ = Timer(3.99, self.__battle_one_round__)
                self.__battle_update_timer__.start()

    def __battle_one_round_timer__(self):
        self.__battle_update_timer__.cancel()
        
        for d in self.__battle_team__(self.self_info):
            if not self.__check_entity_complete_setting__(d.entity_id):
                AutoAttackSkillId = SkillAttack
                if d.entity_id in self.auto_battle_info:
                    AutoAttackSkillId = self.auto_battle_info[d.entity_id]
                target:list[str] = []
                if self.enemy_info.battle_team0.abonus.hp > 0: target.append(self.enemy_info.battle_team0.entity_id)
                if self.enemy_info.battle_team1.abonus.hp > 0: target.append(self.enemy_info.battle_team1.entity_id)
                if self.enemy_info.curr_bbs0.abonus.hp > 0: target.append(self.enemy_info.curr_bbs0.entity_id)
                if self.enemy_info.curr_bbs1.abonus.hp > 0: target.append(self.enemy_info.curr_bbs1.entity_id)
                if self.enemy_info.battle_team0.abonus.hp > 0: target.append(self.enemy_info.battle_team0.entity_id)
                _target = random.choice(target)
                self.round_battle_info.append(action(entity=d, skill_id=AutoAttackSkillId, target=_target))
        for d in self.__battle_team__(self.enemy_info):
            if not self.__check_entity_complete_setting__(d.entity_id):
                AutoAttackSkillId = SkillAttack
                if d.entity_id in self.auto_battle_info:
                    AutoAttackSkillId = self.auto_battle_info[d.entity_id]
                target:list[str] = []
                if self.self_info.battle_team0.abonus.hp > 0: target.append(self.self_info.battle_team0.entity_id)
                if self.self_info.battle_team1.abonus.hp > 0: target.append(self.self_info.battle_team1.entity_id)
                if self.self_info.curr_bbs0.abonus.hp > 0: target.append(self.self_info.curr_bbs0.entity_id)
                if self.self_info.curr_bbs1.abonus.hp > 0: target.append(self.self_info.curr_bbs1.entity_id)
                if self.self_info.battle_team0.abonus.hp > 0: target.append(self.self_info.battle_team0.entity_id)
                _target = random.choice(target)
                self.round_battle_info.append(action(entity=d, skill_id=AutoAttackSkillId, target=_target))

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
                self.__battle_update_timer__ = Timer(3.99, self.__battle_one_round__)
                self.__battle_update_timer__.start()
        
        self.__timer_round__ = Timer(29.99, self.__battle_one_round_timer__)
        self.__timer_round__.start()

    def on_auto_battle(self, entity_id:str, skill_id:int):
        self.auto_battle_info[entity_id] = skill_id

    def on_use_skill(self, entity_id:str, skill_id: int, target:str):
        if skill_id == SkillDefend:
            self.__action_skill__(skill_id, self.__get_target__(entity_id))
        else:
            entity = self.__get_target__(entity_id)
            self.round_battle_info.append(action(entity=entity, skill_id=skill_id, target=target))
        if self.__check_complete_round__():
            self.__battle_update_timer__ = Timer(3.99, self.__battle_one_round__)
            self.__battle_update_timer__.start()