export const enum Signal {
    Ready,
    Reset,
    LoadFEN,
    GetLegalMoves,
    GetBestMove,
    GetActiveColor,
    IsInCheck,
    MakeMove,
}

export type Message = {
    signal: Signal;
    error: Error | undefined;
    payload: any;
};
