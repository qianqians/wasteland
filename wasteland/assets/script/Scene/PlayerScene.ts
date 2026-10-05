import { Node, Prefab, instantiate } from 'cc';
import * as engine from '../ServerSDK/engine/engine'
import * as common_cli from '../ServerSDK/engine/common_cli'
import { BundleManager } from '../tools/BundleManager/BundleManager';

export class PlayerScene {
    public entity_id: string;
    public scene_name:string;
    public scene_line:number;
    public scene_data: common_cli.position_info;

    public constructor(entity_id: string, description: object) {
        this.entity_id = entity_id;

        let scene_data = description["scene_data"];
        this.scene_name = scene_data["scene_name"];
        this.scene_line = scene_data["scene_line"];
        this.scene_data = common_cli.protcol_to_position_info(scene_data["pos"]);
    }

}