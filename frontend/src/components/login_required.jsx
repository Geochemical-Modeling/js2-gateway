function LoginRequired() {
  return (
    <main
      id="main-content"
      className="rvt-layout__wrapper rvt-layout__wrapper--single rvt-container-sm rvt-flex rvt-grow-1"
    >
      <div className="rvt-layout__content">
        <div className="rvt-empty-state">
          <div className="rvt-empty-state__content">
            <p>You cannot access this tool without logging in.</p>
          </div>
        </div>
      </div>
    </main>
  );
}
export default LoginRequired;
