export class IfNumberClassConstructorBodyCondNullishNumberValueParam {
    public constructor(value: number | undefined) {
        if (value ?? 0) {
            console.log('then');
        }
        console.log('else');
    }
}
