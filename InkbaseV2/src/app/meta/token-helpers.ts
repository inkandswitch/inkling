import LabelToken from './LabelToken';
import NumberToken from './NumberToken';
import PropertyPicker from './PropertyPicker';
import Token from './Token';

export type TokenWithVariable = NumberToken | LabelToken;

export const isTokenWithVariable = (
  token: Token | null
): token is TokenWithVariable =>
  token instanceof NumberToken || token instanceof LabelToken;

export const isPropertyPicker = (
  token: Token | null
): token is PropertyPicker => token instanceof PropertyPicker;

export const isLabelToken = (token: Token | null): token is LabelToken =>
  token instanceof LabelToken;

export const isNumberToken = (token: Token | null): token is NumberToken =>
  token instanceof NumberToken;
