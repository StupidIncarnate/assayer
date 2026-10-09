export class IfStringClassConstructorBodyCondParam {
    public constructor(cond: string) {
        if (cond) {
            console.log('then');
        }
        console.log('else');
    }
}
