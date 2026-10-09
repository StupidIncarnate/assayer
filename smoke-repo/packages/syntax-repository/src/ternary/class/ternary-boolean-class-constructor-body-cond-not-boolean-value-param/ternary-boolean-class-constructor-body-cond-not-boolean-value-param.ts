export class TernaryBooleanClassConstructorBodyCondNotBooleanValueParam {
    public constructor(value: boolean) {
        console.log(!value ? 'then' : 'else');
    }
}
