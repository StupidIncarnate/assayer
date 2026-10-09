export class IfBooleanClassConstructorBodyCondEqStringValueParam {
    public constructor(value: string) {
        if (value === 'xyz') {
            console.log('then');
        }
        console.log('else');
    }
}
