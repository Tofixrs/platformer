import { Game } from "@lib/game";
import "./style.css";

const game = new Game();
//@ts-expect-error
window.game = game;
await game.run();
