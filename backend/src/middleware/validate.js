/**
 * Lightweight, dependency-free request validator.
 *
 * Usage:
 *   router.post('/x', validate({
 *     email:    { required: true, type: 'email' },
 *     password: { required: true, type: 'string', minLength: 6 },
 *     amount:   { type: 'number', min: 0 },
 *     status:   { type: 'string', enum: ['A', 'B'] },
 *     items:    { type: 'array' }
 *   }), controller.x);
 *
 * Validates req.body, returns 400 { message, errors } on failure. Unknown
 * fields are ignored (not stripped) so existing controllers are unaffected.
 */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const OBJECT_ID_RE = /^[a-fA-F0-9]{24}$/;

function checkField(name, rule, value) {
  const present = value !== undefined && value !== null && value !== '';

  if (!present) {
    if (rule.required) return `${name} is required`;
    return null; // optional & absent -> ok
  }

  switch (rule.type) {
    case 'email':
      if (typeof value !== 'string' || !EMAIL_RE.test(value)) return `${name} must be a valid email`;
      break;
    case 'objectId':
      if (typeof value !== 'string' || !OBJECT_ID_RE.test(value)) return `${name} must be a valid id`;
      break;
    case 'number': {
      const num = Number(value);
      if (Number.isNaN(num)) return `${name} must be a number`;
      if (rule.min !== undefined && num < rule.min) return `${name} must be >= ${rule.min}`;
      if (rule.max !== undefined && num > rule.max) return `${name} must be <= ${rule.max}`;
      break;
    }
    case 'boolean':
      if (typeof value !== 'boolean') return `${name} must be a boolean`;
      break;
    case 'array':
      if (!Array.isArray(value)) return `${name} must be an array`;
      break;
    case 'string':
    default:
      if (typeof value !== 'string') return `${name} must be a string`;
      if (rule.minLength !== undefined && value.length < rule.minLength) return `${name} must be at least ${rule.minLength} characters`;
      if (rule.maxLength !== undefined && value.length > rule.maxLength) return `${name} must be at most ${rule.maxLength} characters`;
      break;
  }

  if (rule.enum && !rule.enum.includes(value)) {
    return `${name} must be one of: ${rule.enum.join(', ')}`;
  }

  return null;
}

function validate(schema) {
  return (req, res, next) => {
    const errors = {};
    const body = req.body || {};

    for (const [name, rule] of Object.entries(schema)) {
      const err = checkField(name, rule, body[name]);
      if (err) errors[name] = err;
    }

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({ message: 'Validation failed', errors });
    }
    next();
  };
}

module.exports = { validate };
