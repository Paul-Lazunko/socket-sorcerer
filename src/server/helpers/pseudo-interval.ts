import { PseudoIntervalOptions } from '@server-options';

export function pseudoInterval(options: PseudoIntervalOptions) {
  const { handler, isActive, forceExit, interval } = options;
  setTimeout( () => {
    if ( isActive ) {
      handler()
      if (!forceExit) {
        pseudoInterval(options)
      }
    }
  }, interval);
}
