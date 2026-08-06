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

export enum direction {
    none = 0,
    up = 1,
    down = 2,
    left = 4,
    right = 8,
}

export enum em_task_state {
    can_claimed = 1,
    in_progress = 2,
    can_completed = 3,
    completed = 4,
}

// this struct code is codegen by geese codegen for ts
export class position {
     public x:number = 0
     public y:number = 0
     public dir:direction = direction.none
}

export function position_to_protcol(_struct:position) {
    let _protocol:any = {}
    _protocol["x"] = _struct.x
    _protocol["y"] = _struct.y
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
        else if (key == "dir") {
            _struct.dir = val;
        }
    }
    return _struct;

}

export class attribute {
     public add_hp:number = 0
     public add_mp:number = 0
     public attack:number = 0
     public defense:number = 0
     public matk:number = 0
     public resist:number = 0
}

export function attribute_to_protcol(_struct:attribute) {
    let _protocol:any = {}
    _protocol["add_hp"] = _struct.add_hp
    _protocol["add_mp"] = _struct.add_mp
    _protocol["attack"] = _struct.attack
    _protocol["defense"] = _struct.defense
    _protocol["matk"] = _struct.matk
    _protocol["resist"] = _struct.resist
    return _protocol;
}

export function protcol_to_attribute(_protocol:any) {
    let _struct = new attribute()
    for (let key in _protocol) {
        let val = _protocol[key];
        if (key == "add_hp") {
            _struct.add_hp = val;
        }
        else if (key == "add_mp") {
            _struct.add_mp = val;
        }
        else if (key == "attack") {
            _struct.attack = val;
        }
        else if (key == "defense") {
            _struct.defense = val;
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
     public bonus:attribute = null
}

export function equip_info_to_protcol(_struct:equip_info) {
    let _protocol:any = {}
    _protocol["equip_id"] = _struct.equip_id
    _protocol["name"] = _struct.name
    _protocol["icon"] = _struct.icon
    _protocol["desc"] = _struct.desc
    _protocol["equip_type"] = _struct.equip_type
    _protocol["rarity"] = _struct.rarity
    _protocol["bonus"] = attribute_to_protcol(_struct.bonus)
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
        else if (key == "bonus") {
            _struct.bonus = protcol_to_attribute(val);
        }
    }
    return _struct;

}

export class skill_info {
     public skill_id:number = 0
     public attack:number = 0
     public attack_range:number = 0
     public cd_round:number = 0
     public cast_spells:number = 0.0
}

export function skill_info_to_protcol(_struct:skill_info) {
    let _protocol:any = {}
    _protocol["skill_id"] = _struct.skill_id
    _protocol["attack"] = _struct.attack
    _protocol["attack_range"] = _struct.attack_range
    _protocol["cd_round"] = _struct.cd_round
    _protocol["cast_spells"] = _struct.cast_spells
    return _protocol;
}

export function protcol_to_skill_info(_protocol:any) {
    let _struct = new skill_info()
    for (let key in _protocol) {
        let val = _protocol[key];
        if (key == "skill_id") {
            _struct.skill_id = val;
        }
        else if (key == "attack") {
            _struct.attack = val;
        }
        else if (key == "attack_range") {
            _struct.attack_range = val;
        }
        else if (key == "cd_round") {
            _struct.cd_round = val;
        }
        else if (key == "cast_spells") {
            _struct.cast_spells = val;
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
        _array_skills = []
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
     public bonus:gongfa_bonus = null
}

export function gongfa_to_protcol(_struct:gongfa) {
    let _protocol:any = {}
    _protocol["gongfa_table_id"] = _struct.gongfa_table_id
    _protocol["rarity"] = _struct.rarity
    _protocol["gongfa_level"] = _struct.gongfa_level
    _protocol["bonus"] = gongfa_bonus_to_protcol(_struct.bonus)
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
        else if (key == "bonus") {
            _struct.bonus = protcol_to_gongfa_bonus(val);
        }
    }
    return _struct;

}

export class task_progress_info {
     public table_id:number = 0
     public total:number = 0
     public progress:number = 0
}

export function task_progress_info_to_protcol(_struct:task_progress_info) {
    let _protocol:any = {}
    _protocol["table_id"] = _struct.table_id
    _protocol["total"] = _struct.total
    _protocol["progress"] = _struct.progress
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
        _array_progress = []
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
     public item_id:string = ""
     public item_type:number = 0
     public item_count:number = 0
}

export function item_to_protcol(_struct:item) {
    let _protocol:any = {}
    _protocol["item_id"] = _struct.item_id
    _protocol["item_type"] = _struct.item_type
    _protocol["item_count"] = _struct.item_count
    return _protocol;
}

export function protcol_to_item(_protocol:any) {
    let _struct = new item()
    for (let key in _protocol) {
        let val = _protocol[key];
        if (key == "item_id") {
            _struct.item_id = val;
        }
        else if (key == "item_type") {
            _struct.item_type = val;
        }
        else if (key == "item_count") {
            _struct.item_count = val;
        }
    }
    return _struct;

}

export class bb {
     public bb_table_id:number = 0
     public rarity:em_rarity = em_rarity.common
     public level:number = 0
     public bonus:attribute = null
     public skills:Array<skill_info> = null
     public equips:Array<equip_info> = null
}

export function bb_to_protcol(_struct:bb) {
    let _protocol:any = {}
    _protocol["bb_table_id"] = _struct.bb_table_id
    _protocol["rarity"] = _struct.rarity
    _protocol["level"] = _struct.level
    _protocol["bonus"] = attribute_to_protcol(_struct.bonus)
    if (_struct.skills) {
        _array_skills = []
        for (let v_ of _struct.skills) {
            _array_skills.push(skill_info_to_protcol(v_))
        }
        _protocol["skills"] = _array_skills
    }
    if (_struct.equips) {
        _array_equips = []
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
        if (key == "bb_table_id") {
            _struct.bb_table_id = val;
        }
        else if (key == "rarity") {
            _struct.rarity = val;
        }
        else if (key == "level") {
            _struct.level = val;
        }
        else if (key == "bonus") {
            _struct.bonus = protcol_to_attribute(val);
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

export class player_info {
     public account_id:string = ""
     public player_id:string = ""
     public player_nick_name:string = ""
     public player_appearance:number = 0
     public abonus:attribute = null
     public gfs:Array<gongfa> = null
     public curr_gf:gongfa = null
     public equips:Array<equip_info> = null
     public bbs:Array<bb> = null
     public curr_bb:bb = null
     public tasks:Array<task_info> = null
     public gender:number = 0
     public scene:string = ""
     public line:number = 0
     public pos:position = null
     public dir:direction = direction.none
}

export function player_info_to_protcol(_struct:player_info) {
    let _protocol:any = {}
    _protocol["account_id"] = _struct.account_id
    _protocol["player_id"] = _struct.player_id
    _protocol["player_nick_name"] = _struct.player_nick_name
    _protocol["player_appearance"] = _struct.player_appearance
    _protocol["abonus"] = attribute_to_protcol(_struct.abonus)
    if (_struct.gfs) {
        _array_gfs = []
        for (let v_ of _struct.gfs) {
            _array_gfs.push(gongfa_to_protcol(v_))
        }
        _protocol["gfs"] = _array_gfs
    }
    _protocol["curr_gf"] = gongfa_to_protcol(_struct.curr_gf)
    if (_struct.equips) {
        _array_equips = []
        for (let v_ of _struct.equips) {
            _array_equips.push(equip_info_to_protcol(v_))
        }
        _protocol["equips"] = _array_equips
    }
    if (_struct.bbs) {
        _array_bbs = []
        for (let v_ of _struct.bbs) {
            _array_bbs.push(bb_to_protcol(v_))
        }
        _protocol["bbs"] = _array_bbs
    }
    _protocol["curr_bb"] = bb_to_protcol(_struct.curr_bb)
    if (_struct.tasks) {
        _array_tasks = []
        for (let v_ of _struct.tasks) {
            _array_tasks.push(task_info_to_protcol(v_))
        }
        _protocol["tasks"] = _array_tasks
    }
    _protocol["gender"] = _struct.gender
    _protocol["scene"] = _struct.scene
    _protocol["line"] = _struct.line
    _protocol["pos"] = position_to_protcol(_struct.pos)
    _protocol["dir"] = _struct.dir
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
        else if (key == "bbs") {
            _struct.bbs = []
            for (let v_ of val) {
                _struct.bbs.push(protcol_to_bb(v_));
            }
        }
        else if (key == "curr_bb") {
            _struct.curr_bb = protcol_to_bb(val);
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
        else if (key == "dir") {
            _struct.dir = val;
        }
    }
    return _struct;

}

export class friendship {
     public friend_table_id:number = 0
     public abonus:attribute = null
     public curr_gf:gongfa = null
     public equips:Array<equip_info> = null
}

export function friendship_to_protcol(_struct:friendship) {
    let _protocol:any = {}
    _protocol["friend_table_id"] = _struct.friend_table_id
    _protocol["abonus"] = attribute_to_protcol(_struct.abonus)
    _protocol["curr_gf"] = gongfa_to_protcol(_struct.curr_gf)
    if (_struct.equips) {
        _array_equips = []
        for (let v_ of _struct.equips) {
            _array_equips.push(equip_info_to_protcol(v_))
        }
        _protocol["equips"] = _array_equips
    }
    return _protocol;
}

export function protcol_to_friendship(_protocol:any) {
    let _struct = new friendship()
    for (let key in _protocol) {
        let val = _protocol[key];
        if (key == "friend_table_id") {
            _struct.friend_table_id = val;
        }
        else if (key == "abonus") {
            _struct.abonus = protcol_to_attribute(val);
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
    }
    return _struct;

}

export class team {
     public team_id:string = ""
     public players:Array<player_info> = null
     public friends:Array<friendship> = null
}

export function team_to_protcol(_struct:team) {
    let _protocol:any = {}
    _protocol["team_id"] = _struct.team_id
    if (_struct.players) {
        _array_players = []
        for (let v_ of _struct.players) {
            _array_players.push(player_info_to_protcol(v_))
        }
        _protocol["players"] = _array_players
    }
    if (_struct.friends) {
        _array_friends = []
        for (let v_ of _struct.friends) {
            _array_friends.push(friendship_to_protcol(v_))
        }
        _protocol["friends"] = _array_friends
    }
    return _protocol;
}

export function protcol_to_team(_protocol:any) {
    let _struct = new team()
    for (let key in _protocol) {
        let val = _protocol[key];
        if (key == "team_id") {
            _struct.team_id = val;
        }
        else if (key == "players") {
            _struct.players = []
            for (let v_ of val) {
                _struct.players.push(protcol_to_player_info(v_));
            }
        }
        else if (key == "friends") {
            _struct.friends = []
            for (let v_ of val) {
                _struct.friends.push(protcol_to_friendship(v_));
            }
        }
    }
    return _struct;

}

// this module code is codegen by geese codegen for typescript


