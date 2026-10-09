const value = process.env.VALUE === undefined ? undefined : process.env.VALUE ?? '';

console.log(value ?? '' ? 'then' : 'else');

export {};
