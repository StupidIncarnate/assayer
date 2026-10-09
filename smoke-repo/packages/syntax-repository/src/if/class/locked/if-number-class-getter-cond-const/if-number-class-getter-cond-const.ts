const cond: number = 3;

export class IfNumberClassGetterCondConst {
    public get result(): string {
        if (cond) {
            return 'then';
        }
        return 'else';
    }
}
