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
  phone: ruPhoneSchema.required(),
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
  phone: ruPhoneSchema.required(),
});

/** Имя в форме обратной связи: только буквы (любой алфавит); слова через пробел. \p{L} включает ё, ґ и т.д. */
const FEEDBACK_NAME_PATTERN = /^[\p{L}]+(?: [\p{L}]+)*$/u;

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

const adminUserPatchSchema = Joi.object({
  blocked: Joi.number().valid(0, 1).optional(),
  role: Joi.string().valid('client', 'operator', 'manager', 'admin', 'driver').optional(),
  driver_route_label: Joi.string().trim().max(120).allow('', null).optional(),
}).min(1);

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
});

/** Сертификаты на странице «О компании». */
const aboutCertificateItemSchema = Joi.object({
  image: Joi.string().trim().min(3).max(600000).required(),
  alt: Joi.string().trim().min(1).max(200).required(),
  badge: Joi.string().trim().max(80).allow('').required(),
  title: Joi.string().trim().min(1).max(120).required(),
  description: Joi.string().trim().min(1).max(400).required(),
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
  loginSchema,
  profileSchema,
  feedbackSchema,
  adminUserPatchSchema,
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
  aboutCertificateItemSchema,
  deliveryCoverageCardSchema,
  deliveryCoveragePanelSchema,
  deliveryFaqPanelSchema,
  aboutCertificatesPanelSchema,
  deliveryAddressCreateSchema,
  deliveryAddressPatchSchema,
  deliveryZonePatchSchema,
  operatorDeliveryAvailabilitySchema,
  passwordSchema,
  EMAIL_MAX,
  NAME_MAX,
  MSG_MAX,
  ADDRESS_MAX,
};
