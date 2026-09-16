import * as engine from "./engine";
import { encode, decode } from "./engine/@msgpack/msgpack";
// this enum code is codegen by geese codegen for ts

export enum error_code {
    success = 0,
    cannot_claimed = 1,
    cannot_completed = 2,
    not_enough_money = 3,
    no_this_equip = 4,
    no_this_item = 5,
    undefined_player_id = 6,
    unlock_talk_task = 7,
    unlock_level_not_completed = 8,
    unconfig_talk_task = 9,
    talk_npc_not_scene = 10,
    cannot_use_skill = 11,
    not_in_spawn_point = 12,
}

export enum em_rarity {
    common = 1,
    rare = 2,
    epic = 3,
    legendary = 4,
    myth = 5,
}

export enum em_equip_type {
    helmet = 1,
    jacket = 2,
    trousers = 3,
    gloves = 4,
    boots = 5,
    weapon = 6,
    bb_attack = 11,
    bb_defense = 12,
    bb_resist = 13,
}

export enum em_buff_type {
    em_seal_action = 1,
    em_seal_skill = 2,
    em_confuse_attack_all = 4,
    em_confuse_attack_allies = 8,
    em_heal_hp = 16,
    em_heal_mp = 32,
    em_damage_hp = 64,
    em_damage_mp = 128,
    em_defense_value = 256,
    em_defense_ratio = 512,
}

export enum direction {
    none = 0,
    up = 1,
    down = 2,
    left = 4,
    right = 8,
}

export enum skill_type {
    skill_change_abonus_attack = 1,
    skill_change_abonus_magic = 2,
    skill_add_buffer = 3,
    skill_dispel_buffer = 4,
}

export enum em_task_state {
    can_claimed = 1,
    in_progress = 2,
    can_completed = 3,
    completed = 4,
}

export enum em_role_gender {
    em_role_gender_female = 0,
    em_role_gender_male = 1,
}

// this struct code is codegen by geese codegen for ts
export class attribute {
     public hp:number = 0
     public mp:number = 0
     public max_hp:number = 0
     public max_mp:number = 0
     public speed:number = 0
     public attack:number = 0
     public defense:number = 0
     public tmp_defense:number = 0
     public matk:number = 0
     public resist:number = 0
}

export function attribute_to_protcol(_struct:attribute) {
    let _protocol:any = {}
    _protocol["hp"] = _struct.hp
    _protocol["mp"] = _struct.mp
    _protocol["max_hp"] = _struct.max_hp
    _protocol["max_mp"] = _struct.max_mp
    _protocol["speed"] = _struct.speed
    _protocol["attack"] = _struct.attack
    _protocol["defense"] = _struct.defense
    _protocol["tmp_defense"] = _struct.tmp_defense
    _protocol["matk"] = _struct.matk
    _protocol["resist"] = _struct.resist
    return _protocol;
}

export function protcol_to_attribute(_protocol:any) {
    let _struct = new attribute()
    for (let key in _protocol) {
        let val = _protocol[key];
        if (key == "hp") {
            _struct.hp = val;
        }
        else if (key == "mp") {
            _struct.mp = val;
        }
        else if (key == "max_hp") {
            _struct.max_hp = val;
        }
        else if (key == "max_mp") {
            _struct.max_mp = val;
        }
        else if (key == "speed") {
            _struct.speed = val;
        }
        else if (key == "attack") {
            _struct.attack = val;
        }
        else if (key == "defense") {
            _struct.defense = val;
        }
        else if (key == "tmp_defense") {
            _struct.tmp_defense = val;
        }
        else if (key == "matk") {
            _struct.matk = val;
        }
        else if (key == "resist") {
            _struct.resist = val;
        }
    }
    return _struct;

}

export class equip_info {
     public equip_id:string = ""
     public name:string = ""
     public icon:string = ""
     public desc:string = ""
     public equip_type:em_equip_type = em_equip_type.helmet
     public rarity:em_rarity = em_rarity.common
     public abonus:attribute = null
}

export function equip_info_to_protcol(_struct:equip_info) {
    let _protocol:any = {}
    _protocol["equip_id"] = _struct.equip_id
    _protocol["name"] = _struct.name
    _protocol["icon"] = _struct.icon
    _protocol["desc"] = _struct.desc
    _protocol["equip_type"] = _struct.equip_type
    _protocol["rarity"] = _struct.rarity
    _protocol["abonus"] = attribute_to_protcol(_struct.abonus)
    return _protocol;
}

export function protcol_to_equip_info(_protocol:any) {
    let _struct = new equip_info()
    for (let key in _protocol) {
        let val = _protocol[key];
        if (key == "equip_id") {
            _struct.equip_id = val;
        }
        else if (key == "name") {
            _struct.name = val;
        }
        else if (key == "icon") {
            _struct.icon = val;
        }
        else if (key == "desc") {
            _struct.desc = val;
        }
        else if (key == "equip_type") {
            _struct.equip_type = val;
        }
        else if (key == "rarity") {
            _struct.rarity = val;
        }
        else if (key == "abonus") {
            _struct.abonus = protcol_to_attribute(val);
        }
    }
    return _struct;

}

export class position {
     public x:number = 0
     public y:number = 0
     public x_speed:number = 0
     public y_speed:number = 0
     public dir:number = 0
}

export function position_to_protcol(_struct:position) {
    let _protocol:any = {}
    _protocol["x"] = _struct.x
    _protocol["y"] = _struct.y
    _protocol["x_speed"] = _struct.x_speed
    _protocol["y_speed"] = _struct.y_speed
    _protocol["dir"] = _struct.dir
    return _protocol;
}

export function protcol_to_position(_protocol:any) {
    let _struct = new position()
    for (let key in _protocol) {
        let val = _protocol[key];
        if (key == "x") {
            _struct.x = val;
        }
        else if (key == "y") {
            _struct.y = val;
        }
        else if (key == "x_speed") {
            _struct.x_speed = val;
        }
        else if (key == "y_speed") {
            _struct.y_speed = val;
        }
        else if (key == "dir") {
            _struct.dir = val;
        }
    }
    return _struct;

}

export class skill_info {
     public skill_id:number = 0
     public _type:skill_type = skill_type.skill_change_abonus_attack
     public target_enemy:boolean = false
     public value0:number = 0.0
     public value1:number = 0.0
     public ratio:number = 0.0
     public range:number = 0
     public cast_mp:number = 0
     public cd_round:number = 0
}

export function skill_info_to_protcol(_struct:skill_info) {
    let _protocol:any = {}
    _protocol["skill_id"] = _struct.skill_id
    _protocol["_type"] = _struct._type
    _protocol["target_enemy"] = _struct.target_enemy
    _protocol["value0"] = _struct.value0
    _protocol["value1"] = _struct.value1
    _protocol["ratio"] = _struct.ratio
    _protocol["range"] = _struct.range
    _protocol["cast_mp"] = _struct.cast_mp
    _protocol["cd_round"] = _struct.cd_round
    return _protocol;
}

export function protcol_to_skill_info(_protocol:any) {
    let _struct = new skill_info()
    for (let key in _protocol) {
        let val = _protocol[key];
        if (key == "skill_id") {
            _struct.skill_id = val;
        }
        else if (key == "_type") {
            _struct._type = val;
        }
        else if (key == "target_enemy") {
            _struct.target_enemy = val;
        }
        else if (key == "value0") {
            _struct.value0 = val;
        }
        else if (key == "value1") {
            _struct.value1 = val;
        }
        else if (key == "ratio") {
            _struct.ratio = val;
        }
        else if (key == "range") {
            _struct.range = val;
        }
        else if (key == "cast_mp") {
            _struct.cast_mp = val;
        }
        else if (key == "cd_round") {
            _struct.cd_round = val;
        }
    }
    return _struct;

}

export class gongfa_bonus {
     public abonus:attribute = null
     public skills:Array<skill_info> = null
}

export function gongfa_bonus_to_protcol(_struct:gongfa_bonus) {
    let _protocol:any = {}
    _protocol["abonus"] = attribute_to_protcol(_struct.abonus)
    if (_struct.skills) {
        let _array_skills = []
        for (let v_ of _struct.skills) {
            _array_skills.push(skill_info_to_protcol(v_))
        }
        _protocol["skills"] = _array_skills
    }
    return _protocol;
}

export function protcol_to_gongfa_bonus(_protocol:any) {
    let _struct = new gongfa_bonus()
    for (let key in _protocol) {
        let val = _protocol[key];
        if (key == "abonus") {
            _struct.abonus = protcol_to_attribute(val);
        }
        else if (key == "skills") {
            _struct.skills = []
            for (let v_ of val) {
                _struct.skills.push(protcol_to_skill_info(v_));
            }
        }
    }
    return _struct;

}

export class gongfa {
     public gongfa_table_id:number = 0
     public rarity:em_rarity = em_rarity.common
     public gongfa_level:number = 0
     public abonus:gongfa_bonus = null
}

export function gongfa_to_protcol(_struct:gongfa) {
    let _protocol:any = {}
    _protocol["gongfa_table_id"] = _struct.gongfa_table_id
    _protocol["rarity"] = _struct.rarity
    _protocol["gongfa_level"] = _struct.gongfa_level
    _protocol["abonus"] = gongfa_bonus_to_protcol(_struct.abonus)
    return _protocol;
}

export function protcol_to_gongfa(_protocol:any) {
    let _struct = new gongfa()
    for (let key in _protocol) {
        let val = _protocol[key];
        if (key == "gongfa_table_id") {
            _struct.gongfa_table_id = val;
        }
        else if (key == "rarity") {
            _struct.rarity = val;
        }
        else if (key == "gongfa_level") {
            _struct.gongfa_level = val;
        }
        else if (key == "abonus") {
            _struct.abonus = protcol_to_gongfa_bonus(val);
        }
    }
    return _struct;

}

export class task_progress_info {
     public table_id:number = 0
     public total:number = 0
     public progress:number = 0
     public watch_task:Array<number> = null
}

export function task_progress_info_to_protcol(_struct:task_progress_info) {
    let _protocol:any = {}
    _protocol["table_id"] = _struct.table_id
    _protocol["total"] = _struct.total
    _protocol["progress"] = _struct.progress
    if (_struct.watch_task) {
        let _array_watch_task = []
        for (let v_ of _struct.watch_task) {
            _array_watch_task.push(v_)
        }
        _protocol["watch_task"] = _array_watch_task
    }
    return _protocol;
}

export function protcol_to_task_progress_info(_protocol:any) {
    let _struct = new task_progress_info()
    for (let key in _protocol) {
        let val = _protocol[key];
        if (key == "table_id") {
            _struct.table_id = val;
        }
        else if (key == "total") {
            _struct.total = val;
        }
        else if (key == "progress") {
            _struct.progress = val;
        }
        else if (key == "watch_task") {
            _struct.watch_task = []
            for (let v_ of val) {
                _struct.watch_task.push(v_);
            }
        }
    }
    return _struct;

}

export class task_info {
     public task_id:number = 0
     public status:em_task_state = em_task_state.can_claimed
     public progress:Array<task_progress_info> = null
     public refresh_time:number = 0
}

export function task_info_to_protcol(_struct:task_info) {
    let _protocol:any = {}
    _protocol["task_id"] = _struct.task_id
    _protocol["status"] = _struct.status
    if (_struct.progress) {
        let _array_progress = []
        for (let v_ of _struct.progress) {
            _array_progress.push(task_progress_info_to_protcol(v_))
        }
        _protocol["progress"] = _array_progress
    }
    _protocol["refresh_time"] = _struct.refresh_time
    return _protocol;
}

export function protcol_to_task_info(_protocol:any) {
    let _struct = new task_info()
    for (let key in _protocol) {
        let val = _protocol[key];
        if (key == "task_id") {
            _struct.task_id = val;
        }
        else if (key == "status") {
            _struct.status = val;
        }
        else if (key == "progress") {
            _struct.progress = []
            for (let v_ of val) {
                _struct.progress.push(protcol_to_task_progress_info(v_));
            }
        }
        else if (key == "refresh_time") {
            _struct.refresh_time = val;
        }
    }
    return _struct;

}

export class item {
     public item_type:number = 0
     public item_count:number = 0
}

export function item_to_protcol(_struct:item) {
    let _protocol:any = {}
    _protocol["item_type"] = _struct.item_type
    _protocol["item_count"] = _struct.item_count
    return _protocol;
}

export function protcol_to_item(_protocol:any) {
    let _struct = new item()
    for (let key in _protocol) {
        let val = _protocol[key];
        if (key == "item_type") {
            _struct.item_type = val;
        }
        else if (key == "item_count") {
            _struct.item_count = val;
        }
    }
    return _struct;

}

export class bb {
     public entity_id:string = ""
     public bb_table_id:number = 0
     public rarity:em_rarity = em_rarity.common
     public level:number = 0
     public abonus:attribute = null
     public skills:Array<skill_info> = null
     public equips:Array<equip_info> = null
}

export function bb_to_protcol(_struct:bb) {
    let _protocol:any = {}
    _protocol["entity_id"] = _struct.entity_id
    _protocol["bb_table_id"] = _struct.bb_table_id
    _protocol["rarity"] = _struct.rarity
    _protocol["level"] = _struct.level
    _protocol["abonus"] = attribute_to_protcol(_struct.abonus)
    if (_struct.skills) {
        let _array_skills = []
        for (let v_ of _struct.skills) {
            _array_skills.push(skill_info_to_protcol(v_))
        }
        _protocol["skills"] = _array_skills
    }
    if (_struct.equips) {
        let _array_equips = []
        for (let v_ of _struct.equips) {
            _array_equips.push(equip_info_to_protcol(v_))
        }
        _protocol["equips"] = _array_equips
    }
    return _protocol;
}

export function protcol_to_bb(_protocol:any) {
    let _struct = new bb()
    for (let key in _protocol) {
        let val = _protocol[key];
        if (key == "entity_id") {
            _struct.entity_id = val;
        }
        else if (key == "bb_table_id") {
            _struct.bb_table_id = val;
        }
        else if (key == "rarity") {
            _struct.rarity = val;
        }
        else if (key == "level") {
            _struct.level = val;
        }
        else if (key == "abonus") {
            _struct.abonus = protcol_to_attribute(val);
        }
        else if (key == "skills") {
            _struct.skills = []
            for (let v_ of val) {
                _struct.skills.push(protcol_to_skill_info(v_));
            }
        }
        else if (key == "equips") {
            _struct.equips = []
            for (let v_ of val) {
                _struct.equips.push(protcol_to_equip_info(v_));
            }
        }
    }
    return _struct;

}

export class partner {
     public entity_id:string = ""
     public partner_table_id:number = 0
     public rarity:em_rarity = em_rarity.common
     public curr_gf:gongfa = null
     public abonus:attribute = null
}

export function partner_to_protcol(_struct:partner) {
    let _protocol:any = {}
    _protocol["entity_id"] = _struct.entity_id
    _protocol["partner_table_id"] = _struct.partner_table_id
    _protocol["rarity"] = _struct.rarity
    _protocol["curr_gf"] = gongfa_to_protcol(_struct.curr_gf)
    _protocol["abonus"] = attribute_to_protcol(_struct.abonus)
    return _protocol;
}

export function protcol_to_partner(_protocol:any) {
    let _struct = new partner()
    for (let key in _protocol) {
        let val = _protocol[key];
        if (key == "entity_id") {
            _struct.entity_id = val;
        }
        else if (key == "partner_table_id") {
            _struct.partner_table_id = val;
        }
        else if (key == "rarity") {
            _struct.rarity = val;
        }
        else if (key == "curr_gf") {
            _struct.curr_gf = protcol_to_gongfa(val);
        }
        else if (key == "abonus") {
            _struct.abonus = protcol_to_attribute(val);
        }
    }
    return _struct;

}

export class player_info {
     public account_id:string = ""
     public player_id:string = ""
     public player_nick_name:string = ""
     public player_appearance:string = ""
     public abonus:attribute = null
     public gfs:Array<gongfa> = null
     public curr_gf:gongfa = null
     public equips:Array<equip_info> = null
     public wait_bbs:Array<bb> = null
     public curr_bbs:Array<bb> = null
     public wait_partner:Array<partner> = null
     public curr_partner:Array<partner> = null
     public items:Array<item> = null
     public tasks:Array<task_info> = null
     public gender:em_role_gender = em_role_gender.em_role_gender_female
     public scene:string = ""
     public line:number = 0
     public pos:position = null
}

export function player_info_to_protcol(_struct:player_info) {
    let _protocol:any = {}
    _protocol["account_id"] = _struct.account_id
    _protocol["player_id"] = _struct.player_id
    _protocol["player_nick_name"] = _struct.player_nick_name
    _protocol["player_appearance"] = _struct.player_appearance
    _protocol["abonus"] = attribute_to_protcol(_struct.abonus)
    if (_struct.gfs) {
        let _array_gfs = []
        for (let v_ of _struct.gfs) {
            _array_gfs.push(gongfa_to_protcol(v_))
        }
        _protocol["gfs"] = _array_gfs
    }
    _protocol["curr_gf"] = gongfa_to_protcol(_struct.curr_gf)
    if (_struct.equips) {
        let _array_equips = []
        for (let v_ of _struct.equips) {
            _array_equips.push(equip_info_to_protcol(v_))
        }
        _protocol["equips"] = _array_equips
    }
    if (_struct.wait_bbs) {
        let _array_wait_bbs = []
        for (let v_ of _struct.wait_bbs) {
            _array_wait_bbs.push(bb_to_protcol(v_))
        }
        _protocol["wait_bbs"] = _array_wait_bbs
    }
    if (_struct.curr_bbs) {
        let _array_curr_bbs = []
        for (let v_ of _struct.curr_bbs) {
            _array_curr_bbs.push(bb_to_protcol(v_))
        }
        _protocol["curr_bbs"] = _array_curr_bbs
    }
    if (_struct.wait_partner) {
        let _array_wait_partner = []
        for (let v_ of _struct.wait_partner) {
            _array_wait_partner.push(partner_to_protcol(v_))
        }
        _protocol["wait_partner"] = _array_wait_partner
    }
    if (_struct.curr_partner) {
        let _array_curr_partner = []
        for (let v_ of _struct.curr_partner) {
            _array_curr_partner.push(partner_to_protcol(v_))
        }
        _protocol["curr_partner"] = _array_curr_partner
    }
    if (_struct.items) {
        let _array_items = []
        for (let v_ of _struct.items) {
            _array_items.push(item_to_protcol(v_))
        }
        _protocol["items"] = _array_items
    }
    if (_struct.tasks) {
        let _array_tasks = []
        for (let v_ of _struct.tasks) {
            _array_tasks.push(task_info_to_protcol(v_))
        }
        _protocol["tasks"] = _array_tasks
    }
    _protocol["gender"] = _struct.gender
    _protocol["scene"] = _struct.scene
    _protocol["line"] = _struct.line
    _protocol["pos"] = position_to_protcol(_struct.pos)
    return _protocol;
}

export function protcol_to_player_info(_protocol:any) {
    let _struct = new player_info()
    for (let key in _protocol) {
        let val = _protocol[key];
        if (key == "account_id") {
            _struct.account_id = val;
        }
        else if (key == "player_id") {
            _struct.player_id = val;
        }
        else if (key == "player_nick_name") {
            _struct.player_nick_name = val;
        }
        else if (key == "player_appearance") {
            _struct.player_appearance = val;
        }
        else if (key == "abonus") {
            _struct.abonus = protcol_to_attribute(val);
        }
        else if (key == "gfs") {
            _struct.gfs = []
            for (let v_ of val) {
                _struct.gfs.push(protcol_to_gongfa(v_));
            }
        }
        else if (key == "curr_gf") {
            _struct.curr_gf = protcol_to_gongfa(val);
        }
        else if (key == "equips") {
            _struct.equips = []
            for (let v_ of val) {
                _struct.equips.push(protcol_to_equip_info(v_));
            }
        }
        else if (key == "wait_bbs") {
            _struct.wait_bbs = []
            for (let v_ of val) {
                _struct.wait_bbs.push(protcol_to_bb(v_));
            }
        }
        else if (key == "curr_bbs") {
            _struct.curr_bbs = []
            for (let v_ of val) {
                _struct.curr_bbs.push(protcol_to_bb(v_));
            }
        }
        else if (key == "wait_partner") {
            _struct.wait_partner = []
            for (let v_ of val) {
                _struct.wait_partner.push(protcol_to_partner(v_));
            }
        }
        else if (key == "curr_partner") {
            _struct.curr_partner = []
            for (let v_ of val) {
                _struct.curr_partner.push(protcol_to_partner(v_));
            }
        }
        else if (key == "items") {
            _struct.items = []
            for (let v_ of val) {
                _struct.items.push(protcol_to_item(v_));
            }
        }
        else if (key == "tasks") {
            _struct.tasks = []
            for (let v_ of val) {
                _struct.tasks.push(protcol_to_task_info(v_));
            }
        }
        else if (key == "gender") {
            _struct.gender = val;
        }
        else if (key == "scene") {
            _struct.scene = val;
        }
        else if (key == "line") {
            _struct.line = val;
        }
        else if (key == "pos") {
            _struct.pos = protcol_to_position(val);
        }
    }
    return _struct;

}

export class battle_entity {
     public entity_id:string = ""
     public nick_name:string = ""
     public appearance:string = ""
     public speed:number = 0
     public level:number = 0
     public abonus:attribute = null
     public skills:Array<skill_info> = null
}

export function battle_entity_to_protcol(_struct:battle_entity) {
    let _protocol:any = {}
    _protocol["entity_id"] = _struct.entity_id
    _protocol["nick_name"] = _struct.nick_name
    _protocol["appearance"] = _struct.appearance
    _protocol["speed"] = _struct.speed
    _protocol["level"] = _struct.level
    _protocol["abonus"] = attribute_to_protcol(_struct.abonus)
    if (_struct.skills) {
        let _array_skills = []
        for (let v_ of _struct.skills) {
            _array_skills.push(skill_info_to_protcol(v_))
        }
        _protocol["skills"] = _array_skills
    }
    return _protocol;
}

export function protcol_to_battle_entity(_protocol:any) {
    let _struct = new battle_entity()
    for (let key in _protocol) {
        let val = _protocol[key];
        if (key == "entity_id") {
            _struct.entity_id = val;
        }
        else if (key == "nick_name") {
            _struct.nick_name = val;
        }
        else if (key == "appearance") {
            _struct.appearance = val;
        }
        else if (key == "speed") {
            _struct.speed = val;
        }
        else if (key == "level") {
            _struct.level = val;
        }
        else if (key == "abonus") {
            _struct.abonus = protcol_to_attribute(val);
        }
        else if (key == "skills") {
            _struct.skills = []
            for (let v_ of val) {
                _struct.skills.push(protcol_to_skill_info(v_));
            }
        }
    }
    return _struct;

}

export class battle_info {
     public battle_team0:battle_entity = null
     public battle_team1:battle_entity = null
     public curr_bbs0:bb = null
     public curr_bbs1:bb = null
     public player:battle_entity = null
     public items:Array<item> = null
     public scene:string = ""
}

export function battle_info_to_protcol(_struct:battle_info) {
    let _protocol:any = {}
    _protocol["battle_team0"] = battle_entity_to_protcol(_struct.battle_team0)
    _protocol["battle_team1"] = battle_entity_to_protcol(_struct.battle_team1)
    _protocol["curr_bbs0"] = bb_to_protcol(_struct.curr_bbs0)
    _protocol["curr_bbs1"] = bb_to_protcol(_struct.curr_bbs1)
    _protocol["player"] = battle_entity_to_protcol(_struct.player)
    if (_struct.items) {
        let _array_items = []
        for (let v_ of _struct.items) {
            _array_items.push(item_to_protcol(v_))
        }
        _protocol["items"] = _array_items
    }
    _protocol["scene"] = _struct.scene
    return _protocol;
}

export function protcol_to_battle_info(_protocol:any) {
    let _struct = new battle_info()
    for (let key in _protocol) {
        let val = _protocol[key];
        if (key == "battle_team0") {
            _struct.battle_team0 = protcol_to_battle_entity(val);
        }
        else if (key == "battle_team1") {
            _struct.battle_team1 = protcol_to_battle_entity(val);
        }
        else if (key == "curr_bbs0") {
            _struct.curr_bbs0 = protcol_to_bb(val);
        }
        else if (key == "curr_bbs1") {
            _struct.curr_bbs1 = protcol_to_bb(val);
        }
        else if (key == "player") {
            _struct.player = protcol_to_battle_entity(val);
        }
        else if (key == "items") {
            _struct.items = []
            for (let v_ of val) {
                _struct.items.push(protcol_to_item(v_));
            }
        }
        else if (key == "scene") {
            _struct.scene = val;
        }
    }
    return _struct;

}

// this module code is codegen by geese codegen for typescript


