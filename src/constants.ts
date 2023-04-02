export const constants: constTypes = {
  CONTRACT: "kompwnd",
  TOKEN_CONTRACT: "kompwndtoken",
  TOKEN_SYMBOL: "KPW",
  ZERO_KPW: "0.0000 KPW",
  DECIMALS: 4,
} as const;

type constTypes = {
  CONTRACT: string;
  TOKEN_CONTRACT: string;
  TOKEN_SYMBOL: string;
  ZERO_KPW: string;
  DECIMALS: number;
};
