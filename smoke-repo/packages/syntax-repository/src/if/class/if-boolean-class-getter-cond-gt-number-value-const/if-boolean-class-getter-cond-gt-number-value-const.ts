const value: number = 3;

export class IfBooleanClassGetterCondGtNumberValueConst {
    public get result(): string {
        if (value > 5) {
            return 'then';
        }
        return 'else';
    }
}
