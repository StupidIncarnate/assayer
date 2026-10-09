export class IfStringClassStaticMethodCondParam {
    public static run(cond: string): string {
        if (cond) {
            return 'then';
        }
        return 'else';
    }
}
