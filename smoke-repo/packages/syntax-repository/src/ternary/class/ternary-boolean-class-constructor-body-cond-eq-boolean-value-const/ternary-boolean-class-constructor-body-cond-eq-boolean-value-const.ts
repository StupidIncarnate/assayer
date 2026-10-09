const value: boolean = true;

export class TernaryBooleanClassConstructorBodyCondEqBooleanValueConst {
    public constructor() {
        console.log(value === false ? 'then' : 'else');
    }
}
