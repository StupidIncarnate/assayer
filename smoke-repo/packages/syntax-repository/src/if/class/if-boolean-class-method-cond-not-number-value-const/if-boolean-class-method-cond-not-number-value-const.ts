const value: number = 3;

export class IfBooleanClassMethodCondNotNumberValueConst {
    public run(): string {
        if (!value) {
            return 'then';
        }
        return 'else';
    }
}
