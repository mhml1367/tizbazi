/** عدد را با ارقام فارسی نمایش می‌دهد */
export const toFa = (n: number | string) => Number(n).toLocaleString('fa-IR', { useGrouping: false })
