const value = process.env.VALUE === undefined ? undefined : Number(process.env.VALUE);

console.log(value ?? 0 ? 'then' : 'else');

export {};
