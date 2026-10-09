export class TernaryStringClassStaticMethodCondParam {
    public static run(cond: string): string {
        return cond ? 'then' : 'else';
    }
}
