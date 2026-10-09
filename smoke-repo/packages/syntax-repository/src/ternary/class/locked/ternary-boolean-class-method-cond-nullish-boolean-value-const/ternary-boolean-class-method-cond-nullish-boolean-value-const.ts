const value: boolean | undefined = true;

export class TernaryBooleanClassMethodCondNullishBooleanValueConst {
    public run(): string {
        return value ?? false ? 'then' : 'else';
    }
}
