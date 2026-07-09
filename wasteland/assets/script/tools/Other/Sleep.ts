export function Sleep(ms: number): Promise<void> 
{
    return new Promise((resolve) => 
    {
        setTimeout(() => 
        {
            resolve();
        }, ms);
    });
}

export function Delay(ms: number, release: () => void): Promise<void> 
{
    return new Promise((resolve, reject) =>
    {
        setTimeout(async () =>
        {
            try {
                await release();
                resolve();
            }
            catch (err) {
                reject(err);
            }
        }, ms);
    });
}
