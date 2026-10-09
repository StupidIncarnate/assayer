const value: number = 3;

export class IfBooleanClassConstructorBodyCondGtNumberValueConst {
    public constructor() {
        if (value > 5) {
            console.log('then');
        }
        console.log('else');
    }
}
