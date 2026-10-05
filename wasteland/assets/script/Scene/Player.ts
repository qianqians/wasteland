import { Node, Prefab, instantiate } from 'cc';
import * as engine from '../ServerSDK/engine/engine'
import * as common_cli from '../ServerSDK/engine/common_cli'
import { BundleManager } from '../tools/BundleManager/BundleManager';
import { PlayerScene } from './PlayerScene'

export class Player {
    public entity_id: string;
    public account_id: string
    public player_nick_name: string;
    public gender: common_cli.em_role_gender
    public appearance: string;

    public scene: PlayerScene;

    public constructor(entity_id: string, description: object) {
        this.entity_id = entity_id;
        this.account_id = description["account_id"]
        this.player_nick_name = description["player_nick_name"]
        this.gender = description["gender"]
        this.appearance = description["appearance"]

        this.scene = new PlayerScene(entity_id, description);
    } 
}