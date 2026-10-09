export class TernaryBooleanClassConstructorBodyCondNotStringValueParam {
    public constructor(value: string) {
        console.log(!value ? 'then' : 'else');
    }
}
