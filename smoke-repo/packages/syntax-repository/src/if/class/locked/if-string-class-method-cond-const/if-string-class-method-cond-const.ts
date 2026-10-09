const cond: string = 'abc';

export class IfStringClassMethodCondConst {
    public run(): string {
        if (cond) {
            return 'then';
        }
        return 'else';
    }
}
