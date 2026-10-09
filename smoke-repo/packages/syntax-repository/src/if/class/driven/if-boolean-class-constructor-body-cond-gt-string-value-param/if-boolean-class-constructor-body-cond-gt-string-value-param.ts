export class IfBooleanClassConstructorBodyCondGtStringValueParam {
    public constructor(value: string) {
        if (value > 'm') {
            console.log('then');
        }
        console.log('else');
    }
}
