const value: boolean = true;

export class IfBooleanClassMethodCondNotBooleanValueConst {
    public run(): string {
        if (!value) {
            return 'then';
        }
        return 'else';
    }
}
