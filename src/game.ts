import { Board } from "./board";
import { Signal, Message } from "./message";
import { Move, Position, Promotion } from "./move";
import { Color, PieceType } from "./piece";

const STARTING_FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

const enum Player {
    Engine,
    Human,
}

export class Game {
    element: HTMLElement;
    board: Board;
    engine: Worker;
    legalMoves: Move[][];
    interacting: boolean;
    players: Player[];

    constructor(container: HTMLElement) {
        this.element = Game.createElement();
        this.board = new Board(this.element);
        this.engine = new Worker(new URL("engine.ts", import.meta.url), { type: "module" });
        this.legalMoves = Array.from(new Array(64), () => []);
        this.interacting = false;
        this.players = [];

        this.board.element.addEventListener("contextmenu", (ev) => {
            ev.preventDefault();
        });

        // wait until engine is ready
        this.engine.addEventListener(
            "message",
            (e) => {
                const msg = e.data as Message;
                if (msg.signal === Signal.Ready) {
                    this.board.element.addEventListener("mousedown", (ev) => this.handlePlayerInteraction(ev), {
                        passive: true,
                    });
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

    // async reset() {
    //     this.board.reset();
    //     this.interacting = false;
    //     for (let i = 0; i < 64; i++) {
    //         this.legalMoves[i].length = 0;
    //     }

    //     await this.contactEngine(Signal.Reset);
    //     this.start();
    // }

    async start(playerOne: Player, playerTwo: Player) {
        if (Math.random() < 0.5) {
            this.players = [playerOne, playerTwo];
            this.board.showOrientation(Color.White);
        } else {
            this.players = [playerTwo, playerOne];
            this.board.showOrientation(Color.Black);
        }

        await this.loadFEN(STARTING_FEN);
        await this.updateLegalMoves();

        if (this.players[this.board.activeColor] === Player.Engine) {
            await this.handleEngineInteraction();
        }
    }

    async loadFEN(fen: string) {
        this.board.loadFEN(fen);
        await this.contactEngine(Signal.LoadFEN, fen);
    }

    async handleEngineInteraction() {
        this.interacting = true;

        const start = Date.now();
        const move = await this.getEngineMove();
        const elapsed = Date.now() - start;

        const delay = 500 + Math.random() * 1000;
        if (elapsed < delay) {
            await new Promise((resolve) => {
                setTimeout(resolve, delay - elapsed);
            });
        }

        if (move === undefined) {
            this.interacting = false;
            return;
        }
        await this.makeMove(move);
        this.interacting = false;
    }

    async getEngineMove(): Promise<Move | undefined> {
        // TODO: soon will use time-based cutoff instead of specific depth...
        return this.getBestMove(4);
    }

    async handlePlayerInteraction(ev: MouseEvent) {
        if (ev.button !== 0 || this.interacting) return;

        const move = await this.getPlayerMove(ev.clientX, ev.clientY);
        if (move === undefined) return;

        // TODO: consider using this event listener to handle promotion selection too,
        //       would require caching the promotion type move until subsequent click
        if (move.promotion !== Promotion.None) {
            move.promotion = await this.getPlayerPromotionSelection(move.to);
        }

        await this.makeMove(move);
    }

    async getPlayerMove(x: number, y: number): Promise<Move | undefined> {
        const square = this.board.getSquareAtPoint(x, y);
        if (
            square === undefined ||
            !this.board.hasPiece(square) ||
            this.board.getPiece(square).color !== this.board.activeColor
        )
            return;

        this.interacting = true;
        this.board.pickUpPiece(square, x, y);
        this.board.overlay.highlightLegalMoves(square, this.legalMoves[square.index]);

        return new Promise((resolve) => {
            document.addEventListener(
                "mouseup",
                (ev) => {
                    const droppedSquare = this.board.dropPiece(ev.clientX, ev.clientY);
                    let move: Move | undefined = undefined;

                    if (droppedSquare !== undefined) {
                        move = this.legalMoves[square.index].find((lm) => lm.to.index === droppedSquare.index);
                    }

                    if (move === undefined) {
                        // move is invalid so reset piece position
                        this.board.placePiece(this.board.getPiece(square), square);
                    }

                    this.interacting = false;
                    resolve(move);
                },
                { passive: true, once: true }
            );
        });
    }

    async getPlayerPromotionSelection(square: Position): Promise<Promotion> {
        const selectSquares = this.board.overlay.showPromotionSelection(square);
        this.interacting = true;

        const controller = new AbortController();
        return new Promise((resolve) => {
            this.board.element.addEventListener(
                "mousedown",
                (ev) => {
                    const selectedSquare = this.board.getSquareAtPoint(ev.clientX, ev.clientY);
                    if (selectedSquare === undefined) return;

                    const selectedIndex = selectSquares.findIndex(
                        (squareIndex) => squareIndex === selectedSquare.index
                    );
                    if (selectedIndex === -1) return;

                    // promotion selection shown is in different order to enum, so indices don't match :(
                    let promotion: Promotion;
                    switch (selectedIndex) {
                        case 0:
                            promotion = Promotion.Queen;
                            break;
                        case 1:
                            promotion = Promotion.Knight;
                            break;
                        case 2:
                            promotion = Promotion.Rook;
                            break;
                        case 3:
                            promotion = Promotion.Bishop;
                            break;

                        default:
                            // unreachable
                            throw new Error("Invalid promotion selection index");
                    }

                    this.interacting = false;
                    this.board.overlay.hidePromotionSelection(square);
                    controller.abort();
                    resolve(promotion);
                },
                { passive: true, signal: controller.signal }
            );
        });
    }

    async updateLegalMoves(): Promise<boolean> {
        const moves = await this.getLegalMoves();

        for (let i = 0; i < 64; i++) {
            this.legalMoves[i].length = 0;
        }

        for (const move of moves) {
            this.legalMoves[move.from.index].push(move);
        }

        return moves.length != 0;
    }

    private async contactEngine(signal: Signal, payload?: any): Promise<any> {
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
                (ev) => {
                    const msg = ev.data as Message;
                    if (msg.signal === signal) {
                        if (msg.error !== undefined) {
                            reject(msg.error);
                        } else {
                            resolve(msg.payload);
                        }
                        controller.abort();
                    }
                },
                { passive: true, signal: controller.signal }
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

    async getBestMove(depth: number): Promise<Move | undefined> {
        const moveBytes = (await this.contactEngine(Signal.GetBestMove, depth)) as number | undefined;
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
        await this.contactEngine(Signal.MakeMove, moveBytes);
        this.board.makeMove(move);

        const movesExist = await this.updateLegalMoves();
        const inCheck = await this.isInCheck();

        if (inCheck) {
            const kingIndex = this.board.pieces.findIndex(
                (piece) => piece?.type === PieceType.King && piece?.color === this.board.activeColor
            );
            this.board.overlay.highlightCheck(Position.fromIndex(kingIndex));
        }

        if (!movesExist) {
            const el = document.createElement("h1");
            if (inCheck) {
                el.innerHTML = "Checkmate";
            } else {
                el.innerHTML = "Draw";
            }
            this.element.appendChild(el);

            return;
        }


        if (this.players[this.board.activeColor] === Player.Engine) {
            await this.handleEngineInteraction();
        }
    }
}
