// @ts-ignore
if (process.env.NODE_ENV !== "production") {
    // @ts-ignore
    const hot = module.hot;
    if (hot) {
        hot.dispose(() => {
            window.location.reload();
            throw "hotReload";
        });
    }
}

import { Game } from "./game";

const game = new Game(document.body);
const debugEl = document.querySelector("#debug")!;

const btn1 = document.createElement("button");
btn1.innerHTML = "start";
debugEl.appendChild(btn1);
btn1.addEventListener(
    "click",
    (e) => {
        const playerOne = Number.parseInt((debugEl.querySelector("#sel1") as HTMLSelectElement).value);
        const playerTwo = Number.parseInt((debugEl.querySelector("#sel2") as HTMLSelectElement).value);
        game.start(playerOne, playerTwo);

        const btn4 = document.createElement("button");
        btn4.innerHTML = "flip";
        debugEl.appendChild(btn4);
        btn4.addEventListener("click", (e) => {
            game.board.flipBoard();
        });

        btn1.remove();
    },
    { once: true }
);
