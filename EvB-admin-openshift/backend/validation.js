import Joi from 'joi'

// validation for voter
const voterValidation = (voter) => {
  const schema = Joi.object({
    nim: Joi.string().pattern(new RegExp('^[A-D0-9.]*$')).required().messages({
      'string.pattern.base': `nim allowed alphanumeric and . only!`,
    }),
    fullname: Joi.string()
      .pattern(new RegExp('^[a-zA-Z ]*$'))
      .required()
      .uppercase()
      .messages({
        'string.pattern.base': `fullname allowed alphabet and space only!`,
      }),
    email: Joi.string().email().required(),
    password: Joi.string().min(5).messages({
      'string.min': `password min.{#limit} character!`,
    }),
    public_key: Joi.string(),
  })
  // abortearly : biar semua error tampil dalam array
  return schema.validate(voter, { abortEarly: false })
}

// validation for candidate
const candidateValidation = (candidate) => {
  const schema = Joi.object({
    candidate: Joi.string()
      .pattern(new RegExp('^[a-zA-Z ]*$'))
      .required()
      .messages({
        'string.pattern.base': `candidate name allowed alphabet and space only!`,
      }),
    viceCandidate: Joi.string()
      .pattern(new RegExp('^[a-zA-Z ]*$'))
      .messages({
        'string.pattern.base': `vice candidate name allowed alphabet and space only!`,
      })
      .empty(''),
  })
  // abortearly : biar semua error tampil dalam array
  return schema.validate(candidate, { abortEarly: false })
}

// voter field validation
const voterValidate = (key, type) => {
  let schema
  if (type === 'validateByKey') {
    schema = Joi.object({
      key: Joi.string()
        .min(6)
        .max(6)
        .pattern(new RegExp('^[a-zA-Z0-9]*$'))
        .required(),
    })
  } else if (type === 'validateByNim') {
    schema = Joi.object({
      nim: Joi.string()
        .pattern(new RegExp('^[A-D0-9.]*$'))
        .required()
        .messages({
          'string.pattern.base': `nim allowed alphanumeric and . only!`,
        }),
    })
  }
  return schema.validate(key)
}

export { voterValidation, candidateValidation, voterValidate }
