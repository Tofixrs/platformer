import i18next from "i18next";

const div = document.getElementById("screen-orientation");
const text = document.getElementById("orientationText");

function init() {
	const textNode = document.createTextNode(i18next.t("orientation"));
	text?.appendChild(textNode);
	//@ts-expect-error only exists in some browsers
	window.screen.orientation?.lock("landscape");
	window.screen.orientation.addEventListener("change", () => {
		const type = window.screen.orientation.type;
		div?.classList.toggle(
			"visible",
			type == "portrait-primary" || type == "portrait-secondary",
		);
	});
}

export default { init };
