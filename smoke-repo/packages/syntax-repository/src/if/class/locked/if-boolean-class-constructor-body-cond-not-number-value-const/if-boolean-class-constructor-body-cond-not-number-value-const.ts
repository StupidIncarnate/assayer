const value: number = 3;

export class IfBooleanClassConstructorBodyCondNotNumberValueConst {
    public constructor() {
        if (!value) {
            console.log('then');
        }
        console.log('else');
    }
}
