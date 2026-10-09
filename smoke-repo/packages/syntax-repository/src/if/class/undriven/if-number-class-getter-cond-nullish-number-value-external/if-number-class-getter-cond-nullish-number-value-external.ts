export class IfNumberClassGetterCondNullishNumberValueExternal {
    public get result(): string {
        if ((process.argv[2] === undefined ? undefined : Number(process.argv[2])) ?? 0) {
            return 'then';
        }
        return 'else';
    }
}
