export enum AffiliatorName {
    LexoraCA_EN = "LexoraCA_EN",
    LexoraCA_FR = "LexoraCA_FR",
    LexoraFrench = "LexoraFrench",
    BacaCA_EN = "BacaCA_EN",
    no = "no"
}
export type AffiliatorNameUI = {
    bg: string;
};

export const AFFILIATOR_NAME_UI: Record<AffiliatorName, AffiliatorNameUI> = {
    [AffiliatorName.LexoraCA_EN]: {
        bg: "#ff7b00",
    },
    [AffiliatorName.LexoraCA_FR]: {
        bg: "#6dbb40",
    },
    [AffiliatorName.LexoraFrench]: {
        bg: "#9640bb",
    },
    [AffiliatorName.BacaCA_EN]: {
        bg: "#40bbaf",
    },
    [AffiliatorName.no]: {
        bg: "#3f8cff",
    },

};
export const affiliatorLabels: Record<string, string> = {
    LexoraCA_FR: "LexoraCA_FR",
    LexoraCA_EN: "LexoraCA_EN",

};