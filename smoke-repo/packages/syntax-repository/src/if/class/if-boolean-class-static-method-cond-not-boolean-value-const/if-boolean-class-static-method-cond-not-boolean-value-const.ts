const value: boolean = true;

export class IfBooleanClassStaticMethodCondNotBooleanValueConst {
    public static run(): string {
        if (!value) {
            return 'then';
        }
        return 'else';
    }
}
