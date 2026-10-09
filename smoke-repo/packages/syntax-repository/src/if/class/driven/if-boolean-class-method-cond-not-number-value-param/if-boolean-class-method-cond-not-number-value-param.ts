export class IfBooleanClassMethodCondNotNumberValueParam {
    public run(value: number): string {
        if (!value) {
            return 'then';
        }
        return 'else';
    }
}
