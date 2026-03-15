'use strict';

const { error } = require('../utils/apiResponse');

/**
 * Factory: returns a middleware that validates req[source] against a Joi schema.
 *
 * @param {Object} schema   - Joi schema
 * @param {string} source   - 'body' | 'query' | 'params'
 */
const validate = (schema, source = 'body') => (req, res, next) => {
  const { error: joiError, value } = schema.validate(req[source], {
    abortEarly: false,
    stripUnknown: true,
  });

  if (joiError) {
    const details = joiError.details.map((d) => d.message);
    return error(res, 'Validation failed', 400, details);
  }

  // Replace req[source] with the sanitised + coerced value
  req[source] = value;
  return next();
};

module.exports = validate;
