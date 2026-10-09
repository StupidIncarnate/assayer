const value: number = 3;

export class IfBooleanClassConstructorBodyCondEqNumberValueConst {
    public constructor() {
        if (value === 7) {
            console.log('then');
        }
        console.log('else');
    }
}
