export class Classifier {
  classify(value: number): string {
    if (value > 5) {
      return 'big';
    }

    return 'small';
  }
}
