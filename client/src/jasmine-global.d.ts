declare namespace jasmine {
  interface Matchers<T> {
    toBe(expected: any): boolean;
    toEqual(expected: any): boolean;
    toMatch(expected: string | RegExp): boolean;
    toBeDefined(): boolean;
    toBeUndefined(): boolean;
    toBeNull(): boolean;
    toBeNaN(): boolean;
    toBeTruthy(): boolean;
    toBeFalsy(): boolean;
    toContain(expected: any): boolean;
    toBeLessThan(expected: number): boolean;
    toBeGreaterThan(expected: number): boolean;
    toBeCloseTo(expected: number, precision?: number): boolean;
    toThrow(expected?: any): boolean;
    toThrowError(expected?: any): boolean;
    toHaveBeenCalled(): boolean;
    toHaveBeenCalledTimes(expected: number): boolean;
    toHaveBeenCalledWith(...params: any[]): boolean;
  }

  interface Spy {
    and: SpyAnd;
    calls: Calls;
  }

  interface SpyAnd {
    returnValue(val: any): Spy;
    returnValues(...values: any[]): Spy;
    callFake(fn: Function): Spy;
    callThrough(): Spy;
    throwError(msg: string | Error): Spy;
  }

  interface Calls {
    count(): number;
    any(): boolean;
    argsFor(index: number): any[];
    allArgs(): any[][];
    all(): CallInfo[];
    mostRecent(): CallInfo;
    first(): CallInfo;
    reset(): void;
  }

  interface CallInfo {
    object: any;
    args: any[];
    returnValue: any;
  }

  function createSpyObj<T>(baseName: string, methodNames: Array<keyof T>): jasmine.SpyObj<T>;
  function createSpyObj(baseName: string, methodNames: string[]): any;

  interface SpyObj<T> {
    [key: string]: jasmine.Spy;
  }
}

declare function describe(description: string, specDefinitions: () => void): void;
declare function fdescribe(description: string, specDefinitions: () => void): void;
declare function xdescribe(description: string, specDefinitions: () => void): void;

declare function it(expectation: string, assertion?: (done: DoneFn) => void): void;
declare function fit(expectation: string, assertion?: (done: DoneFn) => void): void;
declare function xit(expectation: string, assertion?: (done: DoneFn) => void): void;

declare function beforeEach(action: (done: DoneFn) => void): void;
declare function afterEach(action: (done: DoneFn) => void): void;
declare function beforeAll(action: (done: DoneFn) => void): void;
declare function afterAll(action: (done: DoneFn) => void): void;

declare function expect<T>(actual: T): jasmine.Matchers<T>;

declare function spyOn<T>(object: T, method: keyof T): jasmine.Spy;

interface DoneFn {
  (): void;
  fail(message?: string): void;
}

declare global {
  const jasmine: any;
  function describe(description: string, specDefinitions: () => void): void;
  function it(expectation: string, assertion?: (done: DoneFn) => void): void;
  function expect<T>(actual: T): jasmine.Matchers<T>;
  function spyOn<T>(object: T, method: keyof T): jasmine.Spy;
}
