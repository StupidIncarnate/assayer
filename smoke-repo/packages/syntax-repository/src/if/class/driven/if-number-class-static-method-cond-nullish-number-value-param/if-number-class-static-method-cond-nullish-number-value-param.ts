export class IfNumberClassStaticMethodCondNullishNumberValueParam {
    public static run(value: number | undefined): string {
        if (value ?? 0) {
            return 'then';
        }
        return 'else';
    }
}
