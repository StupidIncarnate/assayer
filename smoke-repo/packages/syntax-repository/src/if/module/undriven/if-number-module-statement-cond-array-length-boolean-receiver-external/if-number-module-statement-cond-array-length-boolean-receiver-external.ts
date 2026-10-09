if (process.argv.slice(2).map(arg => arg === 'yes').length) {
    console.log('then');
}

console.log('else');

export {};
