import React from "react"

export interface DropDownOption {
  label: string;
  value: string;
}

interface SelectInputProps {
  listOptions: DropDownOption[];
  onChange: (e) => void;
  value: string;
}

export default function SelectInput({listOptions, onChange, value} : SelectInputProps) {
  return (
    
      <select id="select-input-default" class="rvt-select" onChange={onChange} value={value}>
        {listOptions.map((option) => (
          <option value={option.value}>{option.label}</option>
        ))}
      </select>
  )
}