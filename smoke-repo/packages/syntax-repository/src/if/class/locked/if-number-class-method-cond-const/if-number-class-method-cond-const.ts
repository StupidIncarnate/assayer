const cond: number = 3;

export class IfNumberClassMethodCondConst {
    public run(): string {
        if (cond) {
            return 'then';
        }
        return 'else';
    }
}
