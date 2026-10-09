const value: string = 'abc';

export class IfBooleanClassMethodCondNotStringValueConst {
    public run(): string {
        if (!value) {
            return 'then';
        }
        return 'else';
    }
}
