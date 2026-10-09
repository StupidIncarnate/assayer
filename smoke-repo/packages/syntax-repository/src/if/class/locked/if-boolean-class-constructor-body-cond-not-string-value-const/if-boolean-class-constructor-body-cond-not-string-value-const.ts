const value: string = 'abc';

export class IfBooleanClassConstructorBodyCondNotStringValueConst {
    public constructor() {
        if (!value) {
            console.log('then');
        }
        console.log('else');
    }
}
