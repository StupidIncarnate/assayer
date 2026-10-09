export class TernaryStringClassConstructorBodyCondNullishStringValueParam {
    public constructor(value: string | undefined) {
        console.log(value ?? '' ? 'then' : 'else');
    }
}
