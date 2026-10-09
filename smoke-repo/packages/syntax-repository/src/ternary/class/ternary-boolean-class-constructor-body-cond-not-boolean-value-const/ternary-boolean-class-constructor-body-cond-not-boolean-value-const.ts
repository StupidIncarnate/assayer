const value: boolean = true;

export class TernaryBooleanClassConstructorBodyCondNotBooleanValueConst {
    public constructor() {
        console.log(!value ? 'then' : 'else');
    }
}
