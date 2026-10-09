const value: string | undefined = 'abc';

export class TernaryStringClassConstructorBodyCondNullishStringValueConst {
    public constructor() {
        console.log(value ?? '' ? 'then' : 'else');
    }
}
