const value: number | undefined = 3;

export class IfNumberClassConstructorBodyCondNullishNumberValueConst {
    public constructor() {
        if (value ?? 0) {
            console.log('then');
        }
        console.log('else');
    }
}
