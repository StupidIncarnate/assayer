export class IfBooleanClassConstructorBodyCondNotNumberValueParam {
    public constructor(value: number) {
        if (!value) {
            console.log('then');
        }
        console.log('else');
    }
}
