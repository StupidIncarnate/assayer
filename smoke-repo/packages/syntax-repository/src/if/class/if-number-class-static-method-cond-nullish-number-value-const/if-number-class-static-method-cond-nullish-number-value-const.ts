const value: number | undefined = 3;

export class IfNumberClassStaticMethodCondNullishNumberValueConst {
    public static run(): string {
        if (value ?? 0) {
            return 'then';
        }
        return 'else';
    }
}
