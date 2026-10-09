if (process.env.MODE === 'production') {
  console.log('prod');
} else {
  console.log('dev');
}

const statusCode = Number(process.env.CODE);

switch (statusCode) {
  case 1:
    console.log('one');
    break;
  case 2:
    console.log('two');
    break;
  default:
    console.log('other');
}
