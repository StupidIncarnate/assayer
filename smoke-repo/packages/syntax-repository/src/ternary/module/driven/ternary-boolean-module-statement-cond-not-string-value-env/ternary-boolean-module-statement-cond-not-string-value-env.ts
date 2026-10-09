const value = process.env.VALUE ?? '';

console.log(!value ? 'then' : 'else');

export {};
