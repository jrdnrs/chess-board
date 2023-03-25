const PIECE_NAMES = [
    ["white-rook", "white-bishop", "white-knight", "white-queen", "white-pawn", "white-king"],
    ["black-rook", "black-bishop", "black-knight", "black-queen", "black-pawn", "black-king"],
];

export const enum Color {
    White,
    Black,
}

export const enum PieceType {
    Rook,
    Bishop,
    Knight,
    Queen,
    Pawn,
    King,
}

export class Piece {
    type: PieceType;
    color: Color;
    element: HTMLDivElement;

    constructor(type: PieceType, color: Color) {
        this.type = type;
        this.color = color;
        this.element = Piece.createElement(type, color);
    }

    private static createElement(type: PieceType, color: Color): HTMLDivElement {
        const el = document.createElement("div");
        el.classList.add("piece");
        el.classList.add(PIECE_NAMES[color][type]);
        return el;
    }
}
