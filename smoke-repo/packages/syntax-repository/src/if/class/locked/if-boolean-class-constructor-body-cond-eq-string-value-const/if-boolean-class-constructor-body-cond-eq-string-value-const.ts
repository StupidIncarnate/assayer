const value: string = 'abc';

export class IfBooleanClassConstructorBodyCondEqStringValueConst {
    public constructor() {
        if (value === 'xyz') {
            console.log('then');
        }
        console.log('else');
    }
}
