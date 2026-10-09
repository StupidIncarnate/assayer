export class IfBooleanClassMethodCondNullishBooleanValueParam {
    public run(value: boolean | undefined): string {
        if (value ?? false) {
            return 'then';
        }
        return 'else';
    }
}
