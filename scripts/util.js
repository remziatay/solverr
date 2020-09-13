export const debounce = (func, delay = 250) => {
  let timeoutId
  return (...args) => {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => {
      timeoutId = null
      func(...args)
    }, delay)
  }
}
