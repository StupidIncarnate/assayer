const value: boolean | undefined = true;

export class IfBooleanClassConstructorBodyCondNullishBooleanValueConst {
    public constructor() {
        if (value ?? false) {
            console.log('then');
        }
        console.log('else');
    }
}
