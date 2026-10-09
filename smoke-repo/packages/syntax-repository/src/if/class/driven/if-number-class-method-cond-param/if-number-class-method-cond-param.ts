export class IfNumberClassMethodCondParam {
    public run(cond: number): string {
        if (cond) {
            return 'then';
        }
        return 'else';
    }
}
