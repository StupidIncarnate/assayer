export class IfBooleanClassStaticMethodCondParam {
    public static run(cond: boolean): string {
        if (cond) {
            return 'then';
        }
        return 'else';
    }
}
