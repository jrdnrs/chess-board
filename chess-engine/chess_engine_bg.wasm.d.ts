/* tslint:disable */
/* eslint-disable */
export const memory: WebAssembly.Memory;
export function __wbg_chessengine_free(a: number): void;
export function chessengine_new(): number;
export function chessengine_reset(a: number): void;
export function chessengine_load_fen(a: number, b: number, c: number, d: number): void;
export function chessengine_get_active_color(a: number): number;
export function chessengine_is_in_check(a: number): number;
export function chessengine_get_legal_moves(a: number, b: number): void;
export function chessengine_get_best_move(a: number, b: number, c: number): void;
export function chessengine_make_move(a: number, b: number): void;
export function generation_test(): void;
export function __wbindgen_add_to_stack_pointer(a: number): number;
export function __wbindgen_malloc(a: number): number;
export function __wbindgen_realloc(a: number, b: number, c: number): number;
export function __wbindgen_free(a: number, b: number): void;
