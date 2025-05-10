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
}

export enum em_direction {
    stationary = 0,
    up = 1,
    down = 2,
    left = 3,
    right = 4,
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
}

export function position_to_protcol(_struct:position) {
    let _protocol:any = {}
    _protocol["x"] = _struct.x
    _protocol["y"] = _struct.y
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
        else if (key == "add_defense") {
            _struct.add_defense = val;
        }
    }
    return _struct;

}

export class weapon_info {
     public id:string = ""
     public name:string = ""
     public icon:string = ""
     public desc:string = ""
     public equip_type:em_equip_type = em_equip_type.helmet
     public attack:number = 0
}

export function weapon_info_to_protcol(_struct:weapon_info) {
    let _protocol:any = {}
    _protocol["id"] = _struct.id
    _protocol["name"] = _struct.name
    _protocol["icon"] = _struct.icon
    _protocol["desc"] = _struct.desc
    _protocol["equip_type"] = _struct.equip_type
    _protocol["attack"] = _struct.attack
    return _protocol;
}

export function protcol_to_weapon_info(_protocol:any) {
    let _struct = new weapon_info()
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
        else if (key == "attack") {
            _struct.attack = val;
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

export class shooting_info {
     public id:string = ""
     public name:string = ""
     public icon:string = ""
     public desc:string = ""
     public equip_type:em_equip_type = em_equip_type.helmet
     public _bullet_info:bullet_info = null
}

export function shooting_info_to_protcol(_struct:shooting_info) {
    let _protocol:any = {}
    _protocol["id"] = _struct.id
    _protocol["name"] = _struct.name
    _protocol["icon"] = _struct.icon
    _protocol["desc"] = _struct.desc
    _protocol["equip_type"] = _struct.equip_type
    _protocol["_bullet_info"] = bullet_info_to_protcol(_struct._bullet_info)
    return _protocol;
}

export function protcol_to_shooting_info(_protocol:any) {
    let _struct = new shooting_info()
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
        else if (key == "_bullet_info") {
            _struct._bullet_info = protcol_to_bullet_info(val);
        }
    }
    return _struct;

}

export class task_info {
     public task_id:number = 0
     public progress:number = 0
     public status:em_task_state = em_task_state.can_claimed
}

export function task_info_to_protcol(_struct:task_info) {
    let _protocol:any = {}
    _protocol["task_id"] = _struct.task_id
    _protocol["progress"] = _struct.progress
    _protocol["status"] = _struct.status
    return _protocol;
}

export function protcol_to_task_info(_protocol:any) {
    let _struct = new task_info()
    for (let key in _protocol) {
        let val = _protocol[key];
        if (key == "task_id") {
            _struct.task_id = val;
        }
        else if (key == "progress") {
            _struct.progress = val;
        }
        else if (key == "status") {
            _struct.status = val;
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

// this module code is codegen by geese codegen for typescript


