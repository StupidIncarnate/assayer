const cond: boolean = true;

export class IfBooleanClassConstructorBodyCondConst {
    public constructor() {
        if (cond) {
            console.log('then');
        }
        console.log('else');
    }
}
