const Joi = require('joi');

const EMAIL_MAX = 120;
const NAME_MAX = 60;
const PHONE_DIGITS = 11;
const ADDRESS_MAX = 500;
const MSG_MAX = 2000;
const SLOT_MAX = 64;
const NOTE_MAX = 500;

const passwordSchema = Joi.string()
  .min(8)
  .max(128)
  .pattern(/[A-ZА-ЯЁ]/)
  .pattern(/[a-zа-яё]/)
  .pattern(/\d/)
  .pattern(/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/)
  .messages({
    'string.min': 'Пароль: минимум 8 символов.',
    'string.max': 'Пароль: не более 128 символов.',
    'string.pattern.base':
      'Пароль: нужны заглавная и строчная буквы, цифра и спецсимвол (!@#$…).',
  });

const registerSchema = Joi.object({
  first_name: Joi.string()
    .trim()
    .min(2)
    .max(NAME_MAX)
    .pattern(/^[A-Za-zА-Яа-яЁё\s\-']+$/)
    .required()
    .messages({
      'string.min': 'Имя: минимум 2 символа.',
      'string.max': `Имя: не более ${NAME_MAX} символов.`,
      'string.pattern.base': 'Имя: только буквы, пробел, дефис и апостроф.',
    }),
  last_name: Joi.string()
    .trim()
    .max(NAME_MAX)
    .allow('')
    .pattern(/^[A-Za-zА-Яа-яЁё\s\-']*$/)
    .messages({
      'string.max': `Фамилия: не более ${NAME_MAX} символов.`,
      'string.pattern.base': 'Фамилия: только буквы, пробел, дефис и апостроф.',
    }),
  email: Joi.string()
    .trim()
    .lowercase()
    .max(EMAIL_MAX)
    .email({ tlds: { allow: false } })
    .required()
    .messages({
      'string.email': 'Укажите корректный email.',
      'string.max': `Email: не более ${EMAIL_MAX} символов.`,
    }),
  phone: Joi.string()
    .pattern(/^7\d{10}$/)
    .required()
    .messages({ 'string.pattern.base': 'Телефон: 11 цифр, формат +7…' }),
  password: passwordSchema.required(),
});

const loginSchema = Joi.object({
  credential: Joi.string().trim().min(3).max(EMAIL_MAX + 5).required(),
  password: Joi.string().min(1).max(128).required(),
});

const profileSchema = Joi.object({
  first_name: Joi.string()
    .trim()
    .min(2)
    .max(NAME_MAX)
    .pattern(/^[A-Za-zА-Яа-яЁё\s\-']+$/)
    .required(),
  last_name: Joi.string()
    .trim()
    .max(NAME_MAX)
    .allow('')
    .pattern(/^[A-Za-zА-Яа-яЁё\s\-']*$/),
  email: Joi.string()
    .trim()
    .lowercase()
    .max(EMAIL_MAX)
    .email({ tlds: { allow: false } })
    .required(),
  phone: Joi.string()
    .pattern(/^7\d{10}$/)
    .required(),
});

const feedbackSchema = Joi.object({
  name: Joi.string()
    .trim()
    .min(2)
    .max(40)
    .pattern(/^[A-Za-zА-Яа-яЁё\s\-']+$/)
    .required(),
  phone: Joi.string()
    .pattern(/^7\d{10}$/)
    .required()
    .messages({ 'string.pattern.base': 'Телефон: 11 цифр.' }),
  message: Joi.string()
    .trim()
    .min(10)
    .max(400)
    .pattern(/^[^\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F<>]+$/)
    .required()
    .messages({
      'string.min': 'Сообщение: минимум 10 символов.',
      'string.max': 'Сообщение: не более 400 символов.',
      'string.pattern.base': 'Сообщение содержит недопустимые символы.',
    }),
});

const adminUserPatchSchema = Joi.object({
  blocked: Joi.number().valid(0, 1).optional(),
  role: Joi.string().valid('client', 'operator', 'manager', 'admin').optional(),
}).min(1);

const adminUserCreateSchema = Joi.object({
  first_name: Joi.string().trim().min(2).max(NAME_MAX).required(),
  last_name: Joi.string().trim().max(NAME_MAX).allow('').optional(),
  email: Joi.string().trim().lowercase().max(EMAIL_MAX).email({ tlds: { allow: false } }).required(),
  phone: Joi.string().pattern(/^7\d{10}$/).required(),
  password: passwordSchema.required(),
  role: Joi.string().valid('operator', 'manager', 'admin').required(),
});

const adminProductCreateSchema = Joi.object({
  category_id: Joi.number().integer().positive().required(),
  name: Joi.string().trim().min(2).max(180).required(),
  description: Joi.string().trim().max(400).allow('').optional(),
  price: Joi.number().min(0).max(1_000_000).required(),
  volume_liters: Joi.number().min(0).max(1000).allow(null).optional(),
  stock: Joi.number().integer().min(0).max(1_000_000).required(),
  sort_order: Joi.number().integer().min(0).max(99999).optional(),
  hidden: Joi.number().valid(0, 1).optional(),
});

const adminProductPatchSchema = Joi.object({
  category_id: Joi.number().integer().positive().optional(),
  name: Joi.string().trim().min(2).max(180).optional(),
  description: Joi.string().trim().max(400).allow('').optional(),
  price: Joi.number().min(0).max(1_000_000).optional(),
  volume_liters: Joi.number().min(0).max(1000).allow(null).optional(),
  stock: Joi.number().integer().min(0).max(1_000_000).optional(),
  sort_order: Joi.number().integer().min(0).max(99999).optional(),
  hidden: Joi.number().valid(0, 1).optional(),
}).min(1);

const orderCreateSchema = Joi.object({
  address: Joi.string().trim().min(5).max(ADDRESS_MAX).required(),
  delivery_date: Joi.string()
    .pattern(/^\d{4}-\d{2}-\d{2}$/)
    .required()
    .messages({ 'string.pattern.base': 'Дата доставки: формат ГГГГ-ММ-ДД.' }),
  delivery_slot: Joi.string().trim().min(3).max(SLOT_MAX).required(),
  payment_method: Joi.string().valid('cash', 'card', 'bonuses').required(),
  bonuses_used: Joi.number().integer().min(0).max(1_000_000).default(0),
  items: Joi.array()
    .items(
      Joi.object({
        product_id: Joi.number().integer().positive().required(),
        qty: Joi.number().integer().min(1).max(999).required(),
      })
    )
    .min(1)
    .max(50)
    .required(),
});

const orderPatchSchema = Joi.object({
  status: Joi.string()
    .valid('new', 'pending_operator', 'processing', 'confirmed', 'courier', 'on_way', 'delivered', 'cancelled')
    .optional(),
  address: Joi.string().trim().min(5).max(ADDRESS_MAX).optional(),
  delivery_date: Joi.string()
    .pattern(/^\d{4}-\d{2}-\d{2}$/)
    .optional()
    .messages({ 'string.pattern.base': 'Дата доставки: формат ГГГГ-ММ-ДД.' }),
  delivery_slot: Joi.string().trim().min(3).max(SLOT_MAX).optional(),
  payment_method: Joi.string().trim().min(2).max(64).optional(),
  zone: Joi.string().trim().min(2).max(120).optional(),
  driver: Joi.string().trim().max(120).allow('').optional(),
  pickup: Joi.number().valid(0, 1).optional(),
  total_sum: Joi.number().min(0).max(1_000_000_000).optional(),
  items_json: Joi.string().trim().min(2).max(20000).optional(),
  courier_note: Joi.string().trim().max(NOTE_MAX).allow('').optional(),
}).min(1);

/** Клиент меняет адрес/дату/слот до передачи в доставку */
const orderClientPatchSchema = Joi.object({
  address: Joi.string().trim().min(5).max(ADDRESS_MAX).optional(),
  delivery_date: Joi.string()
    .pattern(/^\d{4}-\d{2}-\d{2}$/)
    .optional()
    .messages({ 'string.pattern.base': 'Дата: формат ГГГГ-ММ-ДД.' }),
  delivery_slot: Joi.string().trim().min(3).max(SLOT_MAX).optional(),
}).min(1);

const managerSettingsSchema = Joi.object({
  workLine: Joi.string().trim().min(3).max(200).required(),
  communityIntro: Joi.string().trim().max(500).allow('').required(),
  deliverySlots: Joi.array()
    .items(Joi.string().trim().min(3).max(64))
    .min(1)
    .max(12)
    .required(),
});

const deliveryAddressCreateSchema = Joi.object({
  label: Joi.string().trim().min(2).max(120).required(),
  address_line: Joi.string().trim().min(5).max(ADDRESS_MAX).required(),
  sort_order: Joi.number().integer().min(0).max(99999).optional(),
  active: Joi.number().valid(0, 1).optional(),
  notes: Joi.string().trim().max(300).allow('').optional(),
});

const deliveryAddressPatchSchema = Joi.object({
  label: Joi.string().trim().min(2).max(120).optional(),
  address_line: Joi.string().trim().min(5).max(ADDRESS_MAX).optional(),
  sort_order: Joi.number().integer().min(0).max(99999).optional(),
  active: Joi.number().valid(0, 1).optional(),
  notes: Joi.string().trim().max(300).allow('').optional(),
}).min(1);

const deliveryZonePatchSchema = Joi.object({
  name: Joi.string().trim().min(2).max(120).optional(),
  tariff: Joi.number().min(0).max(1_000_000).optional(),
  bounds_json: Joi.string().trim().max(20000).allow('').optional(),
}).min(1);

function validate(schema, payload) {
  const { error, value } = schema.validate(payload, { abortEarly: false, stripUnknown: true });
  if (error) {
    const msg = error.details.map((d) => d.message.replace(/"/g, '')).join(' ');
    return { ok: false, error: msg, value: null };
  }
  return { ok: true, error: null, value };
}

module.exports = {
  validate,
  registerSchema,
  loginSchema,
  profileSchema,
  feedbackSchema,
  adminUserPatchSchema,
  adminUserCreateSchema,
  adminProductCreateSchema,
  adminProductPatchSchema,
  orderCreateSchema,
  orderPatchSchema,
  orderClientPatchSchema,
  managerSettingsSchema,
  deliveryAddressCreateSchema,
  deliveryAddressPatchSchema,
  deliveryZonePatchSchema,
  passwordSchema,
  EMAIL_MAX,
  NAME_MAX,
  MSG_MAX,
  ADDRESS_MAX,
};
