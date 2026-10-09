const value: boolean = true;

export class TernaryBooleanClassMethodCondEqBooleanValueConst {
    public run(): string {
        return value === false ? 'then' : 'else';
    }
}
