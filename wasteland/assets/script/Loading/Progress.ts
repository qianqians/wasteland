import { _decorator, instantiate, Label, Node, Prefab, ProgressBar, RichText, Component } from 'cc';

export class Progress {
    public progressBar:Node = null;

    public InitProgressBar(progressNode:Node) : (progress:number) => void {
        this.progressBar = progressNode;
        let progressBar = this.progressBar?.getComponent(ProgressBar);
        if (progressBar) {
            progressBar.progress = 0;
        }
        
        return (progress:number) => { 
            if (!this.progressBar) {
                return;
            }
            let progressBar = this.progressBar?.getComponent(ProgressBar);
            if (progressBar) {
                progressBar.progress = progress; 
            }
        }
    }
}