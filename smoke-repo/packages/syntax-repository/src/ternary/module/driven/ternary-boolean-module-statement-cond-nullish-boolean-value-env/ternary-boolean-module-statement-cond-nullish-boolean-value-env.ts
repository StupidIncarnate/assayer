const value = process.env.VALUE === undefined ? undefined : process.env.VALUE === 'true';

console.log(value ?? false ? 'then' : 'else');

export {};
