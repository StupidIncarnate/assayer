export class TernaryBooleanClassConstructorBodyCondEqStringValueParam {
    public constructor(value: string) {
        console.log(value === 'xyz' ? 'then' : 'else');
    }
}
