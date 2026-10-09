const value: number = 3;

export class IfBooleanClassMethodCondGtNumberValueConst {
    public run(): string {
        if (value > 5) {
            return 'then';
        }
        return 'else';
    }
}
