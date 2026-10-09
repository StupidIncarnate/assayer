export class IfNumberClassConstructorBodyCondParam {
    public constructor(cond: number) {
        if (cond) {
            console.log('then');
        }
        console.log('else');
    }
}
