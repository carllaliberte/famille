import{buildParabolicPortfolio,nextParabolicChantier,assertParabolicConstitution}from"./acorn-parabolic-growth-engine.mjs";
export function conductParabolicDevelopment(input={}){return nextParabolicChantier(input);}
export function buildParabolicPortfolioForMain(input={}){return buildParabolicPortfolio(input);}
export function assertParabolicDevelopment(){return assertParabolicConstitution();}