type DateValue = Date | string | number

const toDate = (value: DateValue = new Date()) => {
  const date = value instanceof Date ? value : new Date(value)
  return Number.isNaN(date.getTime()) ? new Date() : date
}

export const toDateInputValue = (value?: DateValue) =>
  toDate(value).toISOString().split("T")[0]

export const toDateTimeInputValue = (value?: DateValue) =>
  toDate(value).toISOString().slice(0, 16)

export const toIsoString = (value?: DateValue) =>
  toDate(value).toISOString()
