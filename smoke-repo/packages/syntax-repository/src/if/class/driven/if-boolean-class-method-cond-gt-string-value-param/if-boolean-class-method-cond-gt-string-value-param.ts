export class IfBooleanClassMethodCondGtStringValueParam {
    public run(value: string): string {
        if (value > 'm') {
            return 'then';
        }
        return 'else';
    }
}
