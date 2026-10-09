const cond: string = 'abc';

export class TernaryStringClassStaticMethodCondConst {
    public static run(): string {
        return cond ? 'then' : 'else';
    }
}
