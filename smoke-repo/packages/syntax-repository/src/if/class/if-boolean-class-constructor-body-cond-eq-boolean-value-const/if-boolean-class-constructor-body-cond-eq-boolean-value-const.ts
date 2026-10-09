const value: boolean = true;

export class IfBooleanClassConstructorBodyCondEqBooleanValueConst {
    public constructor() {
        if (value === false) {
            console.log('then');
        }
        console.log('else');
    }
}
