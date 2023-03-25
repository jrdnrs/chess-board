import init, { ChessEngine } from "../chess-engine/chess_engine";
import { Message, Signal } from "./message";
import { Move } from "./move";

init().then(() => {
    const engine = new ChessEngine();

    self.postMessage({ signal: Signal.Ready, error: undefined, payload: undefined });

    self.onmessage = (e) => {
        const msg = e.data as Message;
        switch (msg.signal) {
            case Signal.Reset:
                try {
                    engine.reset();
                    self.postMessage({ signal: Signal.Reset, error: undefined, payload: undefined });
                } catch (e) {
                    self.postMessage({ signal: Signal.Reset, error: e, payload: undefined });
                }
                break;

            case Signal.LoadFEN:
                try {
                    const fen = msg.payload as string;
                    engine.load_fen(fen);
                    self.postMessage({ signal: Signal.LoadFEN, error: undefined, payload: undefined });
                } catch (e) {
                    self.postMessage({ signal: Signal.LoadFEN, error: e, payload: undefined });
                }
                break;

            case Signal.GetLegalMoves:
                try {
                    const movesBytes = engine.get_legal_moves();

                    // @ts-ignore
                    self.postMessage({ signal: Signal.GetLegalMoves, error: undefined, payload: movesBytes }, [
                        movesBytes.buffer,
                    ]);
                } catch (e) {
                    self.postMessage({ signal: Signal.GetLegalMoves, error: e, payload: undefined });
                }
                break;

            case Signal.GetBestMove:
                try {
                    const depth = msg.payload as number;
                    const bestMove = engine.get_best_move(depth);

                    // // test
                    // console.log(bestMove);
                    // const move = Move.fromBytes(bestMove!);
                    // console.log(move);
                    // console.log(move.toBytes());

                    self.postMessage({ signal: Signal.GetBestMove, error: undefined, payload: bestMove });
                } catch (e) {
                    self.postMessage({ signal: Signal.GetBestMove, error: e, payload: undefined });
                }
                break;

            case Signal.GetActiveColor:
                try {
                    const color = engine.get_active_color();
                    self.postMessage({ signal: Signal.GetActiveColor, error: undefined, payload: color });
                } catch (e) {
                    self.postMessage({ signal: Signal.GetActiveColor, error: e, payload: undefined });
                }
                break;

            case Signal.IsInCheck:
                try {
                    const check = engine.is_in_check();
                    self.postMessage({ signal: Signal.IsInCheck, error: undefined, payload: check });
                } catch (e) {
                    self.postMessage({ signal: Signal.IsInCheck, error: e, payload: undefined });
                }
                break;

            case Signal.MakeMove:
                try {
                    const move = msg.payload as number;
                    engine.make_move(move);

                    self.postMessage({ signal: Signal.MakeMove, error: undefined, payload: undefined });
                } catch (e) {
                    self.postMessage({ signal: Signal.MakeMove, error: e, payload: undefined });
                }
                break;
        }
    };
});
