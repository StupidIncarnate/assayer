export class IfBooleanClassConstructorBodyCondNotBooleanValueParam {
    public constructor(value: boolean) {
        if (!value) {
            console.log('then');
        }
        console.log('else');
    }
}
