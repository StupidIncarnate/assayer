export class TernaryBooleanClassConstructorBodyCondNotNumberValueParam {
    public constructor(value: number) {
        console.log(!value ? 'then' : 'else');
    }
}
