<<<<<<< Updated upstream
export default function FileInput({
  legend,
  label,
  required,
  id,
  onChange,
  name,
  accept,
}) {
  return (
    <fieldset className="rvt-fieldset">
      <legend className="rvt-m-bottom-sm">
        {legend}
        {required && (
          <span className="rvt-color-orange-500 rvt-text-bold">*</span>
        )}
      </legend>
      <div className="rvt-file" data-rvt-file-input={id}>
        <input
          type="file"
          name={name}
          data-rvt-file-input-button={id}
          id={id}
          aria-describedby={`file-${id}-description`}
          required={required}
          accept={accept}
          onChange={onChange}
        />
        <label htmlFor={id} className="rvt-button">
          <span>{label}</span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            fill="currentColor"
            viewBox="0 0 16 16"
          >
            {' '}
            <path d="M2 1h8.414L14 4.586V15H2V1Zm2 2v10h8V7.5H7.5V3H4Zm5.5 0v2.5H12v-.086L9.586 3H9.5Z" />
          </svg>
        </label>
        <div
          className="rvt-file__preview"
          data-rvt-file-input-preview={id}
          id={`file-${id}-description`}
        >
=======
// Best practice: Leave this uncontrolled

export default function FileInput({label, name, id, required, accept}) {
  return (
    <fieldset className="rvt-fieldset">
      <legend className="rvt-m-bottom-sm">{label} {required && (<span className="rvt-color-orange-500 rvt-text-bold">*</span>)}</legend>
      <div className="rvt-file" data-rvt-file-input="example-file-input">
        <input type="file" id={id} name={name} required={required} accept={accept}/>
        <label htmlFor={id} className="rvt-button">
          <span>Upload File</span>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">  <path d="M2 1h8.414L14 4.586V15H2V1Zm2 2v10h8V7.5H7.5V3H4Zm5.5 0v2.5H12v-.086L9.586 3H9.5Z"/></svg>
        </label>
        <div className="rvt-file__preview" data-rvt-file-input-preview="example-file-input" id={`${id}-description`}>
>>>>>>> Stashed changes
          No file selected
        </div>
      </div>
    </fieldset>
<<<<<<< Updated upstream
  );
}
=======
  )
}
>>>>>>> Stashed changes
