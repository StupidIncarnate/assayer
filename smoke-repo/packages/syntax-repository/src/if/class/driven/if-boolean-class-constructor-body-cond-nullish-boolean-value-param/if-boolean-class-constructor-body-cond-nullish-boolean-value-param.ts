export class IfBooleanClassConstructorBodyCondNullishBooleanValueParam {
    public constructor(value: boolean | undefined) {
        if (value ?? false) {
            console.log('then');
        }
        console.log('else');
    }
}
