export class IfBooleanClassConstructorBodyCondNotStringValueParam {
    public constructor(value: string) {
        if (!value) {
            console.log('then');
        }
        console.log('else');
    }
}
