const value: string = 'abc';

export class IfBooleanClassGetterCondEqStringValueConst {
    public get result(): string {
        if (value === 'xyz') {
            return 'then';
        }
        return 'else';
    }
}
