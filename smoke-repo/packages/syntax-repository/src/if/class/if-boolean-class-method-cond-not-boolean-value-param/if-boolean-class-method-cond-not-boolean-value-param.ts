export class IfBooleanClassMethodCondNotBooleanValueParam {
    public run(value: boolean): string {
        if (!value) {
            return 'then';
        }
        return 'else';
    }
}
