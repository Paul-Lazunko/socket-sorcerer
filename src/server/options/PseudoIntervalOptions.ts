export interface PseudoIntervalOptions {
  handler: (...args: any[]) => void,
  isActive: boolean,
  forceExit: boolean,
  interval: number
}
