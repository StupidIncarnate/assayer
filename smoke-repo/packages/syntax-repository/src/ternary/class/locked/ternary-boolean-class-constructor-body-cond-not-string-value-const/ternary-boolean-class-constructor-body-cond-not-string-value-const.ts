const value: string = 'abc';

export class TernaryBooleanClassConstructorBodyCondNotStringValueConst {
    public constructor() {
        console.log(!value ? 'then' : 'else');
    }
}
