const MONTHS_ES = {
  enero: 0,
  febrero: 1,
  marzo: 2,
  abril: 3,
  mayo: 4,
  junio: 5,
  julio: 6,
  agosto: 7,
  septiembre: 8,
  setiembre: 8,
  octubre: 9,
  noviembre: 10,
  diciembre: 11,
};

export const parseDateValue = (value) => {
  if (!value) return null;

  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return new Date(value.getFullYear(), value.getMonth(), value.getDate());
  }

  const rawValue = String(value).trim();

  const isoDateMatch = rawValue.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoDateMatch) {
    const [, year, month, day] = isoDateMatch;
    return new Date(Number(year), Number(month) - 1, Number(day));
  }

  const spanishDateMatch = rawValue
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .match(/^(\d{1,2})\s+([a-z]+)\s+(\d{4})$/);

  if (spanishDateMatch) {
    const [, day, monthName, year] = spanishDateMatch;
    const month = MONTHS_ES[monthName];

    if (month !== undefined) {
      return new Date(Number(year), month, Number(day));
    }
  }

  const timestamp = Date.parse(rawValue);
  if (Number.isNaN(timestamp)) return null;

  const parsed = new Date(timestamp);
  return new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
};

export const getDateTimestamp = (value) => {
  const parsedDate = parseDateValue(value);
  return parsedDate ? parsedDate.getTime() : 0;
};

export const formatDateLabel = (value, options = {}) => {
  const parsedDate = parseDateValue(value);

  if (!parsedDate) return "";

  return new Intl.DateTimeFormat("es-MX", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    ...options,
  }).format(parsedDate);
};

export const formatMonthYear = (date) =>
  new Intl.DateTimeFormat("es-MX", {
    month: "long",
    year: "numeric",
  }).format(date);

export const isSameMonth = (dateA, dateB) =>
  dateA &&
  dateB &&
  dateA.getFullYear() === dateB.getFullYear() &&
  dateA.getMonth() === dateB.getMonth();

export const addMonths = (date, months) =>
  new Date(date.getFullYear(), date.getMonth() + months, 1);

export const getMonthDifference = (fromDate, toDate) =>
  (toDate.getFullYear() - fromDate.getFullYear()) * 12 +
  toDate.getMonth() -
  fromDate.getMonth();

export const getTodayMonth = () => {
  const today = new Date();
  return new Date(today.getFullYear(), today.getMonth(), 1);
};
