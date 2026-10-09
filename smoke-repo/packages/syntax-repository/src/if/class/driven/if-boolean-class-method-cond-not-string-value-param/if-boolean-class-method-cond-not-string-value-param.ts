export class IfBooleanClassMethodCondNotStringValueParam {
    public run(value: string): string {
        if (!value) {
            return 'then';
        }
        return 'else';
    }
}
