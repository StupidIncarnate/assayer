const value: number | undefined = 3;

export class IfNumberClassMethodCondNullishNumberValueConst {
    public run(): string {
        if (value ?? 0) {
            return 'then';
        }
        return 'else';
    }
}
