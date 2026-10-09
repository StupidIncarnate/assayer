const cond: boolean = true;

export class TernaryBooleanClassStaticMethodCondConst {
    public static run(): string {
        return cond ? 'then' : 'else';
    }
}
