export class IfBooleanClassMethodCondGtNumberValueParam {
    public run(value: number): string {
        if (value > 5) {
            return 'then';
        }
        return 'else';
    }
}
