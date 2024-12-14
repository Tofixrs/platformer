import i18next from "i18next";

const div = document.getElementById("screen-orientation");
const text = document.getElementById("orientationText");
const fullscreen = document.getElementById("fullscreen");
const body = document.querySelector("body");

function init() {
	const textNode = document.createTextNode(i18next.t("orientation"));
	text?.appendChild(textNode);
	div?.classList.toggle(
		"visible",
		window.screen.orientation.type.startsWith("portrait"),
	);
	window.addEventListener("orientationchange", () => {
		div?.classList.toggle(
			"visible",
			window.screen.orientation.type.startsWith("portrait"),
		);
	});
	fullscreen?.addEventListener("click", () => {
		body?.requestFullscreen();
		//@ts-expect-error
		window.screen.orientation?.lock("landscape");
	});
}

export default { init };
