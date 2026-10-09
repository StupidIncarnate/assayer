export class IfBooleanClassConstructorBodyCondEqNumberValueParam {
    public constructor(value: number) {
        if (value === 7) {
            console.log('then');
        }
        console.log('else');
    }
}
