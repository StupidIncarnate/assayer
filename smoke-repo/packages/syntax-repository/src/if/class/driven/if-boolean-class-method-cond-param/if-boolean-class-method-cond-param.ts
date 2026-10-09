export class IfBooleanClassMethodCondParam {
    public run(cond: boolean): string {
        if (cond) {
            return 'then';
        }
        return 'else';
    }
}
