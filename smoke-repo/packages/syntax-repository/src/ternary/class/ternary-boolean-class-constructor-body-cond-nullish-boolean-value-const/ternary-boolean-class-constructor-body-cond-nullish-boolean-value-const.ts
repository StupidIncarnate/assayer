const value: boolean | undefined = true;

export class TernaryBooleanClassConstructorBodyCondNullishBooleanValueConst {
    public constructor() {
        console.log(value ?? false ? 'then' : 'else');
    }
}
