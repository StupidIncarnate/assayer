const cond: string = 'abc';

const ifStringDefaultExportCondConst = (): string => {
    if (cond) {
        return 'then';
    }
    return 'else';
};

export default ifStringDefaultExportCondConst;
