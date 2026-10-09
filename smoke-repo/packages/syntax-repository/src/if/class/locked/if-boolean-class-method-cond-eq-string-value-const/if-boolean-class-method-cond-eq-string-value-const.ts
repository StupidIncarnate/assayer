const value: string = 'abc';

export class IfBooleanClassMethodCondEqStringValueConst {
    public run(): string {
        if (value === 'xyz') {
            return 'then';
        }
        return 'else';
    }
}
