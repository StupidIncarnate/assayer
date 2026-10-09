const cond: boolean = true;

export class IfBooleanClassStaticMethodCondConst {
    public static run(): string {
        if (cond) {
            return 'then';
        }
        return 'else';
    }
}
