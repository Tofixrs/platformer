import i18next from "i18next";
import pl from "./pl.json";
import en from "./en.json";

export async function initI18n() {
	await i18next.init({
		lng: navigator.language,
		resources: {
			en: {
				translation: en,
			},
			pl: {
				translation: pl,
			},
		},
	});
}
