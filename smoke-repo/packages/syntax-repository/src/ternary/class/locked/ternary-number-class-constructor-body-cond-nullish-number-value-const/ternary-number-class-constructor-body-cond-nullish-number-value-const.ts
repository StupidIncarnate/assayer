const value: number | undefined = 3;

export class TernaryNumberClassConstructorBodyCondNullishNumberValueConst {
    public constructor() {
        console.log(value ?? 0 ? 'then' : 'else');
    }
}
