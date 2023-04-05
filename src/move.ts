import { Piece, PieceType } from "./piece";

const PIECE_LETTERS = ["R", "B", "N", "Q", "", "K"];
const PIECE_SYMBOLS = ["♖", "♗", "♘", "♕", "", "♔"];

const CAP_PIECE_SHIFT = 4;
const PROMO_PIECE_SHIFT = 8;
const FROM_SHIFT = 12;
const TO_SHIFT = 18;
const EN_PASSANT_SHIFT = 24;
const CASTLING_SHIFT = 26;
const CAPTURE_SHIFT = 28;
const PROMOTION_SHIFT = 29;

const EN_PASSANT_MOVE = 1 << EN_PASSANT_SHIFT;
const EN_PASSANT_CAP = 2 << EN_PASSANT_SHIFT;
const KING_SIDE = 1 << CASTLING_SHIFT;
const QUEEN_SIDE = 2 << CASTLING_SHIFT;
const CAPTURE = 1 << CAPTURE_SHIFT;
const PROMOTION = 1 << PROMOTION_SHIFT;

const PIECE_MASK = 0xf;
const CAP_PIECE_MASK = 0xf << CAP_PIECE_SHIFT;
const PROMO_PIECE_MASK = 0xf << PROMO_PIECE_SHIFT;
const FROM_MASK = 0x3f << FROM_SHIFT;
const TO_MASK = 0x3f << TO_SHIFT;
const EN_PASSANT_MASK = EN_PASSANT_MOVE | EN_PASSANT_CAP;
const CASTLING_MASK = KING_SIDE | QUEEN_SIDE;
const CAPTURE_MASK = CAPTURE;
const PROMOTION_MASK = PROMOTION;

export const enum Castle {
    None,
    Kingside,
    Queenside,
}

export const enum Promotion {
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
    capturedPiece: PieceType | undefined;
    promotionPiece: Promotion | undefined;
    from: Position;
    to: Position;
    enPassant: EnPassant;
    castle: Castle;

    constructor(
        piece: PieceType,
        capturedPiece: PieceType | undefined,
        promotionPiece: Promotion | undefined,
        from: Position,
        to: Position,
        enPassant: EnPassant,
        castle: Castle
    ) {
        this.piece = piece;
        this.capturedPiece = capturedPiece;
        this.promotionPiece = promotionPiece;
        this.from = from;
        this.to = to;
        this.enPassant = enPassant;
        this.castle = castle;
    }

    static fromBytes(bytes: number): Move {
        const piece = (bytes & PIECE_MASK) as PieceType;

        const isPromotion = (bytes & PROMOTION_MASK) !== 0;
        const isCapture = (bytes & CAPTURE_MASK) !== 0;

        let promotionPiece = undefined;
        let capturePiece = undefined;
        if (isPromotion) {
            promotionPiece = (bytes & PROMO_PIECE_MASK) >>> PROMO_PIECE_SHIFT;
        }
        if (isCapture) {
            capturePiece = (bytes & CAP_PIECE_MASK) >>> CAP_PIECE_SHIFT;
        }

        const from_engine_index = (bytes & FROM_MASK) >>> FROM_SHIFT;
        const from = new Position(7 - (from_engine_index & 7), from_engine_index >>> 3);

        const to_engine_index = (bytes & TO_MASK) >>> TO_SHIFT;
        const to = new Position(7 - (to_engine_index & 7), to_engine_index >>> 3);

        let castle: Castle;
        switch (bytes & CASTLING_MASK) {
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
        switch (bytes & EN_PASSANT_MASK) {
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

        return new Move(piece, capturePiece, promotionPiece, from, to, enPassant, castle);
    }

    toBytes(): number {
        const piece = this.piece;

        let capturedPiece = 0;
        let captureFlag = 0;
        if (this.capturedPiece !== undefined) {
            capturedPiece = this.capturedPiece << CAP_PIECE_SHIFT;
            captureFlag = CAPTURE;
        }

        let promotionPiece = 0;
        let promotionFlag = 0;
        if (this.promotionPiece !== undefined) {
            promotionPiece = this.promotionPiece << PROMO_PIECE_SHIFT;
            promotionFlag = PROMOTION;
        }

        const from = (this.from.rank * 8 + (7 - this.from.file)) << FROM_SHIFT;
        const to = (this.to.rank * 8 + (7 - this.to.file)) << TO_SHIFT;

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

        return (
            piece |
            capturedPiece |
            promotionPiece |
            from |
            to |
            enPassantBits |
            castleBits |
            captureFlag |
            promotionFlag
        );
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

        if (this.capturedPiece !== undefined) {
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
