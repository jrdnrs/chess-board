import { Castle, EnPassant, Move, Position, Promotion } from "./move";
import { Overlay } from "./overlay";
import { Piece, PieceType, Color } from "./piece";

const MOVE_SOUND = new URL("../assets/move.mp3", import.meta.url).toString();
const CAPTURE_SOUND = new URL("../assets/capture.mp3", import.meta.url).toString();
const CHECK_SOUND = new URL("../assets/check.mp3", import.meta.url).toString();
const CASTLE_SOUND = new URL("../assets/castle.mp3", import.meta.url).toString();
const PROMOTE_SOUND = new URL("../assets/promote.mp3", import.meta.url).toString();

const FEN_PIECES = new Map<String, { type: PieceType; color: Color }>([
    ["p", { type: PieceType.Pawn, color: Color.Black }],
    ["n", { type: PieceType.Knight, color: Color.Black }],
    ["b", { type: PieceType.Bishop, color: Color.Black }],
    ["r", { type: PieceType.Rook, color: Color.Black }],
    ["q", { type: PieceType.Queen, color: Color.Black }],
    ["k", { type: PieceType.King, color: Color.Black }],
    ["P", { type: PieceType.Pawn, color: Color.White }],
    ["N", { type: PieceType.Knight, color: Color.White }],
    ["B", { type: PieceType.Bishop, color: Color.White }],
    ["R", { type: PieceType.Rook, color: Color.White }],
    ["Q", { type: PieceType.Queen, color: Color.White }],
    ["K", { type: PieceType.King, color: Color.White }],
]);

const enum Sound {
    Move,
    Capture,
    Check,
    Castle,
    Promote,
}

export class Board {
    element: HTMLDivElement;
    lightSquares: SVGPathElement;
    darkSquares: SVGCircleElement;
    overlay: Overlay;
    size: number;
    squareSize: number;
    pieces: (Piece | undefined)[];
    legalMoves: Move[][];
    sounds: HTMLAudioElement[];
    flipped: boolean;
    activeColor: Color;

    constructor(container: HTMLElement) {
        this.size = 600;
        this.squareSize = this.size / 8;
        this.pieces = new Array(64).fill(undefined);
        this.legalMoves = Array.from(new Array(64), () => []);
        this.sounds = [
            new Audio(MOVE_SOUND),
            new Audio(CAPTURE_SOUND),
            new Audio(CHECK_SOUND),
            new Audio(CASTLE_SOUND),
            new Audio(PROMOTE_SOUND),
        ];
        [this.element, this.lightSquares, this.darkSquares] = Board.createElement();
        this.resize(this.size);
        this.overlay = new Overlay(this.element);
        this.flipped = false;
        this.activeColor = Color.White;

        container.appendChild(this.element);
    }

    private static createElement(): [HTMLDivElement, SVGPathElement, SVGCircleElement] {
        const squares = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        squares.setAttribute("shape-rendering", "crispEdges");
        squares.setAttribute("viewBox", "1 0.5 8 8");

        const darkSquares = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        darkSquares.setAttribute("r", "15");
        darkSquares.setAttribute("fill", "#b58863");
        squares.appendChild(darkSquares);

        const lightSquares = document.createElementNS("http://www.w3.org/2000/svg", "path");
        lightSquares.setAttribute("d", "M1,1h7M2,2h7M1,3h7M2,4h7M1,5h7M2,6h7M1,7h7M2,8h7");
        lightSquares.setAttribute("stroke", "#f0d9b5");
        lightSquares.setAttribute("stroke-dasharray", "1");
        squares.appendChild(lightSquares);

        const board = document.createElement("div");
        board.id = "chess-board";
        board.appendChild(squares);

        return [board, lightSquares, darkSquares];
    }

    playSound(sound: Sound) {
        this.sounds[sound].play();
    }

    loadFEN(fen: string) {
        const parts = fen.split(" ");
        const piecePlacement = parts[0];

        let rank = 7;
        let file = 0;
        for (const char of piecePlacement) {
            if (char == "/") {
                rank -= 1;
                file = 0;
                continue;
            }

            const digit = parseInt(char);
            if (!isNaN(digit)) {
                file += digit;
                continue;
            }

            const piece = FEN_PIECES.get(char);
            if (piece === undefined) {
                throw new Error(`Malformed FEN. '${char}' is invalid piece notation`);
            }

            this.addPiece(new Piece(piece.type, piece.color), new Position(file, rank));

            file += 1;
        }

        // active color

        // castling

        // en passant square
    }

    updatePiecePlacement() {
        for (let i = 0; i < 64; i++) {
            const piece = this.pieces[i];
            if (piece !== undefined) {
                this.placePiece(piece, new Position(i % 8, Math.floor(i / 8)));
            }
        }
    }

    resize(size: number) {
        this.size = size;
        this.element.style.width = `${this.size}px`;
        this.element.style.height = `${this.size}px`;

        this.squareSize = size / 8;
        this.updatePiecePlacement();
    }

    flipBoard() {
        this.flipped = !this.flipped;
        this.element.classList.toggle("flipped");
        this.updatePiecePlacement();
    }

    showOrientation(color: Color) {
        switch (color) {
            case Color.White:
                if (this.flipped) this.flipBoard();
                break;

            case Color.Black:
                if (!this.flipped) this.flipBoard();
                break;
        }
    }

    setLightSquareColor(color: string) {
        this.lightSquares.setAttribute("stroke", color);
    }

    setDarkSquareColor(color: string) {
        this.darkSquares.setAttribute("fill", color);
    }

    // isPointInSquare(x: number, y: number, square: Position): boolean {
    //     const boardRect = this.element.getBoundingClientRect();

    //     // top-left
    //     const SquareXMin = boardRect.left + square.file * this.squareSize;
    //     const SquareYMin = boardRect.top + (7 - square.rank) * this.squareSize;
    //     // bottom-right
    //     const SquareXMax = SquareXMin + this.squareSize;
    //     const SquareYMax = SquareYMin + this.squareSize;

    //     return x >= SquareXMin && x <= SquareXMax && y >= SquareYMin && y <= SquareYMax;
    // }

    getSquareAtPoint(x: number, y: number): Position | undefined {
        const boardRect = this.element.getBoundingClientRect();
        if (x < boardRect.left || x > boardRect.right || y < boardRect.top || y > boardRect.bottom) {
            return undefined;
        }

        let file, rank;
        if (this.flipped) {
            file = 7 - Math.floor((x - boardRect.left) / this.squareSize);
            rank = Math.floor((y - boardRect.top) / this.squareSize);
        } else {
            file = Math.floor((x - boardRect.left) / this.squareSize);
            rank = 7 - Math.floor((y - boardRect.top) / this.squareSize);
        }

        return new Position(file, rank);
    }

    updateLegalMoves(moves: Move[]) {
        for (let i = 0; i < 64; i++) {
            this.legalMoves[i].length = 0;
        }

        for (const move of moves) {
            this.legalMoves[move.from.index].push(move);
        }
    }

    // TODO: y is flipped, because pieces start at bottom-left (consider changing?)
    getSquareCoordinates(square: Position): [number, number] {
        let x, y;
        if (this.flipped) {
            x = (7 - square.file) * this.squareSize;
            y = -(7 - square.rank) * this.squareSize;
        } else {
            x = square.file * this.squareSize;
            y = -square.rank * this.squareSize;
        }
        return [x, y];
    }

    placePiece(piece: Piece, square: Position) {
        let [x, y] = this.getSquareCoordinates(square);
        piece.element.style.transform = `translate(${x}px, ${y}px)`;
    }

    getPiece(square: Position): Piece {
        const piece = this.pieces[square.index];
        if (piece === undefined) {
            throw new Error(`Attempted to get a non-existent piece on '${square}'`);
        }
        return piece;
    }

    addPiece(piece: Piece, square: Position) {
        if (this.pieces[square.index] !== undefined) {
            throw new Error(`Attempted to add piece to an occupied square '${square}'`);
        }

        this.pieces[square.index] = piece;
        this.element.appendChild(piece.element);
        this.placePiece(piece, square);
    }

    removePiece(square: Position) {
        const piece = this.getPiece(square);
        piece.element.remove();
        this.pieces[square.index] = undefined;
    }

    movePiece(move: Move) {
        const piece = this.getPiece(move.from);
        let sound = Sound.Move;

        if (move.capture) {
            const captured = this.getPiece(move.to);
            if (captured.color === piece.color) {
                throw new Error(`Attempted to capture piece of same color '${move.to}'`);
            }

            this.removePiece(move.to);
            sound = Sound.Capture;
        }

        if (move.enPassant === EnPassant.Capture) {
            const offset = this.activeColor === Color.White ? -1 : 1;
            const pawn_square = new Position(move.to.file, move.to.rank + offset);
            this.removePiece(pawn_square);
            sound = Sound.Capture;
        }

        if (move.castle !== Castle.None) {
            const rank = this.activeColor === Color.White ? 0 : 7;
            let from_file: number;
            let to_file: number;

            switch (move.castle) {
                case Castle.Kingside:
                    from_file = 7;
                    to_file = 5;
                    break;

                case Castle.Queenside:
                    from_file = 0;
                    to_file = 3;
                    break;
            }

            const from = new Position(from_file, rank);
            const to = new Position(to_file, rank);
            const rook = this.getPiece(from);
            this.removePiece(from);
            this.addPiece(rook, to);
            sound = Sound.Castle;
        }

        this.removePiece(move.from);

        if (move.promotion !== Promotion.None) {
            const newPiece = new Piece(move.promotion + 1, piece.color);
            this.addPiece(newPiece, move.to);
            sound = Sound.Promote;
        } else {
            this.addPiece(piece, move.to);
        }

        this.playSound(sound);

        this.activeColor = 1 - this.activeColor;

        this.overlay.clearAllHighlights();
        this.overlay.highlightPreviousMove(move.from, move.to);
    }

    // TODO: consider storing this controller in the class, so that we only allow one piece to be
    // picked up at a time. Also, apply this check in drop
    pickUpPiece(square: Position, x: number, y: number): AbortController {
        this.overlay.highlightLegalMoves(square, this.legalMoves[square.index]);

        const piece = this.getPiece(square);
        piece.element.classList.add("dragging");

        // the existing transform for placing the piece on starting square
        const [startX, startY] = this.getSquareCoordinates(square);

        // offset to be applied to mouse pos, to get coords relative to element
        const rect = piece.element.getBoundingClientRect();
        const offsetX = rect.left + rect.width * 0.5;
        const offsetY = rect.top + rect.height * 0.5;

        // apply once here to change pos on initial click
        piece.element.style.transform = `translate(${startX + x - offsetX}px, ${startY + y - offsetY}px)`;

        const controller = new AbortController();

        document.addEventListener(
            "mousemove",
            (ev: MouseEvent) => {
                piece.element.style.transform = `translate(${startX + ev.clientX - offsetX}px, ${
                    startY + ev.clientY - offsetY
                }px)`;
            },
            { signal: controller.signal }
        );

        return controller;
    }

    dropPiece(square: Position, x: number, y: number): Move | undefined {
        const piece = this.getPiece(square);
        piece.element.classList.remove("dragging");

        this.overlay.clearLegalMoveHighlights();

        const droppedSquare = this.getSquareAtPoint(x, y);
        let move: Move | undefined = undefined;

        if (droppedSquare !== undefined) {
            for (const legalMove of this.legalMoves[square.index]) {
                if (legalMove.to.index == droppedSquare.index) {
                    move = legalMove;
                    break;
                }
            }
        }

        // TODO: promotion thing

        if (move === undefined) {
            this.placePiece(piece, square);
        } else {
            // this.movePiece(move);
        }

        return move;
    }
}
