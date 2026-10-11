export const trimValue = (value) => String(value ?? "").trim();

export const isEmpty = (value) => trimValue(value).length === 0;

export const isValidEmail = (value) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimValue(value));

export const isValidUrl = (value) => {
  try {
    const url = new URL(trimValue(value));
    return ["http:", "https:"].includes(url.protocol);
  } catch {
    return false;
  }
};

export const createValidator = (rules) => (values) => {
  const errors = {};

  rules.forEach((rule) => {
    const value = values[rule.field];

    if (rule.required && isEmpty(value)) {
      errors[rule.field] = rule.requiredMessage || "Este campo es obligatorio";
      return;
    }

    if (!isEmpty(value) && rule.minLength && trimValue(value).length < rule.minLength) {
      errors[rule.field] =
        rule.minLengthMessage || `Debe tener al menos ${rule.minLength} caracteres`;
      return;
    }

    if (!isEmpty(value) && rule.email && !isValidEmail(value)) {
      errors[rule.field] = rule.emailMessage || "Ingresa un correo válido";
      return;
    }

    if (!isEmpty(value) && rule.url && !isValidUrl(value)) {
      errors[rule.field] = rule.urlMessage || "Ingresa un enlace válido";
      return;
    }

    if (!isEmpty(value) && rule.numberRange) {
      const numericMatch = String(value).match(/\d+/);
      const numericValue = numericMatch ? Number(numericMatch[0]) : Number(value);
      const { min, max } = rule.numberRange;

      if (Number.isNaN(numericValue) || numericValue < min || numericValue > max) {
        errors[rule.field] =
          rule.rangeMessage || `Debe estar entre ${min} y ${max}`;
      }
    }

    if (!isEmpty(value) && rule.minDateToday) {
      const hoy = new Date().toISOString().substring(0, 10);
      if (String(value) < hoy) {
        errors[rule.field] =
          rule.minDateMessage || "La fecha no puede ser anterior a hoy";
      }
    }
  });

  return errors;
};

export const hasValidationErrors = (errors) => Object.keys(errors).length > 0;

export const normalizeFormValues = (values) =>
  Object.fromEntries(
    Object.entries(values).map(([key, value]) => [
      key,
      typeof value === "string" ? value.trim() : value,
    ])
  );

export const noticiaRules = [
  {
    field: "titulo",
    required: true,
    minLength: 5,
    requiredMessage: "El título es obligatorio",
    minLengthMessage: "El título debe tener al menos 5 caracteres",
  },
  {
    field: "descripcion",
    required: true,
    minLength: 10,
    requiredMessage: "La descripción es obligatoria",
    minLengthMessage: "La descripción debe tener al menos 10 caracteres",
  },
];

export const eventoRules = [
  {
    field: "titulo",
    required: true,
    minLength: 5,
    requiredMessage: "El título es obligatorio",
    minLengthMessage: "El título debe tener al menos 5 caracteres",
  },
  {
    field: "fecha",
    required: true,
    requiredMessage: "La fecha es obligatoria",
    minDateToday: true,
    minDateMessage: "La fecha no puede ser anterior al día de hoy",
  },
  {
    field: "lugar",
    required: true,
    minLength: 3,
    requiredMessage: "El lugar es obligatorio",
    minLengthMessage: "El lugar debe tener al menos 3 caracteres",
  },
 
  {
    field: "descripcion",
    required: true,
    minLength: 10,
    requiredMessage: "La descripción es obligatoria",
    minLengthMessage: "La descripción debe tener al menos 10 caracteres",
  },
];

export const documentoRules = [
  {
    field: "titulo",
    required: true,
    minLength: 5,
    requiredMessage: "El título es obligatorio",
    minLengthMessage: "El título debe tener al menos 5 caracteres",
  },
  {
    field: "tipo",
    required: true,
    minLength: 2,
    requiredMessage: "El tipo de documento es obligatorio",
    minLengthMessage: "El tipo debe tener al menos 2 caracteres",
  },
  {
    field: "descripcion",
    required: true,
    minLength: 10,
    requiredMessage: "La descripción es obligatoria",
    minLengthMessage: "La descripción debe tener al menos 10 caracteres",
  },
  {
    field: "url",
    url: true,
    urlMessage: "Ingresa un enlace válido que empiece con http:// o https://",
  },
];

export const usuarioRules = [
  {
    field: "nombre",
    required: true,
    minLength: 3,
    requiredMessage: "El nombre es obligatorio",
    minLengthMessage: "El nombre debe tener al menos 3 caracteres",
  },
  {
    field: "correo",
    required: true,
    email: true,
    requiredMessage: "El correo es obligatorio",
    emailMessage: "Ingresa un correo válido",
  },
  {
    field: "boleta",
    required: true,
    minLength: 3,
    requiredMessage: "La boleta es obligatoria",
    minLengthMessage: "La boleta debe tener al menos 3 caracteres",
  },
  {
    field: "carrera",
    required: true,
    minLength: 3,
    requiredMessage: "La carrera es obligatoria",
    minLengthMessage: "La carrera debe tener al menos 3 caracteres",
  },
  {
    field: "semestre",
    required: true,
    numberRange: { min: 1, max: 9 },
    requiredMessage: "El semestre es obligatorio",
    rangeMessage: "El semestre debe estar entre 1 y 9",
  },
  {
    field: "rol",
    required: true,
    requiredMessage: "Selecciona un rol",
  },
  {
    field: "estado",
    required: true,
    requiredMessage: "Selecciona un estado",
  },
  {
    field: "password",
    required: true,
    minLength: 4,
    requiredMessage: "La contraseña es obligatoria",
    minLengthMessage: "La contraseña debe tener al menos 4 caracteres",
  },
];

export const perfilRules = [
  {
    field: "nombre",
    required: true,
    minLength: 3,
    requiredMessage: "El nombre es obligatorio",
    minLengthMessage: "El nombre debe tener al menos 3 caracteres",
  },
  {
    field: "correo",
    required: true,
    email: true,
    requiredMessage: "El correo es obligatorio",
    emailMessage: "Ingresa un correo válido",
  },
  {
    field: "boleta",
    required: true,
    minLength: 3,
    requiredMessage: "La boleta es obligatoria",
    minLengthMessage: "La boleta debe tener al menos 3 caracteres",
  },
  {
    field: "carrera",
    required: true,
    minLength: 3,
    requiredMessage: "La carrera es obligatoria",
    minLengthMessage: "La carrera debe tener al menos 3 caracteres",
  },
  {
    field: "semestre",
    required: true,
    numberRange: { min: 1, max: 9 },
    requiredMessage: "El semestre es obligatorio",
    rangeMessage: "El semestre debe estar entre 1 y 9",
  },
];

export const validateNoticia = createValidator(noticiaRules);
export const validateEvento = createValidator(eventoRules);
export const validateDocumento = createValidator(documentoRules);
export const validateUsuario = createValidator(usuarioRules);
export const validatePerfil = createValidator(perfilRules);
