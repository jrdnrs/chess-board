import init, { ChessEngine } from "../chess-engine/chess_engine";
import { Message, Signal } from "./message";

init().then(() => {
    const engine = new ChessEngine();

    self.postMessage({ signal: Signal.Ready, error: undefined, payload: undefined });

    self.onmessage = (e) => {
        let payload, transferable;
        const msg = e.data as Message;

        try {
            switch (msg.signal) {
                case Signal.Reset:
                    engine.reset();
                    break;

                case Signal.LoadFEN:
                    engine.load_fen(msg.payload as string);
                    break;

                case Signal.GetLegalMoves:
                    payload = engine.get_legal_moves();
                    transferable = [payload.buffer];
                    break;

                case Signal.GetBestMove:
                    const depth = msg.payload.depth as number;
                    const timeout = msg.payload.timeout as number;
                    payload = engine.get_best_move(depth, timeout);
                    break;

                case Signal.GetActiveColor:
                    payload = engine.get_active_color();
                    break;

                case Signal.IsInCheck:
                    payload = engine.is_in_check();
                    break;

                case Signal.MakeMove:
                    engine.make_move(msg.payload as number);
                    break;
            }
        } catch (e) {
            self.postMessage({ signal: msg.signal, error: e, payload: undefined });
        } finally {
            // @ts-ignore
            self.postMessage({ signal: msg.signal, error: undefined, payload }, transferable);
        }
    };
});
