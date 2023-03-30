/* tslint:disable */
/* eslint-disable */
/**
*/
export function generation_test(): void;
/**
*/
export class ChessEngine {
  free(): void;
/**
*/
  constructor();
/**
*/
  reset(): void;
/**
* @param {string} fen
*/
  load_fen(fen: string): void;
/**
* @returns {number}
*/
  get_active_color(): number;
/**
* @returns {boolean}
*/
  is_in_check(): boolean;
/**
* @returns {Uint32Array}
*/
  get_legal_moves(): Uint32Array;
/**
* @param {number} depth
* @returns {number | undefined}
*/
  get_best_move(depth: number): number | undefined;
/**
* @param {number} legal_move
*/
  make_move(legal_move: number): void;
}

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
  readonly memory: WebAssembly.Memory;
  readonly __wbg_chessengine_free: (a: number) => void;
  readonly chessengine_new: () => number;
  readonly chessengine_reset: (a: number) => void;
  readonly chessengine_load_fen: (a: number, b: number, c: number, d: number) => void;
  readonly chessengine_get_active_color: (a: number) => number;
  readonly chessengine_is_in_check: (a: number) => number;
  readonly chessengine_get_legal_moves: (a: number, b: number) => void;
  readonly chessengine_get_best_move: (a: number, b: number, c: number) => void;
  readonly chessengine_make_move: (a: number, b: number) => void;
  readonly generation_test: () => void;
  readonly __wbindgen_add_to_stack_pointer: (a: number) => number;
  readonly __wbindgen_malloc: (a: number) => number;
  readonly __wbindgen_realloc: (a: number, b: number, c: number) => number;
  readonly __wbindgen_free: (a: number, b: number) => void;
}

export type SyncInitInput = BufferSource | WebAssembly.Module;
/**
* Instantiates the given `module`, which can either be bytes or
* a precompiled `WebAssembly.Module`.
*
* @param {SyncInitInput} module
*
* @returns {InitOutput}
*/
export function initSync(module: SyncInitInput): InitOutput;

/**
* If `module_or_path` is {RequestInfo} or {URL}, makes a request and
* for everything else, calls `WebAssembly.instantiate` directly.
*
* @param {InitInput | Promise<InitInput>} module_or_path
*
* @returns {Promise<InitOutput>}
*/
export default function init (module_or_path?: InitInput | Promise<InitInput>): Promise<InitOutput>;
