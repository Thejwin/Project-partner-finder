'use strict';

/**
 * Builds skip/limit pagination from query params and attaches
 * a pagination envelope to any Mongoose count+find result pair.
 *
 * Usage:
 *   const { skip, limit, buildMeta } = paginate(req.query);
 *   const [total, items] = await Promise.all([Model.countDocuments(filter), Model.find(filter).skip(skip).limit(limit)]);
 *   res.json({ data: items, pagination: buildMeta(total) });
 */
const paginate = (query = {}) => {
  const page  = Math.max(1, parseInt(query.page,  10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 20));
  const skip  = (page - 1) * limit;

  const buildMeta = (total) => ({
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
    hasNext: page * limit < total,
    hasPrev: page > 1,
  });

  return { page, limit, skip, buildMeta };
};

module.exports = paginate;
