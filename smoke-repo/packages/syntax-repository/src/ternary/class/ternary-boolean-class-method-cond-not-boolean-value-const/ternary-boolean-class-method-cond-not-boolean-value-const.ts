const value: boolean = true;

export class TernaryBooleanClassMethodCondNotBooleanValueConst {
    public run(): string {
        return !value ? 'then' : 'else';
    }
}
