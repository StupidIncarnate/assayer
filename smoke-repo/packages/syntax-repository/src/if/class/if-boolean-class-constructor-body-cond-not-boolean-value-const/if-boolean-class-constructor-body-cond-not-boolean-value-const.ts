const value: boolean = true;

export class IfBooleanClassConstructorBodyCondNotBooleanValueConst {
    public constructor() {
        if (!value) {
            console.log('then');
        }
        console.log('else');
    }
}
