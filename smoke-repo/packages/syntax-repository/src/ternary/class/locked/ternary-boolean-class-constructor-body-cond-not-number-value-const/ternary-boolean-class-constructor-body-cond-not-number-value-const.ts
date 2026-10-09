const value: number = 3;

export class TernaryBooleanClassConstructorBodyCondNotNumberValueConst {
    public constructor() {
        console.log(!value ? 'then' : 'else');
    }
}
