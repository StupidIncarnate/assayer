export class IfStringClassMethodCondParam {
    public run(cond: string): string {
        if (cond) {
            return 'then';
        }
        return 'else';
    }
}
