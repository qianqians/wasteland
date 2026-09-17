import { _decorator, instantiate, Label, Node, Prefab, ProgressBar, RichText, Component } from 'cc';
import { BundleManager } from '../tools/BundleManager/BundleManager';
import { Progress } from './Progress'

export class Loading {
    private loadList: string[] = null;

    public OnLoadingDone: ()=>void;

    public async StartLoading(loadPage:Node, progressBarNodePath:string, loadList:string[]) {
        let progressBar = loadPage.getChildByPath(progressBarNodePath);
        let progress = new Progress();
        let handle = progress.InitProgressBar(progressBar);

        let p = 0;
        let wait = []
        for(let b of loadList) {
            wait.push(BundleManager.Instance.PreLoadBundleDir(b, "", null, ()=>{
                p += 0.1;
                handle(p);
            }));
        }
        await Promise.all(wait);
    }
}
