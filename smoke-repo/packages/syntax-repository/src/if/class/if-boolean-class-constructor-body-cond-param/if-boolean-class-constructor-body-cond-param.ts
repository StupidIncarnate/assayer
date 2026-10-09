export class IfBooleanClassConstructorBodyCondParam {
    public constructor(cond: boolean) {
        if (cond) {
            console.log('then');
        }
        console.log('else');
    }
}
