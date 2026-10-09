export class IfBooleanClassConstructorBodyCondGtNumberValueParam {
    public constructor(value: number) {
        if (value > 5) {
            console.log('then');
        }
        console.log('else');
    }
}
