import type { RuleOperator } from './types';

/**
 * Evaluates a rule operator against field value and expected value
 */
export function evaluateOperator(
  operator: RuleOperator,
  fieldValue: unknown,
  expectedValue: unknown
): boolean {
  switch (operator) {
    case 'eq':
      return equals(fieldValue, expectedValue);
    
    case 'neq':
      return !equals(fieldValue, expectedValue);
    
    case 'gt':
      return greaterThan(fieldValue, expectedValue);
    
    case 'gte':
      return greaterThanOrEqual(fieldValue, expectedValue);
    
    case 'lt':
      return lessThan(fieldValue, expectedValue);
    
    case 'lte':
      return lessThanOrEqual(fieldValue, expectedValue);
    
    case 'in':
      return isIn(fieldValue, expectedValue);
    
    case 'not_in':
      return !isIn(fieldValue, expectedValue);
    
    case 'exists':
      return exists(fieldValue, expectedValue);
    
    case 'between':
      return isBetween(fieldValue, expectedValue);
    
    case 'matches':
      return matches(fieldValue, expectedValue);
    
    default:
      console.warn(`Unknown operator: ${operator}`);
      return false;
  }
}

function equals(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  
  // Handle date comparison
  if (a instanceof Date && b instanceof Date) {
    return a.getTime() === b.getTime();
  }
  
  // Handle array equality
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    return a.every((val, idx) => equals(val, b[idx]));
  }
  
  // Handle case-insensitive string comparison
  if (typeof a === 'string' && typeof b === 'string') {
    return a.toLowerCase() === b.toLowerCase();
  }
  
  return false;
}

function greaterThan(a: unknown, b: unknown): boolean {
  const numA = toNumber(a);
  const numB = toNumber(b);
  
  if (numA === null || numB === null) {
    // Try date comparison
    const dateA = toDate(a);
    const dateB = toDate(b);
    if (dateA && dateB) {
      return dateA.getTime() > dateB.getTime();
    }
    return false;
  }
  
  return numA > numB;
}

function greaterThanOrEqual(a: unknown, b: unknown): boolean {
  return equals(a, b) || greaterThan(a, b);
}

function lessThan(a: unknown, b: unknown): boolean {
  const numA = toNumber(a);
  const numB = toNumber(b);
  
  if (numA === null || numB === null) {
    const dateA = toDate(a);
    const dateB = toDate(b);
    if (dateA && dateB) {
      return dateA.getTime() < dateB.getTime();
    }
    return false;
  }
  
  return numA < numB;
}

function lessThanOrEqual(a: unknown, b: unknown): boolean {
  return equals(a, b) || lessThan(a, b);
}

function isIn(fieldValue: unknown, list: unknown): boolean {
  if (!Array.isArray(list)) {
    return false;
  }
  
  // If field value is an array, check if any element is in the list
  if (Array.isArray(fieldValue)) {
    return fieldValue.some(v => list.some(l => equals(v, l)));
  }
  
  return list.some(l => equals(fieldValue, l));
}

function exists(fieldValue: unknown, expectedExists: unknown): boolean {
  const shouldExist = expectedExists === true || expectedExists === 'true';
  const doesExist = fieldValue !== undefined && fieldValue !== null;
  
  return shouldExist ? doesExist : !doesExist;
}

function isBetween(fieldValue: unknown, range: unknown): boolean {
  if (!Array.isArray(range) || range.length !== 2) {
    console.warn('BETWEEN operator requires array of [min, max]');
    return false;
  }
  
  const [min, max] = range;
  const numValue = toNumber(fieldValue);
  const numMin = toNumber(min);
  const numMax = toNumber(max);
  
  if (numValue === null || numMin === null || numMax === null) {
    // Try date comparison
    const dateValue = toDate(fieldValue);
    const dateMin = toDate(min);
    const dateMax = toDate(max);
    
    if (dateValue && dateMin && dateMax) {
      return dateValue >= dateMin && dateValue <= dateMax;
    }
    return false;
  }
  
  return numValue >= numMin && numValue <= numMax;
}

function matches(fieldValue: unknown, pattern: unknown): boolean {
  if (typeof fieldValue !== 'string' || typeof pattern !== 'string') {
    return false;
  }
  
  try {
    const regex = new RegExp(pattern, 'i');
    return regex.test(fieldValue);
  } catch {
    console.warn(`Invalid regex pattern: ${pattern}`);
    return false;
  }
}

// Helper functions
function toNumber(value: unknown): number | null {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const num = parseFloat(value);
    return isNaN(num) ? null : num;
  }
  return null;
}

function toDate(value: unknown): Date | null {
  if (value instanceof Date) return value;
  if (typeof value === 'string' || typeof value === 'number') {
    const date = new Date(value);
    return isNaN(date.getTime()) ? null : date;
  }
  return null;
}
