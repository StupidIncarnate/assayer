const cond: number = 3;

export class TernaryNumberClassStaticMethodCondConst {
    public static run(): string {
        return cond ? 'then' : 'else';
    }
}
