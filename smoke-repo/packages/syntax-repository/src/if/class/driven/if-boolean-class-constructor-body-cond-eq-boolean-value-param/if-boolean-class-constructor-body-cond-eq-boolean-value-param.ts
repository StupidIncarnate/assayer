export class IfBooleanClassConstructorBodyCondEqBooleanValueParam {
    public constructor(value: boolean) {
        if (value === false) {
            console.log('then');
        }
        console.log('else');
    }
}
