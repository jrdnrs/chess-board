import { Piece, PieceType } from "./piece";

const PIECE_LETTERS = ["R", "B", "N", "Q", "", "K"];
const PIECE_SYMBOLS = ["♖", "♗", "♘", "♕", "", "♔"];

const CAPTURE = 1;
const PROMOTION = 1 << 1;
const KING_SIDE = 1 << 2;
const QUEEN_SIDE = 2 << 2;
const EN_PASSANT_MOVE = 1 << 4;
const EN_PASSANT_CAP = 2 << 4;
const CAPTURE_MASK = CAPTURE;
const PROMOTION_MASK = PROMOTION;
const CASTLING_MASK = KING_SIDE | QUEEN_SIDE;
const EN_PASSANT_MASK = EN_PASSANT_MOVE | EN_PASSANT_CAP;

export const enum Castle {
    None,
    Kingside,
    Queenside,
}

export const enum Promotion {
    None,
    Rook,
    Bishop,
    Knight,
    Queen,
}

export const enum EnPassant {
    None,
    Move,
    Capture,
}

export class Position {
    rank: number;
    file: number;
    index: number;

    constructor(file: number, rank: number) {
        this.file = file;
        this.rank = rank;
        this.index = rank * 8 + file;
    }

    static fromIndex(index: number): Position {
        return new Position(index % 8, Math.floor(index / 8));
    }
}

export class Move {
    piece: PieceType;
    from: Position;
    to: Position;
    promotion: Promotion;
    castle: Castle;
    capture: boolean;
    enPassant: EnPassant;

    constructor(
        piece: PieceType,
        from: Position,
        to: Position,
        promotion: Promotion,
        castle: Castle,
        capture: boolean,
        enPassant: EnPassant
    ) {
        this.piece = piece;
        this.from = from;
        this.to = to;
        this.promotion = promotion;
        this.castle = castle;
        this.capture = capture;
        this.enPassant = enPassant;
    }

    static fromBytes(bytes: number): Move {
        const flags = bytes >>> 24;

        let piece: PieceType;
        let promotion: Promotion;
        if ((flags & PROMOTION_MASK) > 0) {
            piece = PieceType.Pawn;
            promotion = 1 + (bytes & 0xff);
        } else {
            piece = bytes & 0xff;
            promotion = Promotion.None;
        }

        const from_engine_index = (bytes & 0xff00) >>> 8;
        const from = new Position(7 - (from_engine_index & 7), from_engine_index >>> 3);

        const to_engine_index = (bytes & 0xff0000) >>> 16;
        const to = new Position(7 - (to_engine_index & 7), to_engine_index >>> 3);

        let castle: Castle;
        switch (flags & CASTLING_MASK) {
            case 0:
                castle = Castle.None;
                break;

            case KING_SIDE:
                castle = Castle.Kingside;
                break;

            case QUEEN_SIDE:
                castle = Castle.Queenside;
                break;

            default:
                // should be unreachable
                throw new Error("Invalid castle bits");
        }

        let enPassant: EnPassant;
        switch (flags & EN_PASSANT_MASK) {
            case 0:
                enPassant = EnPassant.None;
                break;

            case EN_PASSANT_MOVE:
                enPassant = EnPassant.Move;
                break;

            case EN_PASSANT_CAP:
                enPassant = EnPassant.Capture;
                break;

            default:
                // should be unreachable
                throw new Error("Invalid en passant bits");
        }

        const capture = (flags & CAPTURE_MASK) > 0;

        return new Move(piece, from, to, promotion, castle, capture, enPassant);
    }

    toBytes(): number {
        let piece: number;
        let promotionBits: number;
        if (this.promotion > 0) {
            piece = this.promotion - 1;
            promotionBits = PROMOTION;
        } else {
            piece = this.piece;
            promotionBits = 0;
        }

        const from = this.from.rank * 8 + (7 - this.from.file);
        const to = this.to.rank * 8 + (7 - this.to.file);

        let castleBits: number;
        switch (this.castle) {
            case Castle.None:
                castleBits = 0;
                break;

            case Castle.Kingside:
                castleBits = KING_SIDE;
                break;

            case Castle.Queenside:
                castleBits = QUEEN_SIDE;
                break;

            default:
                // should be unreachable
                throw new Error("Invalid castle bits");
        }

        let enPassantBits: number;
        switch (this.enPassant) {
            case EnPassant.None:
                enPassantBits = 0;
                break;

            case EnPassant.Move:
                enPassantBits = EN_PASSANT_MOVE;
                break;

            case EnPassant.Capture:
                enPassantBits = EN_PASSANT_CAP;
                break;

            default:
                // should be unreachable
                throw new Error("Invalid en passant bits");
        }

        const captureBits = this.capture ? CAPTURE : 0;

        return ((promotionBits | castleBits | captureBits | enPassantBits) << 24) | (to << 16) | (from << 8) | piece;
    }

    // TODO: incomplete
    private toString(pieceNames: String[]): String {
        if (this.castle === Castle.Kingside) {
            return "O-O-O";
        } else if (this.castle === Castle.Queenside) {
            return "O-O";
        }

        let piece = pieceNames[this.piece];
        let toFile = String.fromCharCode(0x61 + this.to.file);
        let toRank = String.fromCharCode(0x31 + this.to.rank);

        if (this.capture) {
            return piece + "x" + toFile + toRank;
        }

        let fromFile = String.fromCharCode(0x61 + this.from.file);
        let fromRank = String.fromCharCode(0x31 + this.from.rank);

        return piece + fromFile + fromRank + toFile + toRank;
    }

    toAlgebraicString(): String {
        return this.toString(PIECE_LETTERS);
    }

    toFigurineAlgebraicString(): String {
        return this.toString(PIECE_SYMBOLS);
    }
}
