/**儲存 localStage 資料 */
export const setLocalStageData = (key, value) => {
  localStorage.setItem(key, value)
}

/**取得 localStage 資料*/
export const getLocalStageData = (key, trans = '') => {
  let output = localStorage.getItem(key)

  switch (trans) {
    case 'boolean':
      output = Boolean(output)
      break

    default:
      break
  }
  return output
}

/**清除指定 localStage 資料*/
export const removeLocalStageData = (key) => {
  localStorage.removeItem(key)
}

export const formatDateWithTimezone = (dateString, timeZone) => {
  const date = new Date(dateString)
  const options = {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: timeZone
  }
  return date
    .toLocaleString('zh-TW', options)
    .replace(/\//g, '-')
    .replace(/(\d{4})-(\d{2})-(\d{2})/, '$1/$2/$3')
}
