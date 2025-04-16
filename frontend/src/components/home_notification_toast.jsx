function HomeNotificationToast() {
  return (
    <div
      className="rvt-dialog"
      id="dialog"
      hidden
      aria-describedby="dialog-description"
      data-rvt-dialog="dialog"
      data-rvt-dialog-open-on-init
      data-rvt-dialog-bottom-right
    >
      <div className="rvt-dialog__body rvt-ts-xs">
        <p className="rvt-m-all-none" id="dialog-description">
          The preparation of this material was, in part, sponsored by an agency
          of the United States Government or Indiana University. Neither the
          United States Government, nor Indiana University, makes any warranty,
          express or implied, or assumes any legal liability or responsibility
          for the accuracy, completeness, or usefulness of any information,
          apparatus, product, or process disclosed, or represents that its use
          would not infringe privately owned rights.
          <br />
          <br />
          For additional information, contact{' '}
          <a href="mailto:supcrt@iu.edu">supcrt@iu.edu</a>.
        </p>
      </div>
      <div className="rvt-dialog__controls">
        <button
          type="button"
          className="rvt-button rvt-button--secondary"
          data-rvt-dialog-close="dialog"
        >
          <span className="rvt-ts-xs">Okay</span>
        </button>
      </div>
    </div>
  );
}

export default HomeNotificationToast;
