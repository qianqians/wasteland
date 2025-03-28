from threading import Timer
from collections.abc import Callable
from enum import Enum
from .engine import *
from .engine.msgpack import *
from .common_svr import *

# this enum code is codegen by geese codegen for python

#this struct code is codegen by geese codegen for python
#this caller code is codegen by geese codegen for python
class scene_player_wear_equip_cb(object):
    def __init__(self, _cb_uuid:int, _entity:subentity):
        self.entity = _entity
        self.cb:Callable[[list[equip_info], weapon_info, shooting_info], None] = None
        self.err:Callable[[error_code], None] = None
        self.rsp = callback(lambda: self.entity.del_callback(_cb_uuid))
        self.entity.reg_hub_callback(_cb_uuid, self.rsp)

    def on_rsp(self, bin:bytes):
        inArray = loads(bin)
        _equips = []
        for v_10d8619a_ef87_53c6_b028_8501d96c0af7 in inArray[0]:
            _equips.append(equip_info_to_protcol(v_10d8619a_ef87_53c6_b028_8501d96c0af7))
        _weapon = protcol_to_weapon_info(inArray[1])
        _shooting = protcol_to_shooting_info(inArray[2])
        self.cb(_equips, _weapon, _shooting)

    def on_err(self, bin:bytes):
        inArray = loads(bin)
        _err = inArray[0]

        self.err(_err, )

    def callBack(self, _cb:Callable[[list[equip_info], weapon_info, shooting_info], None], _err:Callable[[error_code], None]):
        self.cb = _cb
        self.err = _err
        self.rsp.callback(self.on_rsp, self.on_err)
        return self.rsp

class scene_player_use_item_cb(object):
    def __init__(self, _cb_uuid:int, _entity:subentity):
        self.entity = _entity
        self.cb:Callable[[list[item]], None] = None
        self.err:Callable[[error_code], None] = None
        self.rsp = callback(lambda: self.entity.del_callback(_cb_uuid))
        self.entity.reg_hub_callback(_cb_uuid, self.rsp)

    def on_rsp(self, bin:bytes):
        inArray = loads(bin)
        _items = []
        for v_bf5596fb_837a_5272_bf0d_cd29c7c99192 in inArray[0]:
            _items.append(item_to_protcol(v_bf5596fb_837a_5272_bf0d_cd29c7c99192))
        self.cb(_items)

    def on_err(self, bin:bytes):
        inArray = loads(bin)
        _err = inArray[0]

        self.err(_err)

    def callBack(self, _cb:Callable[[list[item]], None], _err:Callable[[error_code], None]):
        self.cb = _cb
        self.err = _err
        self.rsp.callback(self.on_rsp, self.on_err)
        return self.rsp

class scene_player_accept_task_cb(object):
    def __init__(self, _cb_uuid:int, _entity:subentity):
        self.entity = _entity
        self.cb:Callable[[list[task_info]], None] = None
        self.err:Callable[[error_code], None] = None
        self.rsp = callback(lambda: self.entity.del_callback(_cb_uuid))
        self.entity.reg_hub_callback(_cb_uuid, self.rsp)

    def on_rsp(self, bin:bytes):
        inArray = loads(bin)
        _tasks = []
        for v_9b78b6ab_a6db_5ec0_a23e_7f18c1d576b5 in inArray[0]:
            _tasks.append(task_info_to_protcol(v_9b78b6ab_a6db_5ec0_a23e_7f18c1d576b5))
        self.cb(_tasks)

    def on_err(self, bin:bytes):
        inArray = loads(bin)
        _err = inArray[0]

        self.err(_err)

    def callBack(self, _cb:Callable[[list[task_info]], None], _err:Callable[[error_code], None]):
        self.cb = _cb
        self.err = _err
        self.rsp.callback(self.on_rsp, self.on_err)
        return self.rsp

class scene_player_complete_task_cb(object):
    def __init__(self, _cb_uuid:int, _entity:subentity):
        self.entity = _entity
        self.cb:Callable[[list[task_info]], None] = None
        self.err:Callable[[error_code], None] = None
        self.rsp = callback(lambda: self.entity.del_callback(_cb_uuid))
        self.entity.reg_hub_callback(_cb_uuid, self.rsp)

    def on_rsp(self, bin:bytes):
        inArray = loads(bin)
        _tasks = []
        for v_9b78b6ab_a6db_5ec0_a23e_7f18c1d576b5 in inArray[0]:
            _tasks.append(task_info_to_protcol(v_9b78b6ab_a6db_5ec0_a23e_7f18c1d576b5))
        self.cb(_tasks)

    def on_err(self, bin:bytes):
        inArray = loads(bin)
        _err = inArray[0]

        self.err(_err)

    def callBack(self, _cb:Callable[[list[task_info]], None], _err:Callable[[error_code], None]):
        self.cb = _cb
        self.err = _err
        self.rsp.callback(self.on_rsp, self.on_err)
        return self.rsp

class scene_player_purchase_cb(object):
    def __init__(self, _cb_uuid:int, _entity:subentity):
        self.entity = _entity
        self.cb:Callable[[list[item]], None] = None
        self.err:Callable[[error_code], None] = None
        self.rsp = callback(lambda: self.entity.del_callback(_cb_uuid))
        self.entity.reg_hub_callback(_cb_uuid, self.rsp)

    def on_rsp(self, bin:bytes):
        inArray = loads(bin)
        _items = []
        for v_bf5596fb_837a_5272_bf0d_cd29c7c99192 in inArray[0]:
            _items.append(item_to_protcol(v_bf5596fb_837a_5272_bf0d_cd29c7c99192))
        self.cb(_items)

    def on_err(self, bin:bytes):
        inArray = loads(bin)
        _err = inArray[0]

        self.err(_err)

    def callBack(self, _cb:Callable[[list[item]], None], _err:Callable[[error_code], None]):
        self.cb = _cb
        self.err = _err
        self.rsp.callback(self.on_rsp, self.on_err)
        return self.rsp

class scene_player_caller(object):
    def __init__(self, entity:subentity):
        self.entity = entity

    def wear_equip(self, equip_id:str):
        _argv_29899057_23ab_3371_9bff_b3c5a5aec1a2 = []
        _argv_29899057_23ab_3371_9bff_b3c5a5aec1a2.append(equip_id)
        _cb_uuid = self.entity.call_hub_request("wear_equip", dumps(_argv_29899057_23ab_3371_9bff_b3c5a5aec1a2))

        return scene_player_wear_equip_cb(_cb_uuid, self.entity)

    def use_item(self, item_id:str):
        _argv_8e931b2d_2ecb_30da_928a_750ecb587c14 = []
        _argv_8e931b2d_2ecb_30da_928a_750ecb587c14.append(item_id)
        _cb_uuid = self.entity.call_hub_request("use_item", dumps(_argv_8e931b2d_2ecb_30da_928a_750ecb587c14))

        return scene_player_use_item_cb(_cb_uuid, self.entity)

    def accept_task(self, task_id:int):
        _argv_300a447a_63f4_3f9b_8d00_4f2be030e6f1 = []
        _argv_300a447a_63f4_3f9b_8d00_4f2be030e6f1.append(task_id)
        _cb_uuid = self.entity.call_hub_request("accept_task", dumps(_argv_300a447a_63f4_3f9b_8d00_4f2be030e6f1))

        return scene_player_accept_task_cb(_cb_uuid, self.entity)

    def complete_task(self, task_id:int):
        _argv_24f1bbd4_24d5_33cf_82be_64a44d300cd8 = []
        _argv_24f1bbd4_24d5_33cf_82be_64a44d300cd8.append(task_id)
        _cb_uuid = self.entity.call_hub_request("complete_task", dumps(_argv_24f1bbd4_24d5_33cf_82be_64a44d300cd8))

        return scene_player_complete_task_cb(_cb_uuid, self.entity)

    def purchase(self, item_id:str):
        _argv_e0c7fe5d_7700_3643_ac3f_27cfc058984b = []
        _argv_e0c7fe5d_7700_3643_ac3f_27cfc058984b.append(item_id)
        _cb_uuid = self.entity.call_hub_request("purchase", dumps(_argv_e0c7fe5d_7700_3643_ac3f_27cfc058984b))

        return scene_player_purchase_cb(_cb_uuid, self.entity)

#this module code is codegen by geese codegen for python
class scene_player_wear_equip_rsp(session):
    def __init__(self, source:str, msg_cb_id:int, entity:player|entity):
        session.__init__(self, source)
        self.entity = entity
        self.is_rsp = False
        self.msg_cb_id = msg_cb_id

    def rsp(self, equips:list[equip_info], weapon:weapon_info, shooting:shooting_info):
        if self.is_rsp:
            return
        self.is_rsp = True

        _argv_29899057_23ab_3371_9bff_b3c5a5aec1a2 = []
        _list_d335ace6_2d27_3974_a575_cf77cedfa576 = []
        for v_10d8619a_ef87_53c6_b028_8501d96c0af7 in equips:
            _list_d335ace6_2d27_3974_a575_cf77cedfa576.append(equip_info_to_protcol(v_10d8619a_ef87_53c6_b028_8501d96c0af7))
        _argv_29899057_23ab_3371_9bff_b3c5a5aec1a2.append(_list_d335ace6_2d27_3974_a575_cf77cedfa576)
        _argv_29899057_23ab_3371_9bff_b3c5a5aec1a2.append(weapon_info_to_protcol(weapon))
        _argv_29899057_23ab_3371_9bff_b3c5a5aec1a2.append(shooting_info_to_protcol(shooting))
        self.entity.call_hub_response(self.source, self.msg_cb_id, dumps(_argv_29899057_23ab_3371_9bff_b3c5a5aec1a2))

    def err(self, err:error_code):
        if self.is_rsp:
            return
        self.is_rsp = True

        _argv_29899057_23ab_3371_9bff_b3c5a5aec1a2 = [self.uuid_e550cefd_631b_3a7d_8213_26d1a550f222]
        _argv_29899057_23ab_3371_9bff_b3c5a5aec1a2.append(err)
        self.entity.call_hub_response_error(self.source, self.msg_cb_id, dumps(_argv_29899057_23ab_3371_9bff_b3c5a5aec1a2))

class scene_player_use_item_rsp(session):
    def __init__(self, source:str, msg_cb_id:int, entity:player|entity):
        session.__init__(self, source)
        self.entity = entity
        self.is_rsp = False
        self.msg_cb_id = msg_cb_id

    def rsp(self, items:list[item]):
        if self.is_rsp:
            return
        self.is_rsp = True

        _argv_8e931b2d_2ecb_30da_928a_750ecb587c14 = []
        _list_345fb533_0c2c_3ec8_899f_fe985da7fd3a = []
        for v_bf5596fb_837a_5272_bf0d_cd29c7c99192 in items:
            _list_345fb533_0c2c_3ec8_899f_fe985da7fd3a.append(item_to_protcol(v_bf5596fb_837a_5272_bf0d_cd29c7c99192))
        _argv_8e931b2d_2ecb_30da_928a_750ecb587c14.append(_list_345fb533_0c2c_3ec8_899f_fe985da7fd3a)
        self.entity.call_hub_response(self.source, self.msg_cb_id, dumps(_argv_8e931b2d_2ecb_30da_928a_750ecb587c14))

    def err(self, err:error_code):
        if self.is_rsp:
            return
        self.is_rsp = True

        _argv_8e931b2d_2ecb_30da_928a_750ecb587c14 = [self.uuid_6a895a27_7c90_3d7f_b9f5_d47cbcbd1584]
        _argv_8e931b2d_2ecb_30da_928a_750ecb587c14.append(err)
        self.entity.call_hub_response_error(self.source, self.msg_cb_id, dumps(_argv_8e931b2d_2ecb_30da_928a_750ecb587c14))

class scene_player_accept_task_rsp(session):
    def __init__(self, source:str, msg_cb_id:int, entity:player|entity):
        session.__init__(self, source)
        self.entity = entity
        self.is_rsp = False
        self.msg_cb_id = msg_cb_id

    def rsp(self, tasks:list[task_info]):
        if self.is_rsp:
            return
        self.is_rsp = True

        _argv_300a447a_63f4_3f9b_8d00_4f2be030e6f1 = []
        _list_ff486e7f_b5aa_3a8b_9d23_28dd187f4870 = []
        for v_9b78b6ab_a6db_5ec0_a23e_7f18c1d576b5 in tasks:
            _list_ff486e7f_b5aa_3a8b_9d23_28dd187f4870.append(task_info_to_protcol(v_9b78b6ab_a6db_5ec0_a23e_7f18c1d576b5))
        _argv_300a447a_63f4_3f9b_8d00_4f2be030e6f1.append(_list_ff486e7f_b5aa_3a8b_9d23_28dd187f4870)
        self.entity.call_hub_response(self.source, self.msg_cb_id, dumps(_argv_300a447a_63f4_3f9b_8d00_4f2be030e6f1))

    def err(self, err:error_code):
        if self.is_rsp:
            return
        self.is_rsp = True

        _argv_300a447a_63f4_3f9b_8d00_4f2be030e6f1 = [self.uuid_7e4c31a0_313b_3c28_9f20_cd1f7d3055d0]
        _argv_300a447a_63f4_3f9b_8d00_4f2be030e6f1.append(err)
        self.entity.call_hub_response_error(self.source, self.msg_cb_id, dumps(_argv_300a447a_63f4_3f9b_8d00_4f2be030e6f1))

class scene_player_complete_task_rsp(session):
    def __init__(self, source:str, msg_cb_id:int, entity:player|entity):
        session.__init__(self, source)
        self.entity = entity
        self.is_rsp = False
        self.msg_cb_id = msg_cb_id

    def rsp(self, tasks:list[task_info]):
        if self.is_rsp:
            return
        self.is_rsp = True

        _argv_24f1bbd4_24d5_33cf_82be_64a44d300cd8 = []
        _list_ff486e7f_b5aa_3a8b_9d23_28dd187f4870 = []
        for v_9b78b6ab_a6db_5ec0_a23e_7f18c1d576b5 in tasks:
            _list_ff486e7f_b5aa_3a8b_9d23_28dd187f4870.append(task_info_to_protcol(v_9b78b6ab_a6db_5ec0_a23e_7f18c1d576b5))
        _argv_24f1bbd4_24d5_33cf_82be_64a44d300cd8.append(_list_ff486e7f_b5aa_3a8b_9d23_28dd187f4870)
        self.entity.call_hub_response(self.source, self.msg_cb_id, dumps(_argv_24f1bbd4_24d5_33cf_82be_64a44d300cd8))

    def err(self, err:error_code):
        if self.is_rsp:
            return
        self.is_rsp = True

        _argv_24f1bbd4_24d5_33cf_82be_64a44d300cd8 = [self.uuid_6507b0c9_b813_3f14_b6c0_7438f86d2762]
        _argv_24f1bbd4_24d5_33cf_82be_64a44d300cd8.append(err)
        self.entity.call_hub_response_error(self.source, self.msg_cb_id, dumps(_argv_24f1bbd4_24d5_33cf_82be_64a44d300cd8))

class scene_player_purchase_rsp(session):
    def __init__(self, source:str, msg_cb_id:int, entity:player|entity):
        session.__init__(self, source)
        self.entity = entity
        self.is_rsp = False
        self.msg_cb_id = msg_cb_id

    def rsp(self, items:list[item]):
        if self.is_rsp:
            return
        self.is_rsp = True

        _argv_e0c7fe5d_7700_3643_ac3f_27cfc058984b = []
        _list_345fb533_0c2c_3ec8_899f_fe985da7fd3a = []
        for v_bf5596fb_837a_5272_bf0d_cd29c7c99192 in items:
            _list_345fb533_0c2c_3ec8_899f_fe985da7fd3a.append(item_to_protcol(v_bf5596fb_837a_5272_bf0d_cd29c7c99192))
        _argv_e0c7fe5d_7700_3643_ac3f_27cfc058984b.append(_list_345fb533_0c2c_3ec8_899f_fe985da7fd3a)
        self.entity.call_hub_response(self.source, self.msg_cb_id, dumps(_argv_e0c7fe5d_7700_3643_ac3f_27cfc058984b))

    def err(self, err:error_code):
        if self.is_rsp:
            return
        self.is_rsp = True

        _argv_e0c7fe5d_7700_3643_ac3f_27cfc058984b = [self.uuid_7568d2b1_b06e_3717_b134_86c92cb59185]
        _argv_e0c7fe5d_7700_3643_ac3f_27cfc058984b.append(err)
        self.entity.call_hub_response_error(self.source, self.msg_cb_id, dumps(_argv_e0c7fe5d_7700_3643_ac3f_27cfc058984b))

class scene_player_module(object):
    def __init__(self, entity:player|entity):
        self.entity = entity

        self.on_wear_equip:list[Callable[[scene_player_wear_equip_rsp, str], None]] = []
        self.entity.reg_hub_request_callback("wear_equip", self.wear_equip)
        self.on_use_item:list[Callable[[scene_player_use_item_rsp, str], None]] = []
        self.entity.reg_hub_request_callback("use_item", self.use_item)
        self.on_accept_task:list[Callable[[scene_player_accept_task_rsp, int], None]] = []
        self.entity.reg_hub_request_callback("accept_task", self.accept_task)
        self.on_complete_task:list[Callable[[scene_player_complete_task_rsp, int], None]] = []
        self.entity.reg_hub_request_callback("complete_task", self.complete_task)
        self.on_purchase:list[Callable[[scene_player_purchase_rsp, str], None]] = []
        self.entity.reg_hub_request_callback("purchase", self.purchase)

    def wear_equip(self, source:str, msg_cb_id:int, bin:bytes):
        inArray = loads(bin)
        _equip_id = inArray[0]
        rsp = scene_player_wear_equip_rsp(source, msg_cb_id, self.entity)
        for fn in self.on_wear_equip:
            fn(rsp, _equip_id)

    def use_item(self, source:str, msg_cb_id:int, bin:bytes):
        inArray = loads(bin)
        _item_id = inArray[0]
        rsp = scene_player_use_item_rsp(source, msg_cb_id, self.entity)
        for fn in self.on_use_item:
            fn(rsp, _item_id)

    def accept_task(self, source:str, msg_cb_id:int, bin:bytes):
        inArray = loads(bin)
        _task_id = inArray[0]
        rsp = scene_player_accept_task_rsp(source, msg_cb_id, self.entity)
        for fn in self.on_accept_task:
            fn(rsp, _task_id)

    def complete_task(self, source:str, msg_cb_id:int, bin:bytes):
        inArray = loads(bin)
        _task_id = inArray[0]
        rsp = scene_player_complete_task_rsp(source, msg_cb_id, self.entity)
        for fn in self.on_complete_task:
            fn(rsp, _task_id)

    def purchase(self, source:str, msg_cb_id:int, bin:bytes):
        inArray = loads(bin)
        _item_id = inArray[0]
        rsp = scene_player_purchase_rsp(source, msg_cb_id, self.entity)
        for fn in self.on_purchase:
            fn(rsp, _item_id)



