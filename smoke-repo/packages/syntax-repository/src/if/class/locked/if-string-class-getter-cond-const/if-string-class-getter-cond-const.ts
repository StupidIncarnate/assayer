const cond: string = 'abc';

export class IfStringClassGetterCondConst {
    public get result(): string {
        if (cond) {
            return 'then';
        }
        return 'else';
    }
}
