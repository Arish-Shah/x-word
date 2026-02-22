/**
 * @typedef {Object} IpuzFile
 * @property {string} title
 * @property {Dimensions} dimensions
 * @property {IpuzPuzzle} puzzle
 * @property {IpuzClues} clues
 * @property {Array<Array<string|null>>} solution
 */

/**
 * @typedef {Object} Dimensions
 * @property {number} width
 * @property {number} height
 */

/**
 * @typedef {Array<Array<string|number>>} IpuzPuzzle
 */

/**
 * @typedef {Object} IpuzClues
 * @property {Array<IpuzClue>} Across
 * @property {Array<IpuzClue>} Down
 */

/** @typedef {[number, string]} IpuzClue */

/**
 * @typedef {Object} FormattedClues
 * @property {Record<string, FormattedClue>} Across
 * @property {Record<string, FormattedClue>} Down
 */

/**
 * @typedef {Object} FormattedClue
 * @property {number} number
 * @property {string} text
 * @property {string[]} cells
 */
export {};
