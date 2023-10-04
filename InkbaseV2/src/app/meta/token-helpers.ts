import LabelToken from './LabelToken';
import NumberToken from './NumberToken';
import Token from './Token';

export type TokenWithVariable = NumberToken | LabelToken;

export const isTokenWithVariable = (token: Token): token is TokenWithVariable =>
  token instanceof NumberToken || token instanceof LabelToken;
