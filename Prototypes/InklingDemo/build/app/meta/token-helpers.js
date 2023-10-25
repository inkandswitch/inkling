import LabelToken from "./LabelToken.js";
import NumberToken from "./NumberToken.js";
import PropertyPicker from "./PropertyPicker.js";
export const isTokenWithVariable = (token) => token instanceof NumberToken || token instanceof LabelToken || token instanceof PropertyPicker;
export const isPropertyPicker = (token) => token instanceof PropertyPicker;
export const isLabelToken = (token) => token instanceof LabelToken;
export const isNumberToken = (token) => token instanceof NumberToken;
