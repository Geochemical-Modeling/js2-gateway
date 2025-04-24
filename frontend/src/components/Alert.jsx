export default function Alert({title, subtitle, type="info"}) {
  const typeMap = {
    "info": ["rvt-alert--info", "information-alert-title", "info"],
    "success": ["rvt-alert--success", "success-alert-title", "success"],
    "warning": ["rvt-alert--warning", "warning-alert-title", "warning"],
    "error": ["rvt-alert--danger", "error-alert-title", "error"]
  }
  const currentTypeInfo = typeMap[type]
  return (
    <div className={`rvt-alert ${currentTypeInfo[0]}`} role="alert" aria-labelledby={`${currentTypeInfo[1]}`} data-rvt-alert={`${currentTypeInfo[2]}`}>
      <div className="rvt-alert__title" id={`${currentTypeInfo[1]}`}>{title}</div>
      <p className="rvt-alert__message">{subtitle}</p>
      <button className="rvt-alert__dismiss" data-rvt-alert-close>
        <span className="rvt-sr-only">Dismiss this alert</span>
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">  <path d="m3.5 2.086 4.5 4.5 4.5-4.5L13.914 3.5 9.414 8l4.5 4.5-1.414 1.414-4.5-4.5-4.5 4.5L2.086 12.5l4.5-4.5-4.5-4.5L3.5 2.086Z"/></svg>
      </button>
    </div>
  )
}