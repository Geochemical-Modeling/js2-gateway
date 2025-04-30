
export default function RadioGroup({radioGroup, value, onChange, className}) {
  return (
    <fieldset className={`rvt-fieldset ${className}`}>
      <legend className="rvt-text-bold">{radioGroup.label}</legend>
      <ul className="rvt-list-plain">
        {
          radioGroup.options.map((option, index) => (
            <li>
              <div className="rvt-radio">
                <input 
                  type="radio" 
                  name={radioGroup.name} 
                  id={`${radioGroup.name}-${index}`}
                  value={option.value}
                  checked={value == undefined ? undefined : value == option.value}
                  onChange={onChange}
                />
                <label htmlFor={`${radioGroup.name}-${index}`}>{option.label}</label>
              </div>
            </li>
          ))
        }
      </ul>
    </fieldset>
  )
}