const cond: string = 'abc';

export class IfStringClassStaticMethodCondConst {
    public static run(): string {
        if (cond) {
            return 'then';
        }
        return 'else';
    }
}
