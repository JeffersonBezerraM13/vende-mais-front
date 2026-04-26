import type { FieldValues, Path, UseFormSetError } from 'react-hook-form'

export function applyFieldErrors<TFieldValues extends FieldValues>(
  setError: UseFormSetError<TFieldValues>,
  fieldErrors: Record<string, string>,
) {
  Object.entries(fieldErrors).forEach(([field, message]) => {
    setError(field as Path<TFieldValues>, { message })
  })
}
