import * as engine from "./engine";
import { encode, decode } from "@msgpack/msgpack";
// this enum code is codegen by geese codegen for ts

export enum error_code {
    success = 0,
    cannot_claimed = 1,
    cannot_completed = 2,
    not_enough_money = 3,
}

export enum em_direction {
    stationary = 0,
    up = 1,
    down = 2,
    left = 3,
    right = 4,
}

export enum em_task_state {
    can_claimed = 1,
    in_progress = 2,
    can_completed = 3,
}

export enum em_harm_type {
    melee_attack = 1,
    bullet_damage = 2,
    bow_arrow = 3,
    magic_attack = 4,
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

export class task_info {
     public task_id:number = 0
     public status:em_task_state = em_task_state.can_claimed
}

export function task_info_to_protcol(_struct:task_info) {
    let _protocol:any = {}
    _protocol["task_id"] = _struct.task_id
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
        else if (key == "status") {
            _struct.status = val;
        }
    }
    return _struct;

}

export class item {
     public item_id:number = 0
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


