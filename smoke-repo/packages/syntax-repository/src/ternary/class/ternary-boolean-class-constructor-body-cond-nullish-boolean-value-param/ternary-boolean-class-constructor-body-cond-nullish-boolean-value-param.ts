export class TernaryBooleanClassConstructorBodyCondNullishBooleanValueParam {
    public constructor(value: boolean | undefined) {
        console.log(value ?? false ? 'then' : 'else');
    }
}
