const cond: number = 3;

export class IfNumberClassStaticMethodCondConst {
    public static run(): string {
        if (cond) {
            return 'then';
        }
        return 'else';
    }
}
