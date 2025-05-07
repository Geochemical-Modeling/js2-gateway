export default function Select({ label, name, items, value, onChange }) {
  return (
    <div>
      <label for="select-input-default" class="rvt-label" onChange={onChange}>
        {label}
      </label>
      <select id="select-input-default" class="rvt-select">
        {items.map((item) => (
          <option value="option one">{option.label}</option>
        ))}
        <option value="option one">Option One</option>
        <option value="option two">Option Two</option>
        <option value="option three">Option Three</option>
      </select>
    </div>
  );
}
