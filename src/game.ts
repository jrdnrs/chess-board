import { Board } from "./board";
import { Signal, Message } from "./message";
import { Move, Position, Promotion } from "./move";
import { Color, PieceType } from "./piece";

const STARTING_FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

export class Game {
    element: HTMLElement;
    board: Board;
    engine: Worker;
    // white: Player;
    // black: Player;
    dragging: boolean;

    constructor(container: HTMLElement) {
        this.element = Game.createElement();
        this.board = new Board(this.element);
        this.engine = new Worker(new URL("engine.ts", import.meta.url), { type: "module" });
        this.dragging = false;

        this.board.element.addEventListener("contextmenu", (ev) => {
            ev.preventDefault();
        });

        // wait until engine is ready
        this.engine.addEventListener(
            "message",
            (e) => {
                const msg = e.data as Message;
                if (msg.signal === Signal.Ready) {
                    this.init();
                    container.appendChild(this.element);
                }
            },
            { once: true }
        );
    }

    private static createElement(): HTMLElement {
        const el = document.createElement("main");
        el.id = "game";
        return el;
    }

    init() {
        this.loadFEN(STARTING_FEN);

        this.getLegalMoves().then((moves) => {
            this.board.updateLegalMoves(moves);
        });

        this.board.element.addEventListener("mousedown", (ev) => {
            if (ev.button !== 0) return;
            if (this.dragging) return;
            const square = this.board.getSquareAtPoint(ev.clientX, ev.clientY);
            if (square === undefined) return;
            if (this.board.pieces[square.index] === undefined) return;

            const moveController = this.board.pickUpPiece(square, ev.clientX, ev.clientY);
            this.dragging = true;

            document.addEventListener(
                "mouseup",
                async (ev) => {
                    moveController.abort();
                    this.dragging = false;
                    const move = this.board.dropPiece(square, ev.clientX, ev.clientY);
                    if (move === undefined) return;

                    // show promotion selection
                    if (move.promotion !== Promotion.None) {
                        this.board.overlay.showPromotionSelection(move.to);
                        return
                    }

                    this.board.movePiece(move);
                    await this.makeMove(move);
                    this.board.updateLegalMoves(await this.getLegalMoves());
                    if (await this.isInCheck()) {
                        for (let i = 0; i < 64; i++) {
                            if (
                                this.board.pieces[i]?.type === PieceType.King &&
                                this.board.pieces[i]?.color === this.board.activeColor
                            ) {
                                this.board.overlay.highlightCheck(Position.fromIndex(i));
                                break;
                            }
                        }
                    }
                },
                { once: true }
            );
        });
    }

    loadFEN(fen: string) {
        this.board.loadFEN(fen);
        this.contactEngine(Signal.LoadFEN, fen);
    }

    async getPlayerMove() {
        
    }

    private async contactEngine(signal: Signal, payload: any = undefined): Promise<any> {
        const msg: Message = {
            signal,
            error: undefined,
            payload,
        };
        this.engine.postMessage(msg);

        const controller = new AbortController();
        return new Promise((resolve, reject) => {
            this.engine.addEventListener(
                "message",
                (e) => {
                    const msg = e.data as Message;
                    if (msg.signal === signal) {
                        if (msg.error !== undefined) {
                            reject(msg.error);
                        } else {
                            resolve(msg.payload);
                        }
                        controller.abort();
                    }
                },
                { signal: controller.signal }
            );
        });
    }

    async getLegalMoves(): Promise<Move[]> {
        const movesBytes = (await this.contactEngine(Signal.GetLegalMoves)) as Uint32Array;
        const moves = [];
        for (const move of movesBytes) {
            moves.push(Move.fromBytes(move));
        }
        return moves;
    }

    async getBestMove(): Promise<Move | undefined> {
        const moveBytes = (await this.contactEngine(Signal.GetBestMove, 5)) as number | undefined;
        if (moveBytes === undefined) {
            return undefined;
        }
        return Move.fromBytes(moveBytes);
    }

    async getActiveColor(): Promise<Color> {
        return this.contactEngine(Signal.GetActiveColor) as Promise<Color>;
    }

    async isInCheck(): Promise<boolean> {
        return this.contactEngine(Signal.IsInCheck) as Promise<boolean>;
    }

    async makeMove(move: Move) {
        const moveBytes = move.toBytes();
        (await this.contactEngine(Signal.MakeMove, moveBytes)) as Promise<boolean>;
    }
}
