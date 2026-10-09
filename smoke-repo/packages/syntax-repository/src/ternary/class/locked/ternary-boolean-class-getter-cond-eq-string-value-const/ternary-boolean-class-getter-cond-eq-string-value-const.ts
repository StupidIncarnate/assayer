const value: string = 'abc';

export class TernaryBooleanClassGetterCondEqStringValueConst {
    public get result(): string {
        return value === 'xyz' ? 'then' : 'else';
    }
}
