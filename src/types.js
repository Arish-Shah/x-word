/**
 * @typedef {Object} IpuzFile
 * @property {string} title
 * @property {Dimensions} dimensions
 * @property {Array<Array<string|number|null>>} puzzle
 * @property {IpuzClues} clues
 * @property {Array<Array<string|null>>} solution
 */

/**
 * @typedef {Object} Dimensions
 * @property {number} width
 * @property {number} height
 */

/**
 * @typedef {Object} IpuzClues
 * @property {Array<IpuzClue>} Across
 * @property {Array<IpuzClue>} Down
 */

/** @typedef {[number, string]} IpuzClue */

/**
 * @typedef {Object} TransformedClue
 */
export {};
