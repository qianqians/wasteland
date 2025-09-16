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
}

export enum em_equip_type {
    helmet = 1,
    jacket = 2,
    trousers = 3,
    gloves = 4,
    boots = 5,
    weapon = 6,
    shooting = 7,
}

export enum em_shooting_bullet {
    arrow = 1,
    bullet = 2,
}

export enum direction {
    none = 0,
    up = 1,
    down = 2,
    left = 3,
    right = 4,
}

export enum em_task_state {
    can_claimed = 1,
    in_progress = 2,
    can_completed = 3,
    completed = 4,
}

export enum em_harm_type {
    melee_attack = 1,
    bullet_damage = 2,
    bow_arrow = 3,
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

export class equip_info {
     public id:string = ""
     public name:string = ""
     public icon:string = ""
     public desc:string = ""
     public equip_type:em_equip_type = em_equip_type.helmet
     public add_hp:number = 0
     public add_mp:number = 0
     public attack:number = 0
     public add_defense:number = 0
}

export function equip_info_to_protcol(_struct:equip_info) {
    let _protocol:any = {}
    _protocol["id"] = _struct.id
    _protocol["name"] = _struct.name
    _protocol["icon"] = _struct.icon
    _protocol["desc"] = _struct.desc
    _protocol["equip_type"] = _struct.equip_type
    _protocol["add_hp"] = _struct.add_hp
    _protocol["add_mp"] = _struct.add_mp
    _protocol["attack"] = _struct.attack
    _protocol["add_defense"] = _struct.add_defense
    return _protocol;
}

export function protcol_to_equip_info(_protocol:any) {
    let _struct = new equip_info()
    for (let key in _protocol) {
        let val = _protocol[key];
        if (key == "id") {
            _struct.id = val;
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
        else if (key == "add_hp") {
            _struct.add_hp = val;
        }
        else if (key == "add_mp") {
            _struct.add_mp = val;
        }
        else if (key == "attack") {
            _struct.attack = val;
        }
        else if (key == "add_defense") {
            _struct.add_defense = val;
        }
    }
    return _struct;

}

export class bullet_info {
     public id:string = ""
     public name:string = ""
     public icon:string = ""
     public desc:string = ""
     public type:em_shooting_bullet = em_shooting_bullet.arrow
     public attack:number = 0
     public speed:number = 0
}

export function bullet_info_to_protcol(_struct:bullet_info) {
    let _protocol:any = {}
    _protocol["id"] = _struct.id
    _protocol["name"] = _struct.name
    _protocol["icon"] = _struct.icon
    _protocol["desc"] = _struct.desc
    _protocol["type"] = _struct.type
    _protocol["attack"] = _struct.attack
    _protocol["speed"] = _struct.speed
    return _protocol;
}

export function protcol_to_bullet_info(_protocol:any) {
    let _struct = new bullet_info()
    for (let key in _protocol) {
        let val = _protocol[key];
        if (key == "id") {
            _struct.id = val;
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
        else if (key == "type") {
            _struct.type = val;
        }
        else if (key == "attack") {
            _struct.attack = val;
        }
        else if (key == "speed") {
            _struct.speed = val;
        }
    }
    return _struct;

}

export class player_info {
     public account_id:string = ""
     public player_id:string = ""
     public player_nick_name:string = ""
     public player_appearance:number = 0
     public gender:number = 0
     public level:number = 0
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
    _protocol["gender"] = _struct.gender
    _protocol["level"] = _struct.level
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
        else if (key == "gender") {
            _struct.gender = val;
        }
        else if (key == "level") {
            _struct.level = val;
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

export class task_progress_info {
     public id:number = 0
     public progress:number = 0
     public watch_task:Array<number> = null
}

export function task_progress_info_to_protcol(_struct:task_progress_info) {
    let _protocol:any = {}
    _protocol["id"] = _struct.id
    _protocol["progress"] = _struct.progress
    if (_struct.watch_task) {
        _array_watch_task = []
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
        if (key == "id") {
            _struct.id = val;
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

export class task_progress_total {
     public id:number = 0
     public total:number = 0
}

export function task_progress_total_to_protcol(_struct:task_progress_total) {
    let _protocol:any = {}
    _protocol["id"] = _struct.id
    _protocol["total"] = _struct.total
    return _protocol;
}

export function protcol_to_task_progress_total(_protocol:any) {
    let _struct = new task_progress_total()
    for (let key in _protocol) {
        let val = _protocol[key];
        if (key == "id") {
            _struct.id = val;
        }
        else if (key == "total") {
            _struct.total = val;
        }
    }
    return _struct;

}

export class task_info {
     public task_id:number = 0
     public status:em_task_state = em_task_state.can_claimed
     public progress:Array<task_progress_total> = null
     public refresh_time:number = 0
}

export function task_info_to_protcol(_struct:task_info) {
    let _protocol:any = {}
    _protocol["task_id"] = _struct.task_id
    _protocol["status"] = _struct.status
    if (_struct.progress) {
        _array_progress = []
        for (let v_ of _struct.progress) {
            _array_progress.push(task_progress_total_to_protcol(v_))
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
                _struct.progress.push(protcol_to_task_progress_total(v_));
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

export class skill_info {
     public skill_id:number = 0
     public attack:number = 0
     public attack_range:number = 0
     public cd_time:number = 0
     public cd_ready:number = 0
}

export function skill_info_to_protcol(_struct:skill_info) {
    let _protocol:any = {}
    _protocol["skill_id"] = _struct.skill_id
    _protocol["attack"] = _struct.attack
    _protocol["attack_range"] = _struct.attack_range
    _protocol["cd_time"] = _struct.cd_time
    _protocol["cd_ready"] = _struct.cd_ready
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
        else if (key == "cd_time") {
            _struct.cd_time = val;
        }
        else if (key == "cd_ready") {
            _struct.cd_ready = val;
        }
    }
    return _struct;

}

// this module code is codegen by geese codegen for typescript


