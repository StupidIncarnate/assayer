export class IfNumberClassStaticMethodCondParam {
    public static run(cond: number): string {
        if (cond) {
            return 'then';
        }
        return 'else';
    }
}
