/**
 * PURPOSE: Thrown by the run-time `$arm` marker when a syntax's code reaches an arm. The generator
 * catches it to learn which arm a set of known values reaches. It is a signal, not a failure.
 *
 * USAGE:
 * throw new ArmReachedError({ arm: 'then' });
 * // Throws with the message "the syntax reached its 'then' arm"
 */
export class ArmReachedError extends Error {
  public readonly arm: string;

  public constructor({ arm }: { arm: string }) {
    super(`the syntax reached its '${arm}' arm`);
    this.arm = arm;
    this.name = 'ArmReachedError';
  }
}
