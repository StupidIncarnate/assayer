export class TernaryNumberClassConstructorBodyCondNullishNumberValueParam {
    public constructor(value: number | undefined) {
        console.log(value ?? 0 ? 'then' : 'else');
    }
}
