const value: string = 'abc';

export class TernaryBooleanClassConstructorBodyCondEqStringValueConst {
    public constructor() {
        console.log(value === 'xyz' ? 'then' : 'else');
    }
}
