export class TernaryBooleanClassStaticMethodCondParam {
    public static run(cond: boolean): string {
        return cond ? 'then' : 'else';
    }
}
