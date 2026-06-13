const Joi = require('joi');

const EMAIL_MAX = 120;
const NAME_MAX = 60;
const PHONE_DIGITS = 11;
const ADDRESS_MAX = 500;
const MSG_MAX = 2000;
const SLOT_MAX = 64;
const NOTE_MAX = 500;

/** Только цифры → 11 символов: +7…, 7…, 8xxxxxxxxxx или 9xxxxxxxxx (10 цифр) дают сохранённый вид 7 + 10 цифр. */
function normalizeRuPhoneForSchema(raw) {
  let d = String(raw ?? '').replace(/\D/g, '');
  if (d.length === 11 && d[0] === '8') return `7${d.slice(1)}`;
  if (d.length === 10 && d[0] === '9') return `7${d}`;
  return d;
}

const ruPhoneSchema = Joi.string().custom((value, helpers) => {
  const n = normalizeRuPhoneForSchema(String(value ?? '').trim());
  if (!/^7\d{10}$/.test(n)) {
    return helpers.message({
      custom: 'Телефон: 11 цифр номера России (можно указать через 7 или через 8).',
    });
  }
  return n;
});

const PASSWORD_ALLOWED_CHARS_RE = /^[A-Za-z0-9!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]+$/;
const PASSWORD_SPECIAL_CHAR_RE = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/;

function validatePasswordValue(raw) {
  const s = String(raw ?? '');
  if (s.length < 8) return 'Пароль: минимум 8 символов.';
  if (s.length > 128) return 'Пароль: не более 128 символов.';
  if (!PASSWORD_ALLOWED_CHARS_RE.test(s)) {
    return 'Пароль: только латинские буквы (A–Z, a–z), цифры и спецсимволы (!@#$…).';
  }
  if (!/[A-Z]/.test(s)) return 'Пароль: нужна заглавная латинская буква (A–Z).';
  if (!/[a-z]/.test(s)) return 'Пароль: нужна строчная латинская буква (a–z).';
  if (!/\d/.test(s)) return 'Пароль: нужна цифра.';
  if (!PASSWORD_SPECIAL_CHAR_RE.test(s)) return 'Пароль: нужен спецсимвол (!@#$…).';
  return null;
}

const passwordSchema = Joi.string().custom((value, helpers) => {
  const err = validatePasswordValue(value);
  if (err) return helpers.error('any.custom', { message: err });
  return value;
});

const PSEUDO_EMAIL_SUFFIXES = ['@phone.ekvaline.local', '@ekvaline.local'];

function isPseudoClientEmail(email) {
  const e = String(email || '').trim().toLowerCase();
  if (!e) return true;
  return PSEUDO_EMAIL_SUFFIXES.some((suffix) => e.endsWith(suffix));
}

const realClientEmailSchema = Joi.string()
  .trim()
  .lowercase()
  .max(EMAIL_MAX)
  .email({ tlds: { allow: false } })
  .custom((value, helpers) => {
    if (isPseudoClientEmail(value)) {
      return helpers.message({ custom: 'Укажите ваш настоящий email — служебные адреса не принимаются.' });
    }
    return value;
  })
  .messages({
    'string.email': 'Укажите корректный email.',
    'string.max': `Email: не более ${EMAIL_MAX} символов.`,
  });

const checkRegistrationSchema = Joi.object({
  email: realClientEmailSchema.optional(),
  phone: ruPhoneSchema.optional(),
})
  .or('email', 'phone')
  .messages({
    'object.missing': 'Укажите email или телефон для проверки.',
  });

const authCodeSchema = Joi.string()
  .trim()
  .pattern(/^\d{6}$/)
  .required()
  .messages({
    'string.pattern.base': 'Код: 6 цифр.',
    'any.required': 'Введите код из письма.',
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
  email: realClientEmailSchema.required(),
  phone: ruPhoneSchema.required(),
  password: passwordSchema.required(),
});

const clientLoginSchema = Joi.object({
  email: realClientEmailSchema.required(),
  password: Joi.string().min(1).max(128).required(),
});

const loginSchema = Joi.object({
  credential: Joi.string().trim().min(3).max(EMAIL_MAX + 5).required(),
  password: Joi.string().min(1).max(128).required(),
});

const forgotPasswordSchema = Joi.object({
  email: realClientEmailSchema.required(),
});

const resetPasswordSchema = Joi.object({
  token: Joi.string().trim().min(16).max(128).required(),
  password: passwordSchema.required(),
});

const confirmEmailCodeSchema = Joi.object({
  code: authCodeSchema,
});

const changePasswordWithCodeSchema = Joi.object({
  code: authCodeSchema,
  password: passwordSchema.required(),
});

const resetPasswordByEmailSchema = Joi.object({
  email: realClientEmailSchema.required(),
  code: authCodeSchema,
  password: passwordSchema.required(),
});

const checkPasswordResetByEmailSchema = Joi.object({
  email: realClientEmailSchema.required(),
  code: authCodeSchema,
});

const profileSchema = Joi.object({
  first_name: Joi.string()
    .trim()
    .min(2)
    .max(NAME_MAX)
    .required()
    .messages({
      'string.min': 'Имя: минимум 2 символа.',
      'string.max': `Имя: не более ${NAME_MAX} символов.`,
      'any.required': 'Укажите имя.',
    }),
  last_name: Joi.string()
    .trim()
    .max(NAME_MAX)
    .allow('')
    .messages({
      'string.max': `Фамилия: не более ${NAME_MAX} символов.`,
    }),
  email: realClientEmailSchema.required(),
  phone: ruPhoneSchema.required(),
});

/** Имя в форме обратной связи: только буквы (любой алфавит); слова через пробел. \p{L} включает ё, ґ и т.д. */
const FEEDBACK_NAME_PATTERN = /^[\p{L}]+(?: [\p{L}]+)*$/u;

const feedbackContactedPatchSchema = Joi.object({
  contacted: Joi.boolean().required(),
});

const feedbackSchema = Joi.object({
  name: Joi.string()
    .trim()
    .min(2)
    .max(40)
    .pattern(FEEDBACK_NAME_PATTERN)
    .required()
    .messages({
      'string.pattern.base': 'Имя: только буквы, слова через пробел.',
    }),
  phone: ruPhoneSchema.required(),
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

const driverDutySchema = Joi.object({
  on_duty: Joi.boolean().required(),
});

const adminUserPatchSchema = Joi.object({
  blocked: Joi.number().valid(0, 1).optional(),
  role: Joi.string().valid('client', 'operator', 'manager', 'admin', 'driver').optional(),
  driver_route_label: Joi.string().trim().max(120).allow('', null).optional(),
}).min(1);

const adminStaffPasswordSetSchema = Joi.object({
  password: passwordSchema.required(),
  gate_code: Joi.string().trim().min(1).max(32).required().messages({
    'any.required': 'Введите секретный код.',
    'string.empty': 'Введите секретный код.',
  }),
});

const adminUserCreateSchema = Joi.object({
  first_name: Joi.string().trim().min(2).max(NAME_MAX).required(),
  last_name: Joi.string().trim().max(NAME_MAX).allow('').optional(),
  email: Joi.string().trim().lowercase().max(EMAIL_MAX).email({ tlds: { allow: false } }).required(),
  phone: ruPhoneSchema.required(),
  password: passwordSchema.required(),
  /** С админ-панели создаются только сотрудники; клиенты — через регистрацию на сайте. */
  role: Joi.string().valid('operator', 'manager', 'admin', 'driver').required(),
  driver_route_label: Joi.string().trim().max(120).allow('', null).optional(),
});

const PRODUCT_NAME_MAX = 180;
const PRODUCT_DESC_MAX = 400;
const PRODUCT_PRICE_MAX = 1_000_000;
const PRODUCT_VOLUME_MAX = 1000;
const PRODUCT_SORT_MAX = 99999;

const productPriceSchema = Joi.number()
  .min(0)
  .max(PRODUCT_PRICE_MAX)
  .messages({
    'number.base': 'Цена должна быть числом.',
    'number.min': 'Цена не может быть отрицательной.',
    'number.max': `Цена не может превышать ${PRODUCT_PRICE_MAX.toLocaleString('ru-RU')} ₽.`,
    'number.unsafe': `Цена слишком большая. Максимум ${PRODUCT_PRICE_MAX.toLocaleString('ru-RU')} ₽.`,
  });

const adminProductCreateSchema = Joi.object({
  category_id: Joi.number().integer().positive().required().messages({
    'number.base': 'Выберите категорию.',
    'number.positive': 'Выберите категорию.',
    'any.required': 'Выберите категорию.',
  }),
  name: Joi.string()
    .trim()
    .min(2)
    .max(PRODUCT_NAME_MAX)
    .required()
    .messages({
      'string.min': 'Название: минимум 2 символа.',
      'string.max': `Название: не более ${PRODUCT_NAME_MAX} символов.`,
      'string.empty': 'Укажите название товара.',
      'any.required': 'Укажите название товара.',
    }),
  description: Joi.string()
    .trim()
    .max(PRODUCT_DESC_MAX)
    .allow('')
    .optional()
    .messages({
      'string.max': `Описание: не более ${PRODUCT_DESC_MAX} символов.`,
    }),
  price: productPriceSchema.required().messages({
    'any.required': 'Укажите цену.',
  }),
  volume_liters: Joi.number()
    .min(0)
    .max(PRODUCT_VOLUME_MAX)
    .allow(null)
    .optional()
    .messages({
      'number.base': 'Объём должен быть числом.',
      'number.min': 'Объём не может быть отрицательным.',
      'number.max': `Объём: не более ${PRODUCT_VOLUME_MAX} л.`,
      'number.unsafe': `Объём слишком большой. Максимум ${PRODUCT_VOLUME_MAX} л.`,
    }),
  stock: Joi.number().integer().min(0).max(1_000_000).required(),
  sort_order: Joi.number()
    .integer()
    .min(0)
    .max(PRODUCT_SORT_MAX)
    .optional()
    .messages({
      'number.base': 'Сортировка должна быть числом.',
      'number.integer': 'Сортировка: только целое число.',
      'number.min': 'Сортировка не может быть отрицательной.',
      'number.max': `Сортировка: не более ${PRODUCT_SORT_MAX}.`,
      'number.unsafe': `Сортировка слишком большая. Максимум ${PRODUCT_SORT_MAX}.`,
    }),
  hidden: Joi.number().valid(0, 1).optional(),
  preorder: Joi.number().valid(0, 1).optional(),
});

const adminProductPatchSchema = Joi.object({
  category_id: Joi.number().integer().positive().optional().messages({
    'number.base': 'Категория указана неверно.',
    'number.positive': 'Выберите категорию.',
  }),
  name: Joi.string()
    .trim()
    .min(2)
    .max(PRODUCT_NAME_MAX)
    .optional()
    .messages({
      'string.min': 'Название: минимум 2 символа.',
      'string.max': `Название: не более ${PRODUCT_NAME_MAX} символов.`,
    }),
  description: Joi.string()
    .trim()
    .max(PRODUCT_DESC_MAX)
    .allow('')
    .optional()
    .messages({
      'string.max': `Описание: не более ${PRODUCT_DESC_MAX} символов.`,
    }),
  price: productPriceSchema.optional(),
  volume_liters: Joi.number()
    .min(0)
    .max(PRODUCT_VOLUME_MAX)
    .allow(null)
    .optional()
    .messages({
      'number.base': 'Объём должен быть числом.',
      'number.min': 'Объём не может быть отрицательным.',
      'number.max': `Объём: не более ${PRODUCT_VOLUME_MAX} л.`,
      'number.unsafe': `Объём слишком большой. Максимум ${PRODUCT_VOLUME_MAX} л.`,
    }),
  stock: Joi.number().integer().min(0).max(1_000_000).optional(),
  sort_order: Joi.number()
    .integer()
    .min(0)
    .max(PRODUCT_SORT_MAX)
    .optional()
    .messages({
      'number.base': 'Сортировка должна быть числом.',
      'number.integer': 'Сортировка: только целое число.',
      'number.min': 'Сортировка не может быть отрицательной.',
      'number.max': `Сортировка: не более ${PRODUCT_SORT_MAX}.`,
      'number.unsafe': `Сортировка слишком большая. Максимум ${PRODUCT_SORT_MAX}.`,
    }),
  hidden: Joi.number().valid(0, 1).optional(),
  preorder: Joi.number().valid(0, 1).optional(),
}).min(1);

const operatorOrderLineSchema = Joi.object({
  title: Joi.string().trim().min(1).max(180).required(),
  qty: Joi.number().integer().min(1).max(50).required(),
  unit_price: Joi.number().min(0).max(1_000_000).required(),
  product_id: Joi.number().integer().positive().allow(null).optional(),
});

const operatorOrderCreateSchema = Joi.object({
  customer_name: Joi.string().trim().min(2).max(NAME_MAX).required(),
  customer_phone: Joi.string().trim().min(10).max(32).required(),
  address: Joi.string().trim().min(5).max(ADDRESS_MAX).required(),
  delivery_date: Joi.string()
    .pattern(/^\d{4}-\d{2}-\d{2}$/)
    .required()
    .messages({ 'string.pattern.base': 'Дата доставки: формат ГГГГ-ММ-ДД.' }),
  delivery_slot: Joi.string().trim().min(3).max(SLOT_MAX).required(),
  payment_method: Joi.string().trim().min(2).max(64).required(),
  zone: Joi.string().trim().max(120).allow('').optional(),
  driver: Joi.string().trim().max(120).allow('').optional(),
  courier_note: Joi.string().trim().max(NOTE_MAX).allow('').optional(),
  pickup: Joi.number().valid(0, 1).optional(),
  items: Joi.array().items(operatorOrderLineSchema).min(1).max(30).optional(),
  product_title: Joi.string().trim().min(1).max(180).optional(),
  qty: Joi.number().integer().min(1).max(50).optional(),
  unit_price: Joi.number().min(0).max(1_000_000).optional(),
}).or('items', 'product_title');

const orderCreateSchema = Joi.object({
  address: Joi.string().trim().min(5).max(ADDRESS_MAX).required(),
  delivery_date: Joi.string()
    .pattern(/^\d{4}-\d{2}-\d{2}$/)
    .required()
    .messages({ 'string.pattern.base': 'Дата доставки: формат ГГГГ-ММ-ДД.' }),
  delivery_slot: Joi.string().trim().min(3).max(SLOT_MAX).required(),
  payment_method: Joi.string().valid('cash', 'card', 'bonuses').required(),
  courier_note: Joi.string().trim().max(NOTE_MAX).allow('').optional(),
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
  change_reason: Joi.string().trim().max(2000).allow('').optional(),
}).min(1);

/** Клиент меняет адрес/дату/слот до передачи в доставку */
const orderClientPatchSchema = Joi.object({
  address: Joi.string().trim().min(5).max(ADDRESS_MAX).optional(),
  delivery_date: Joi.string()
    .pattern(/^\d{4}-\d{2}-\d{2}$/)
    .optional()
    .messages({ 'string.pattern.base': 'Дата: формат ГГГГ-ММ-ДД.' }),
  delivery_slot: Joi.string().trim().min(3).max(SLOT_MAX).optional(),
  change_reason: Joi.string().trim().max(2000).allow('').optional(),
}).min(1);

const orderCancelReasonSchema = Joi.object({
  reason: Joi.string().trim().min(3).max(2000).required(),
});

/** Вопросы в блоке FAQ на странице «Доставка» (редактирует администратор в настройках). */
const deliveryFaqItemSchema = Joi.object({
  code: Joi.string().trim().min(1).max(40).required(),
  tag: Joi.string().trim().min(1).max(60).required(),
  question: Joi.string().trim().min(3).max(180).required(),
  answer: Joi.string().trim().min(3).max(900).required(),
});

const sitePollOptionSchema = Joi.object({
  id: Joi.string().trim().min(1).max(48).required(),
  text: Joi.string().trim().min(1).max(160).required(),
});

const sitePollSchema = Joi.object({
  id: Joi.string().trim().min(1).max(56).required(),
  title: Joi.string().trim().max(120).allow('').required(),
  question: Joi.string().trim().min(3).max(400).required(),
  active: Joi.boolean().required(),
  options: Joi.array().items(sitePollOptionSchema).min(2).max(12).required(),
  createdAt: Joi.string().trim().max(40).allow('').optional(),
  updatedAt: Joi.string().trim().max(40).allow('').optional(),
});

const pollVoteSchema = Joi.object({
  poll_id: Joi.string().trim().min(1).max(56).required(),
  option_id: Joi.string().trim().min(1).max(48).required(),
});

const blogHydrationPollPutSchema = Joi.object({
  poll: Joi.object({
    id: Joi.string().trim().min(1).max(56).required(),
    title: Joi.string().trim().max(40).allow('').required(),
    question: Joi.string().trim().min(3).max(120).required(),
    active: Joi.boolean().required(),
    options: Joi.array()
      .items(
        Joi.object({
          id: Joi.string().trim().min(1).max(48).required(),
          text: Joi.string().trim().min(1).max(60).required(),
        })
      )
      .min(2)
      .max(8)
      .required(),
    createdAt: Joi.string().trim().max(40).allow('').optional(),
    updatedAt: Joi.string().trim().max(40).allow('').optional(),
  })
    .allow(null)
    .required(),
});

const blogCommentSchema = Joi.object({
  id: Joi.string().trim().min(1).max(80).required(),
  name: Joi.string().trim().max(80).allow('').required(),
  text: Joi.string().trim().min(1).max(500).required(),
  likes: Joi.number().integer().min(0).default(0),
  userId: Joi.alternatives().try(Joi.number().integer().positive(), Joi.valid(null)).optional(),
  createdAt: Joi.string().trim().max(40).allow('').optional(),
  replies: Joi.array().items(Joi.object()).max(20).optional(),
}).unknown(true);

const blogPostSchema = Joi.object({
  id: Joi.string().trim().min(1).max(40).required(),
  title: Joi.string().trim().min(1).max(120).required(),
  excerpt: Joi.string().trim().max(400).allow('').required(),
  details: Joi.string().trim().max(4000).allow('').optional(),
  image: Joi.string().trim().max(280).allow('').required(),
  imageMode: Joi.string().valid('cover', 'contain').optional(),
  imageBg: Joi.string().trim().max(20).allow('').optional(),
  readTime: Joi.string().trim().max(20).allow('').optional(),
  createdAt: Joi.string().trim().max(40).required(),
  likes: Joi.number().integer().min(0).default(0),
  views: Joi.number().integer().min(0).optional(),
  comments: Joi.array().items(blogCommentSchema).max(200).default([]),
  reactions: Joi.object({
    useful: Joi.number().integer().min(0).default(0),
    new: Joi.number().integer().min(0).default(0),
    tryIt: Joi.number().integer().min(0).default(0),
  }).default({ useful: 0, new: 0, tryIt: 0 }),
  saved: Joi.boolean().optional(),
}).unknown(true);

const blogAdminDataSchema = Joi.object({
  factOfDay: Joi.string().trim().max(400).allow('').required(),
  hiddenPostIds: Joi.array().items(Joi.string().trim().max(40)).max(50).required(),
  extraStories: Joi.array().items(Joi.object()).max(30).required(),
  storyOverrides: Joi.object().required(),
  tips: Joi.array().items(Joi.string().trim().max(120)).max(20).required(),
  recipes: Joi.array().items(Joi.string().trim().max(120)).max(20).required(),
  popular: Joi.array().items(Joi.string().trim().max(120)).max(20).required(),
  blockTitles: Joi.object().required(),
  hydrationPoll: Joi.alternatives().try(Joi.object().unknown(true), Joi.valid(null)).required(),
}).unknown(true);

const blogManagerPutSchema = Joi.object({
  posts: Joi.array().items(blogPostSchema).max(50).required(),
  admin: blogAdminDataSchema.required(),
  reads: Joi.object().pattern(Joi.string(), Joi.number().integer().min(0)).optional(),
});

const blogEngagementSchema = Joi.object({
  op: Joi.string().valid('like', 'react', 'addComment', 'commentLike', 'fullRead').required(),
  kind: Joi.string().valid('useful', 'new', 'tryIt', 'try').when('op', {
    is: 'react',
    then: Joi.required(),
    otherwise: Joi.optional(),
  }),
  text: Joi.string().trim().min(1).max(500).when('op', {
    is: 'addComment',
    then: Joi.required(),
    otherwise: Joi.optional(),
  }),
  commentId: Joi.string().trim().min(1).max(80).when('op', {
    is: 'commentLike',
    then: Joi.required(),
    otherwise: Joi.optional(),
  }),
});

/** Сертификаты на странице «О компании». */
const aboutCertificatePdfPathSchema = Joi.string()
  .trim()
  .max(280)
  .pattern(/^(assets\/|\/assets\/)[^?\s#]+\.pdf$/i)
  .allow('');

const aboutCertificateItemSchema = Joi.object({
  image: Joi.string().trim().min(3).max(600000).required(),
  alt: Joi.string().trim().min(1).max(200).required(),
  badge: Joi.string().trim().max(80).allow('').required(),
  title: Joi.string().trim().min(1).max(120).required(),
  description: Joi.string().trim().min(1).max(400).required(),
  pdf: aboutCertificatePdfPathSchema.optional(),
});

/** Карточки справа от карты на странице «Доставка» (блок «Зоны покрытия»). */
const deliveryCoverageCardSchema = Joi.object({
  title: Joi.string().trim().min(1).max(120).required(),
  text: Joi.string().trim().min(1).max(100).required(),
});

const deliveryCoveragePanelSchema = Joi.object({
  title: Joi.string().trim().min(3).max(160).required(),
  cards: Joi.array().items(deliveryCoverageCardSchema).min(1).max(8).required(),
});

const deliveryFaqPanelSchema = Joi.array().items(deliveryFaqItemSchema).min(1).max(30).required();

const aboutCertificatesPanelSchema = Joi.array().items(aboutCertificateItemSchema).max(12).required();

const managerSettingsSchema = Joi.object({
  workLine: Joi.string().trim().min(3).max(200).required(),
  communityIntro: Joi.string().trim().max(500).allow('').required(),
  deliverySlots: Joi.array()
    .items(Joi.string().trim().min(3).max(64))
    .min(1)
    .max(12)
    .required(),
  deliveryFaq: Joi.array().items(deliveryFaqItemSchema).min(1).max(30).required(),
  sitePolls: Joi.array().items(sitePollSchema).max(10).required(),
  aboutCertificates: Joi.array().items(aboutCertificateItemSchema).max(12).required(),
  deliveryCoverage: deliveryCoveragePanelSchema.required(),
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

const clientSavedAddressCreateSchema = Joi.object({
  label: Joi.string().trim().max(80).allow('').default(''),
  address_line: Joi.string().trim().min(5).max(ADDRESS_MAX).required(),
  is_default: Joi.boolean().optional(),
});

const clientSavedAddressPatchSchema = Joi.object({
  label: Joi.string().trim().max(80).allow('').optional(),
  address_line: Joi.string().trim().min(5).max(ADDRESS_MAX).optional(),
  is_default: Joi.boolean().optional(),
}).min(1);

const deliveryZonePatchSchema = Joi.object({
  name: Joi.string().trim().min(2).max(120).optional(),
  tariff: Joi.number().min(0).max(1_000_000).optional(),
  bounds_json: Joi.string().trim().max(20000).allow('').optional(),
}).min(1);

const operatorDeliveryAvailabilitySchema = Joi.object({
  closedDays: Joi.array()
    .items(Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/))
    .max(120)
    .default([]),
  closedSlots: Joi.array()
    .items(
      Joi.object({
        date: Joi.string()
          .pattern(/^\d{4}-\d{2}-\d{2}$/)
          .required(),
        slot: Joi.string().trim().min(3).max(32).required(),
      })
    )
    .max(400)
    .default([]),
});

/** Параметры публичного калькулятора воды на лендинге (GET query). */
const waterCalcQuerySchema = Joi.object({
  people: Joi.number().integer().min(1).max(15).required(),
  usage: Joi.string().valid('drink', 'cook', 'both').required(),
  activity: Joi.string().valid('low', 'medium', 'high').required(),
  season: Joi.string().valid('winter', 'spring-autumn', 'summer').required(),
});

const JOI_FIELD_LABELS_RU = {
  category_id: 'Категория',
  name: 'Название',
  description: 'Описание',
  price: 'Цена',
  volume_liters: 'Объём',
  stock: 'Остаток',
  sort_order: 'Сортировка',
  hidden: 'Видимость',
  first_name: 'Имя',
  last_name: 'Фамилия',
  email: 'Email',
  phone: 'Телефон',
  password: 'Пароль',
  role: 'Роль',
  credential: 'Логин',
  message: 'Сообщение',
};

/** Перевод типовых сообщений Joi (если нет своего .messages). */
function translateJoiMessage(raw) {
  let msg = String(raw || '')
    .replace(/"/g, '')
    .trim();
  if (!msg) return 'Проверьте введённые данные.';

  const rules = [
    [/must be a safe number$/i, 'число слишком большое — уменьшите значение'],
    [/must be a number$/i, 'должно быть числом'],
    [/must be an integer$/i, 'должно быть целым числом'],
    [/is required$/i, 'обязательное поле'],
    [/is not allowed to be empty$/i, 'не может быть пустым'],
    [/length must be at least (\d+)/i, 'минимум $1 символов'],
    [/length must be less than or equal to (\d+)/i, 'не более $1 символов'],
    [/fails to match the required pattern/i, 'недопустимые символы — проверьте поле'],
  ];
  for (const [re, ru] of rules) {
    const m = msg.match(re);
    if (m) {
      const fieldKey = msg.split(' ')[0];
      const label = JOI_FIELD_LABELS_RU[fieldKey] || fieldKey;
      if (m[1]) return `${label}: ${ru.replace('$1', m[1])}.`;
      return `${label}: ${ru}.`;
    }
  }

  const firstWord = msg.split(' ')[0];
  if (JOI_FIELD_LABELS_RU[firstWord]) {
    msg = `${JOI_FIELD_LABELS_RU[firstWord]}${msg.slice(firstWord.length)}`;
  }
  if (!/[.!?]$/.test(msg)) msg += '.';
  if (msg[0] >= 'a' && msg[0] <= 'z') msg = msg[0].toUpperCase() + msg.slice(1);
  return msg;
}

function validate(schema, payload) {
  const { error, value } = schema.validate(payload, { abortEarly: false, stripUnknown: true });
  if (error) {
    const msg = error.details.map((d) => translateJoiMessage(d.message)).join(' ');
    return { ok: false, error: msg, value: null };
  }
  return { ok: true, error: null, value };
}

module.exports = {
  validate,
  waterCalcQuerySchema,
  registerSchema,
  checkRegistrationSchema,
  clientLoginSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  confirmEmailCodeSchema,
  changePasswordWithCodeSchema,
  resetPasswordByEmailSchema,
  checkPasswordResetByEmailSchema,
  profileSchema,
  feedbackSchema,
  feedbackContactedPatchSchema,
  driverDutySchema,
  adminUserPatchSchema,
  adminStaffPasswordSetSchema,
  adminUserCreateSchema,
  adminProductCreateSchema,
  adminProductPatchSchema,
  orderCreateSchema,
  operatorOrderCreateSchema,
  orderPatchSchema,
  orderClientPatchSchema,
  orderCancelReasonSchema,
  managerSettingsSchema,
  deliveryFaqItemSchema,
  sitePollSchema,
  sitePollOptionSchema,
  pollVoteSchema,
  blogHydrationPollPutSchema,
  blogManagerPutSchema,
  blogEngagementSchema,
  aboutCertificateItemSchema,
  deliveryCoverageCardSchema,
  deliveryCoveragePanelSchema,
  deliveryFaqPanelSchema,
  aboutCertificatesPanelSchema,
  deliveryAddressCreateSchema,
  deliveryAddressPatchSchema,
  clientSavedAddressCreateSchema,
  clientSavedAddressPatchSchema,
  deliveryZonePatchSchema,
  operatorDeliveryAvailabilitySchema,
  passwordSchema,
  isPseudoClientEmail,
  realClientEmailSchema,
  EMAIL_MAX,
  NAME_MAX,
  MSG_MAX,
  ADDRESS_MAX,
};
