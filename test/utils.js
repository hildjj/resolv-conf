import {format} from 'util';

/**
 * In the context of an ava test, compare a target with a selector.  Target
 * and selector may be of any type.  All of the things that are in the
 * selector must be in the target, but the target may have other, non-selected
 * properties.
 *
 * @param {object} t Ava Assertion.
 * @param {any} target The thing to check.
 * @param {any} selector The pattern that has to match target.
 * @param {WeakSet} [dups=new WeakSet()] Used to check for circular references.
 * @returns {boolean} Was there a match?
 * @throws {Error} Circular reference in selector.
 */
export function ish(t, target, selector, dups = new WeakSet()) {
  let success = false;
  let message = '%o !== %o';

  switch (typeof selector) {
    case 'bigint':
    case 'boolean':
    case 'function':
    case 'number':
    case 'string':
    case 'symbol':
    case 'undefined':
      success = Object.is(target, selector);
      break;
    case 'object':
      if (selector === null) {
        success = Object.is(target, selector);
        break;
      }
      if (selector instanceof RegExp) {
        success = selector.test(target);
        message = '%o does not match %o';
        break;
      }
      if (dups.has(selector)) {
        throw new Error('Circular reference in selector');
      }
      dups.add(selector);
      if (Array.isArray(selector)) {
        if (!Array.isArray(target)) {
          message = 'Object not array: %o not like %o';
          break;
        }
        // Ensure that each item in the selector is in the array.
        // Order does not matter at the moment.
        success = true;
        for (const s of selector) {
          // Pass in t=null so we don't error on non-matching array items
          if (!target.some(o => ish(null, o, s, dups))) {
            success = false;
            message = `${s} not found in %o, expected %o`;
            break;
          }
        }
        break;
      }
      // TODO: Add support for Set, Map, WeakSet, WeakMap, Buffer,
      // TypedArrays, etc.

      // Plain-ish object
      success = true;
      for (const [k, v] of Object.entries(selector)) {
        if (!Object.prototype.hasOwnProperty.call(target, k)) {
          success = false;
          message = `No key for "${k}" in %o, expected %o`;
          break;
        }
        if (!ish(t, target[k], v, dups)) {
          success = false;
          message = `No match for key ${k} in %o, expected %o`;
          break;
        }
      }
      break;
    default:
      message = `Unknown selector type "${typeof selector}"`;
      break;
  }

  // Clear it out on the way back down.  It's ok for the same object to
  // appear twice as peers, for example.
  dups.delete(selector);
  if (t) {
    if (success) {
      t.pass();
    } else {
      t.fail(format(message, target, selector));
    }
  }
  return success;
}
