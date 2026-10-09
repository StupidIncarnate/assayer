const value: string = 'abc';

export class TernaryBooleanClassMethodCondNotStringValueConst {
    public run(): string {
        return !value ? 'then' : 'else';
    }
}
