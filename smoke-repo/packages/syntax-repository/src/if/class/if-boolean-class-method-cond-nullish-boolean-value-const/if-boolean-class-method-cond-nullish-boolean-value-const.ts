const value: boolean | undefined = true;

export class IfBooleanClassMethodCondNullishBooleanValueConst {
    public run(): string {
        if (value ?? false) {
            return 'then';
        }
        return 'else';
    }
}
