const value: number | undefined = 3;

export class IfNumberClassGetterCondNullishNumberValueConst {
    public get result(): string {
        if (value ?? 0) {
            return 'then';
        }
        return 'else';
    }
}
