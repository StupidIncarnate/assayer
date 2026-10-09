export class TernaryNumberClassStaticMethodCondExternal {
    public static run(): string {
        return Number(process.argv[2]) ? 'then' : 'else';
    }
}
