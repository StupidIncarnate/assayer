const cond: string = 'abc';

export class TernaryStringClassGetterCondConst {
    public get result(): string {
        return cond ? 'then' : 'else';
    }
}
